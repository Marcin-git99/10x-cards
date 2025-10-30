# 10x-cards

## Project description

10x-cards helps learners create and manage flashcard sets faster by leveraging Large Language Models (LLMs). Paste any text (e.g. from a textbook section) and the app will propose flashcards that you can accept, edit or discard. A minimal spaced-repetition workflow lets you study right away while keeping the product scope focused on the most valuable functionality.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

---

## Tech stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **[Astro 5](https://astro.build/)** with **React 19** islands | Ultra-fast static output with interactive components where needed |
| Language | **TypeScript 5** | Static typing & IDE support |
| Styling | **Tailwind CSS 4** + **Shadcn/UI** | Utility-first styling and accessible component primitives |

### Backend & Infrastructure

| Layer | Technology | Purpose |
|-------|------------|---------|
| BaaS  | **[Supabase](https://supabase.com/)** | PostgreSQL storage, authentication, REST & realtime APIs |
| AI    | **Openrouter.ai** | Unified access to many LLM providers with cost limits |
| CI/CD | **GitHub Actions** | Automated lint / build / deploy pipelines |
| Hosting | **DigitalOcean** (Docker image) | Deploy Astro static output + Supabase if self-hosted |

### Key runtime & tooling versions

- Node.js `22.14.0` (see `.nvmrc`)
- Package manager: **npm 10+** (ships with Node 22)
- See `package.json` for the full list of dependencies.

---

## Getting started locally

```bash
# 1. Clone the repo
$ git clone https://github.com/your-org/10x-cards.git && cd 10x-cards

# 2. Install the required Node version
$ nvm use                         # uses 22.14.0 from .nvmrc

# 3. Install dependencies
$ npm install

# 4. Create environment variables
$ cp .env.example .env            # then fill in SUPABASE_ / OPENROUTER_ keys

# 5. Start the dev server
$ npm run dev                     # http://localhost:4321
```

The dev server automatically rebuilds when you edit files. Supabase can be pointed to a local instance (`supabase start`) or the hosted project URL.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Astro dev server with hot-reload |
| `npm run build` | Generate a production build (SSR ready static output) |
| `npm run preview` | Preview the production build locally |
| `npm run astro <cmd>` | Run any Astro CLI command |
| `npm run lint` | Run ESLint over the codebase |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format files with Prettier |

---

## Project scope

The Minimum Viable Product focuses on:

1. **Automatic flashcard generation** – paste text, get proposed Q-A pairs from an LLM, review & accept.
2. **Manual flashcard CRUD** – create, edit, delete your own cards.
3. **Basic authentication** – register, login & delete account.
4. **Spaced-repetition sessions** – integrates an existing open-source algorithm to schedule reviews.
5. **Privacy & GDPR compliance** – user data isolated and erasable on demand.

Out of scope for the MVP (may come later): mobile apps, advanced gamification, public API, sharing decks between users, complex notifications, custom SR algorithms, multi-format import (PDF/Docx), advanced search.

---

## Project status

🚧 **In development (MVP)** – core features listed above are being implemented. See the [issues](https://github.com/your-org/10x-cards/issues) for progress.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
