# WatchProof

YouTube learning with server-validated progress and completion certificates.

A signed-in learner pastes a YouTube video or playlist URL, watches it in-app, and can download a certificate only after the server confirms enough legitimate watch time. Playback above 1.5x, seeking ahead, and fabricated heartbeats do not increase authoritative progress.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- MongoDB + Mongoose
- Custom JWT session cookies (`httpOnly`, `SameSite=Lax`) with one live session per account
- YouTube Data API v3 (server-side) and YouTube IFrame Player (`react-youtube`)
- Certificate PDFs generated with `pdf-lib` after a completion check

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `MONGODB_URI` — local MongoDB is fine (`mongodb://127.0.0.1:27017/watchproof`)
   - `JWT_SECRET` — at least 32 random characters
   - `YOUTUBE_API_KEY` — Data API v3 key (server only; never expose it to the browser)
3. Start MongoDB.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm test
```

## How progress works

The player UI can show optimistic progress. Only server-accepted heartbeat deltas increase `watchedSeconds`. A lesson completes at about 95% of duration (with a short tail allowance). Playlist lesson N+1 stays locked until lesson N is complete on the server, not just hidden in the UI.

Certificates are rendered on download. Knowing a URL is not enough: the request must be authenticated and the enrollment must belong to that user and be completed.
