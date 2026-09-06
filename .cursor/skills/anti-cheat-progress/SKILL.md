---
name: anti-cheat-progress
description: Design, implement, review and adversarially test server-authoritative video progress tracking and 1.5x playback anti-cheat for the learning platform. Use whenever modifying playback validation, heartbeats, completion logic or unlock logic.
---

# Anti-Cheat & Progress Integrity Skill

## Security model

Assume the browser is hostile.

An attacker may:

- modify JavaScript
- call API endpoints directly
- fabricate progress requests
- manipulate timestamps
- change playback rate
- seek forward
- replay requests
- modify displayed progress
- bypass UI restrictions

Never treat client-side state as authoritative.

## Two-layer model

### Client layer

Client-side tracking exists for:

- immediate UI feedback
- anomaly detection
- playback monitoring
- deciding what progress to send

It is NOT authoritative.

### Server layer

Server independently determines accepted progress.

The server uses:

- previously accepted video position
- previous server timestamp
- current server timestamp
- newly reported position
- allowed playback rate

Only server-accepted deltas may increase authoritative watched time.

## Rate validation

For a heartbeat:

videoDelta = currentVideoTime - previousVideoTime

wallDelta = serverNow - previousServerTime

observedRate = videoDelta / wallDelta

Reject:

- negative progress
- implausibly large jumps
- excessive observed playback rate
- locked videos
- wrong course/video relationships

Be tolerant of reasonable clock jitter and buffering.

Do not make the tolerance so large that it defeats the speed cap.

## Seeking

Forward seeks must not automatically count as watched time.

If the current position jumps ahead, only legitimate elapsed playback should receive credit.

## Heartbeat design

Do not send a database request every animation frame.

Batch progress samples on the client.

Persist only server-validated progress.

Make heartbeat handling idempotent or sufficiently robust against duplicate/replayed requests.

## Completion

Completion is a server-side business rule.

Never accept:

{
  completed: true
}

from the client as proof.

The server calculates completion from authoritative accepted progress.

## Sequential unlocking

For playlist courses:

video N+1 is unavailable until video N satisfies server-side completion.

Do not rely only on hidden UI.

The API/player endpoint must enforce the rule too.

## Abuse logging

For suspicious events, consider recording:

- user
- course
- video
- old time
- new time
- server timestamps
- observed rate
- rejection reason

Do not log secrets.

## Adversarial testing

Test:

- normal 1x playback
- 1.5x playback
- slightly above 1.5x
- extreme playback speed
- forward seek
- backward seek
- fabricated heartbeat
- direct API calls
- repeated heartbeat replay
- locked video access
- manipulated completion payload

The test objective is not merely that the UI behaves correctly.

The objective is that an attacker cannot easily increase authoritative watched time.
