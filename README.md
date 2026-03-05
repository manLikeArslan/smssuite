# SMS Suite

A self-hosted SMS campaign manager built with Next.js. Upload contact lists, run cold outreach and follow-up sequences, and track delivery — all from a clean, mobile-friendly dashboard.

SMS sending is powered by [Pushcut](https://www.pushcut.io/) webhooks, which trigger iOS Shortcuts to send messages natively from your iPhone.

## Features

- **List Management** — Upload CSV files, view per-list stats (Sent / Follow-ups / Remaining), delete lists
- **Campaign Runner** — Start cold outreach or follow-up sessions with configurable targets, random delays, and a real-time progress log
- **Simulation Mode** — Dry-run campaigns without sending real messages
- **Session Persistence** — Campaign progress is saved to localStorage so you can resume after a page reload
- **Password Protection** — Simple single-user auth via environment variable
- **SQLite Database** — Zero-config storage using Prisma + SQLite

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| SMS Delivery | Pushcut Webhooks → iOS Shortcuts |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)
- An iPhone with [Pushcut](https://www.pushcut.io/) installed (for actual SMS sending)

### Installation

```bash
# Clone the repository
git clone https://github.com/manLikeArslan/smssuite.git
cd smssuite

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your password and Pushcut webhook URL

# Initialize the database
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the password you set in `.env`.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `APP_PASSWORD` | Login password | Yes |
| `PUSHCUT_WEBHOOK_URL` | Pushcut webhook endpoint for SMS delivery | For sending |

## Usage

1. **Upload a list** — Go to Lists → Upload a CSV with a `phone` column
2. **Select the active list** — Click "Select List" on the list you want to use
3. **Start a session** — Go to Send, choose "New Contact" or "Follow-up", set the target count, and hit Start
4. **Monitor progress** — Watch the real-time log with delivery status and wait countdowns

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, campaign, lists)
│   ├── campaign/      # Campaign runner page
│   ├── lists/         # List management + upload pages
│   ├── login/         # Login page
│   ├── globals.css    # Design system
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Dashboard
├── components/ui/     # Reusable UI components
├── lib/               # Prisma client & utilities
└── middleware.ts       # Auth middleware
```

## License

[MIT](LICENSE)
