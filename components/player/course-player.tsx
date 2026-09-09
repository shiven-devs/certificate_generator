"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YouTube, {
  type YouTubeEvent,
  type YouTubePlayer,
  type YouTubeProps,
} from "react-youtube";
import { apiRequest } from "@/lib/api/client";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";
import { MAX_PLAYBACK_RATE } from "@/lib/progress/rules";
import { resumePositionSeconds } from "@/lib/progress/resume";
import { firstPlayableVideoId, isVideoUnlocked } from "@/lib/progress/unlock";
import { formatDuration } from "@/lib/youtube/duration";

type PlayerCourse = {
  id: string;
  title: string;
  sourceType: "video" | "playlist";
  items: {
    youtubeVideoId: string;
    title: string;
    description?: string;
    durationSeconds: number;
    order: number;
  }[];
};

type PlayerEnrollment = {
  id: string;
  status: "in-progress" | "completed";
  certificateUrl: string | null;
  itemProgress: {
    youtubeVideoId: string;
    watchedSeconds: number;
    completed: boolean;
    lastPositionSeconds?: number;
  }[];
};

type HeartbeatResponse = {
  decision: {
    accepted: boolean;
    creditedSeconds: number;
    completed: boolean;
    reason: string;
  };
  enrollment: PlayerEnrollment;
};

type Sample = {
  videoTime: number;
  wallTime: number;
};

const HEARTBEAT_MS = 10_000;
const SAMPLE_MS = 1_000;
const CLIENT_JITTER_SECONDS = 0.35;
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5] as const;

export function CoursePlayer({
  course,
  enrollment: initialEnrollment,
}: {
  course: PlayerCourse;
  enrollment: PlayerEnrollment;
}) {
  const redirectIfKicked = useSessionErrorRedirect();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [selectedVideoId, setSelectedVideoId] = useState(() =>
    firstPlayableVideoId(course.items, initialEnrollment.itemProgress),
  );
  const [resumeAt, setResumeAt] = useState(() => {
    const videoId = firstPlayableVideoId(course.items, initialEnrollment.itemProgress);
    const item = course.items.find((row) => row.youtubeVideoId === videoId);
    const progress = initialEnrollment.itemProgress.find(
      (row) => row.youtubeVideoId === videoId,
    );
    return resumePositionSeconds(progress?.lastPositionSeconds, item?.durationSeconds ?? 0);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<
    "idle" | "syncing" | "synced" | "error"
  >("idle");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const sampleRef = useRef<Sample | null>(null);
  const readyRef = useRef(false);

  const selectedItem = useMemo(
    () =>
      course.items.find((item) => item.youtubeVideoId === selectedVideoId) ??
      course.items[0],
    [course.items, selectedVideoId],
  );

  const selectedUnlocked = Boolean(
    selectedItem &&
      isVideoUnlocked(course.items, enrollment.itemProgress, selectedItem.youtubeVideoId),
  );

  const selectedProgress = enrollment.itemProgress.find(
    (item) => item.youtubeVideoId === selectedItem?.youtubeVideoId,
  );
  const selectedPercent = selectedItem
    ? Math.min(
        100,
        Math.round(
          ((selectedProgress?.watchedSeconds ?? 0) /
            Math.max(1, selectedItem.durationSeconds)) *
            100,
        ),
      )
    : 0;

  const playerOptions = useMemo<YouTubeProps["opts"]>(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: {
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        ...(resumeAt > 0 ? { start: Math.floor(resumeAt) } : {}),
      },
    }),
    [resumeAt],
  );

  const applyPlaybackRate = useCallback(
    async (player: YouTubePlayer, rate: number) => {
      const capped = Math.min(rate, MAX_PLAYBACK_RATE);
      await player.setPlaybackRate(capped);
      setPlaybackRate(capped);
    },
    [],
  );

  const inspectClientRate = useCallback(async () => {
    const player = playerRef.current;
    if (!player || !readyRef.current) {
      return;
    }

    const [videoTime, reportedRate] = await Promise.all([
      player.getCurrentTime(),
      player.getPlaybackRate(),
    ]);
    if (reportedRate > MAX_PLAYBACK_RATE) {
      await applyPlaybackRate(player, MAX_PLAYBACK_RATE);
      setNotice("Playback is capped at 1.5x for certificate progress.");
    }

    const wallTime = window.performance.now();
    const previous = sampleRef.current;
    sampleRef.current = { videoTime, wallTime };

    if (!previous) {
      return;
    }

    const videoDelta = videoTime - previous.videoTime;
    const wallDelta = (wallTime - previous.wallTime) / 1000;
    if (videoDelta > wallDelta * MAX_PLAYBACK_RATE + CLIENT_JITTER_SECONDS) {
      await player.seekTo(previous.videoTime, true);
      sampleRef.current = { videoTime: previous.videoTime, wallTime };
      setNotice("A forward jump was detected. Only server-validated watch time counts.");
    }
  }, [applyPlaybackRate]);

  const sendHeartbeat = useCallback(
    async (player = playerRef.current) => {
      if (!player || !selectedItem || !selectedUnlocked || !readyRef.current) {
        return;
      }

      setSyncState("syncing");
      try {
        const [currentTime, currentRate] = await Promise.all([
          player.getCurrentTime(),
          player.getPlaybackRate(),
        ]);
        const result = await apiRequest<HeartbeatResponse>(
          `/api/enrollments/${course.id}/heartbeat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              youtubeVideoId: selectedItem.youtubeVideoId,
              currentTime,
              playbackRate: currentRate,
            }),
          },
        );

        if (!result.ok) {
          if (redirectIfKicked(result.error)) {
            return;
          }
          setSyncState("error");
          setNotice(result.error.message);
          return;
        }

        setEnrollment(result.data.enrollment);
        setSyncState("synced");
        if (!result.data.decision.accepted && result.data.decision.reason !== "stale_heartbeat") {
          setNotice("That sample was not credited. Keep playback at 1.5x or slower.");
        }
      } catch {
        setSyncState("error");
        setNotice("Progress could not sync. We will try again while you watch.");
      }
    },
    [course.id, redirectIfKicked, selectedItem, selectedUnlocked],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      void inspectClientRate();
    }, SAMPLE_MS);

    return () => window.clearInterval(interval);
  }, [inspectClientRate, isPlaying, selectedVideoId]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_MS);

    return () => window.clearInterval(interval);
  }, [isPlaying, selectedVideoId, sendHeartbeat]);

  useEffect(() => {
    function flush() {
      void sendHeartbeat();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flush();
      }
    }

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sendHeartbeat]);

  async function onReady(event: YouTubeEvent) {
    playerRef.current = event.target;
    if (resumeAt > 0) {
      await event.target.seekTo(resumeAt, true);
    }
    sampleRef.current = {
      videoTime: resumeAt,
      wallTime: window.performance.now(),
    };
    readyRef.current = true;
    await applyPlaybackRate(event.target, playbackRate);
  }

  async function onPlay(event: YouTubeEvent<number>) {
    setIsPlaying(true);
    setNotice(null);
    await applyPlaybackRate(event.target, playbackRate);
    sampleRef.current = {
      videoTime: await event.target.getCurrentTime(),
      wallTime: window.performance.now(),
    };
    await sendHeartbeat(event.target);
  }

  async function onPause(event: YouTubeEvent<number>) {
    setIsPlaying(false);
    await sendHeartbeat(event.target);
  }

  async function onEnd(event: YouTubeEvent<number>) {
    setIsPlaying(false);
    await sendHeartbeat(event.target);
  }

  async function onPlaybackRateChange(event: YouTubeEvent<number>) {
    if (event.data > MAX_PLAYBACK_RATE) {
      await applyPlaybackRate(event.target, MAX_PLAYBACK_RATE);
      setNotice("Playback is capped at 1.5x for certificate progress.");
      return;
    }
    setPlaybackRate(event.data);
  }

  function selectVideo(videoId: string) {
    if (!isVideoUnlocked(course.items, enrollment.itemProgress, videoId)) {
      return;
    }
    setSelectedVideoId(videoId);
    const item = course.items.find((row) => row.youtubeVideoId === videoId);
    const progress = enrollment.itemProgress.find((row) => row.youtubeVideoId === videoId);
    setResumeAt(resumePositionSeconds(progress?.lastPositionSeconds, item?.durationSeconds ?? 0));
    setIsPlaying(false);
    setNotice(null);
    sampleRef.current = null;
    playerRef.current = null;
    readyRef.current = false;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_22rem]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="aspect-video bg-slate-950">
          {selectedItem && selectedUnlocked ? (
            <YouTube
              key={selectedItem.youtubeVideoId}
              videoId={selectedItem.youtubeVideoId}
              title={selectedItem.title}
              className="h-full w-full"
              iframeClassName="h-full w-full"
              opts={playerOptions}
              onReady={(event) => void onReady(event)}
              onPlay={(event) => void onPlay(event)}
              onPause={(event) => void onPause(event)}
              onEnd={(event) => void onEnd(event)}
              onPlaybackRateChange={(event) => void onPlaybackRateChange(event)}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300">
              Complete the previous lesson to unlock this video.
            </div>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {course.title}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {selectedItem?.title ?? "No lessons"}
              </h1>
              {selectedItem ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {formatDuration(selectedItem.durationSeconds)} — {selectedPercent}% credited
                  {resumeAt > 0 ? ` · resumes at ${formatDuration(Math.floor(resumeAt))}` : ""}
                </p>
              ) : null}
            </div>
            <SyncBadge state={syncState} />
          </div>
          <div className="mt-5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${selectedPercent}%` }}
            />
          </div>
          {selectedItem?.description ? (
            <VideoDescription text={selectedItem.description} />
          ) : null}
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Playback speed
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={playbackRate === rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    if (playerRef.current) {
                      void applyPlaybackRate(playerRef.current, rate);
                    }
                  }}
                  className={`inline-flex h-9 min-w-14 items-center justify-center rounded-lg border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    playbackRate === rate
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </fieldset>
          {notice ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {notice}
            </p>
          ) : null}
          {enrollment.status === "completed" ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
                Course complete
              </p>
              <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
                Your certificate is ready. Progress was confirmed on the server.
              </p>
              {enrollment.certificateUrl ? (
                <a
                  href={enrollment.certificateUrl}
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Download certificate
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lessons</h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {completedCount(enrollment)} / {course.items.length}
          </span>
        </div>
        <ol className="mt-4 space-y-2">
          {course.items.map((item, index) => {
            const progress = enrollment.itemProgress.find(
              (row) => row.youtubeVideoId === item.youtubeVideoId,
            );
            const unlocked = isVideoUnlocked(
              course.items,
              enrollment.itemProgress,
              item.youtubeVideoId,
            );
            const active = item.youtubeVideoId === selectedItem?.youtubeVideoId;
            return (
              <li key={item.youtubeVideoId}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => selectVideo(item.youtubeVideoId)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    active
                      ? "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/60"
                      : "border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-950 dark:disabled:text-slate-600`}
                >
                  <span className="block text-sm font-medium">
                    {index + 1}. {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                    {!unlocked
                      ? "Locked until previous lesson is complete"
                      : progress?.completed
                        ? "Completed"
                        : `${Math.round(
                            ((progress?.watchedSeconds ?? 0) /
                              Math.max(1, item.durationSeconds)) *
                              100,
                          )}% credited`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

function VideoDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 280 || text.split("\n").length > 4;

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">Description</h2>
      <p
        className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300 ${
          expanded || !long ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function completedCount(enrollment: PlayerEnrollment): number {
  return enrollment.itemProgress.filter((item) => item.completed).length;
}

function SyncBadge({
  state,
}: {
  state: "idle" | "syncing" | "synced" | "error";
}) {
  const label = {
    idle: "Ready",
    syncing: "Syncing",
    synced: "Synced",
    error: "Sync issue",
  }[state];

  const classes = {
    idle: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    syncing: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    synced: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  }[state];

  return (
    <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
