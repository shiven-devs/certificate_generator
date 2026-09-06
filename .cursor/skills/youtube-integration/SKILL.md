---
name: youtube-integration
description: Implement and debug YouTube URL parsing, YouTube Data API metadata resolution, YouTube playlist handling and YouTube IFrame Player integration. Use whenever working with YouTube URLs, metadata, playlists, embeds or the player.
---

# YouTube Integration Skill

## URL parsing

Support:

- youtube.com/watch?v=VIDEO_ID
- youtu.be/VIDEO_ID
- youtube.com/playlist?list=PLAYLIST_ID
- youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID

If both video and playlist identifiers exist, follow the project rule for playlist precedence.

Do not infer IDs from arbitrary URL substrings without proper parsing.

## Metadata

For an exact video ID:

Use the YouTube Data API video metadata endpoint.

For playlists:

1. Retrieve ordered playlist items.
2. Extract video IDs.
3. Retrieve video metadata/durations in batches.

Do not use search endpoints when an exact ID is already known.

## Embed eligibility

Before allowing enrollment:

verify the video can be embedded.

Handle unavailable/private/deleted videos gracefully.

## API key security

The YouTube Data API key must remain server-side.

Never expose it to browser code.

## Player

Use the YouTube IFrame Player API for playback.

Keep player logic isolated from normal UI components when possible.

Player events should flow into the application's progress system rather than directly changing authoritative database state.

## Playback rate

The product rule is a maximum legitimate playback rate of 1.5x.

The UI must not merely hide faster playback options.

Client-side monitoring is an integrity signal.

Server-side progress validation remains authoritative.

## Documentation

Before implementation, consult the current official YouTube documentation for:

- YouTube Data API
- videos
- playlistItems
- IFrame Player API
- player events
- playback controls

Do not assume behavior of the YouTube embedded player based on the HTML5 video element.

## Error handling

Handle:

- invalid URL
- malformed ID
- API quota errors
- private video
- deleted video
- unavailable playlist
- disabled embedding
- network failures
- API response changes
