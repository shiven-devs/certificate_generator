# Certitube

YouTube learning with server-validated progress and a shareable learner profile.

A signed-in learner pastes a YouTube video or playlist URL, watches it in-app, and builds a public profile page that shows their consistency heatmap and the lectures the server credited as completed. Playback above 1.5x, seeking ahead, and fabricated heartbeats do not increase authoritative progress.

Certificate issuing is switched off (YouTube API terms), but the certificate code is kept behind the `CERTIFICATES_ENABLED` flag.

## Features

- **Email/password auth** and optional **Google sign-in** (OAuth 2.0 with PKCE)
- **One live session per account** — signing in elsewhere invalidates the previous cookie
- **Course preview** from a YouTube video or playlist URL before you enroll
- **Learning-content gate** — entertainment-style videos and playlists are rejected
- **In-app player** with a hard 1.5x speed cap, resume from last position, and playlist lessons in any order
- **Server-authoritative progress** via heartbeats (the player UI is optimistic only)
- **Lesson notes** saved to your account, with optional **Notion** connect and sync
- **Daily check-in**, streak, and a year heatmap of watch time
- **Public profile page** at `/u/<handle>` with the consistency heatmap, streaks, and completed lectures
- **Profile editing** — remove any course from the profile and show or hide the heatmap
- **Certificates** (switched off by default) rendered as a PDF on download (authenticated, owner-only)
- **Light and dark theme**

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- MongoDB + Mongoose
- Custom JWT session cookies (`httpOnly`, `SameSite=Lax`)
- YouTube Data API v3 (server-side) and YouTube IFrame Player (`react-youtube`)
- Certificate PDFs generated with `pdf-lib` after a completion check (behind `CERTIFICATES_ENABLED`)
- Notion API for optional note sync (tokens encrypted at rest)

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the variables below.
3. Start MongoDB.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Environment variables

Validated in `lib/config/env.ts`. Empty optional values are treated as unset.

### Required

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Local is fine: `mongodb://127.0.0.1:27017/certitube` |
| `JWT_SECRET` | At least 32 random characters. Signs session cookies, Google/Notion OAuth state, and encrypts stored Notion tokens |

### Needed for courses

| Variable | Purpose |
| --- | --- |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key, used only on the server. The app can boot without it, but resolving and enrolling in courses will fail. Never expose this to the browser |

### Optional — public origin and OAuth

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Canonical public origin (no trailing slash). Used for Google and Notion redirect URIs. On Vercel set `https://certitube.vercel.app`. If unset, the request host is used |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth **Web application** client ID |
| `GOOGLE_CLIENT_SECRET` | Matching client secret. Leave both Google vars blank to hide Google sign-in |
| `NOTION_CLIENT_ID` | Public Notion integration client ID |
| `NOTION_CLIENT_SECRET` | Matching secret. Leave both Notion vars blank to keep in-app notes without Notion sync |
| `CERTIFICATES_ENABLED` | Set to `true` to turn certificate issuing, downloads, verification, and admin review back on. Anything else keeps them off, and learners share a profile page instead |

`NODE_ENV` is set by Next.js / Node (`development`, `production`, or `test`). Do not put it in `.env.local` unless you have a reason.

### Google OAuth setup

Create a Google Cloud OAuth **Web application** client.

Production (`https://certitube.vercel.app`):

- Authorized JavaScript origin: `https://certitube.vercel.app`
- Authorized redirect URI: `https://certitube.vercel.app/api/auth/google/callback`

Local development:

- `http://localhost:3000`
- `http://localhost:3000/api/auth/google/callback`

### Notion OAuth setup

Create a **public** Notion integration. Redirect URI:

- `{APP_URL}/api/notion/callback`
- Local: `http://localhost:3000/api/notion/callback`

After connecting, learners can push a lesson note to Notion from the player. Notes still save in Certitube if Notion is not configured.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm test
```

## How progress works

The player UI can show optimistic progress. Only server-accepted heartbeat deltas increase `watchedSeconds`. A lesson completes at about 75% of duration (with a short tail allowance). Playlist lessons can be watched in any order; a lesson is playable if it belongs to the enrolled course.

## How the profile works

A lecture reaches the profile once its credited watch time crosses the same 75% threshold the player uses, so the profile never claims more than the server credited. A course counts as completed when every lecture in it is completed. Hidden courses stay in the learner's dashboard and keep their progress; they only leave the public page.

Each learner gets a handle (`/u/<handle>`) the first time they open their profile. The profile page is public and unauthenticated, rate limited per IP, and never includes the email address.

## Certificates (switched off)

With `CERTIFICATES_ENABLED=true`, the certificates list, PDF download, `/verify/<token>` page, and the admin review queue come back. Certificates are rendered on download. Knowing a URL is not enough: the request must be authenticated and the enrollment must belong to that user and be completed.
