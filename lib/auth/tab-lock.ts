export const AUTH_TAB_LOCK = "certitube-auth-tab";

export const ALREADY_LOGGED_IN_ANOTHER_TAB =
  "You are already logged in on another tab.";

const RETRY_ATTEMPTS = 20;
const RETRY_DELAY_MS = 100;

export async function anotherTabHoldsAuthLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.locks?.query) {
    return false;
  }

  try {
    const snapshot = await navigator.locks.query();
    return (snapshot.held ?? []).some((lock) => lock.name === AUTH_TAB_LOCK);
  } catch {
    return false;
  }
}

export function holdAuthTabLock(
  onStatus: (status: "pending" | "owner" | "blocked") => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.locks) {
    onStatus("owner");
    return () => {};
  }

  let cancelled = false;
  const hold: { release: (() => void) | null } = { release: null };
  let pollId: number | null = null;

  const acquire = () =>
    new Promise<"owner" | "blocked">((resolve) => {
      void navigator.locks.request(
        AUTH_TAB_LOCK,
        { ifAvailable: true },
        (lock) => {
          if (cancelled || !lock) {
            resolve("blocked");
            return Promise.resolve();
          }

          resolve("owner");
          return new Promise<void>((release) => {
            hold.release = () => {
              hold.release = null;
              release();
            };
          });
        },
      );
    });

  const wait = () => new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));

  const startPolling = () => {
    pollId = window.setInterval(() => {
      void acquire().then((status) => {
        if (cancelled || status !== "owner") {
          return;
        }
        window.location.reload();
      });
    }, 1500);
  };

  void (async () => {
    try {
      for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
        if (cancelled) {
          return;
        }
        const status = await acquire();
        if (cancelled) {
          hold.release?.();
          return;
        }
        if (status === "owner") {
          onStatus("owner");
          return;
        }
        if (attempt === 0) {
          onStatus("pending");
        }
        await wait();
      }

      if (!cancelled) {
        onStatus("blocked");
        startPolling();
      }
    } catch {
      if (!cancelled) {
        onStatus("owner");
      }
    }
  })();

  return () => {
    cancelled = true;
    if (pollId !== null) {
      window.clearInterval(pollId);
    }
    hold.release?.();
  };
}
