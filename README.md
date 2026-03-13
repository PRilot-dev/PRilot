# PRilot 🚀

## 📝 Overview

**PRilot** is an intelligent developer tool designed to **simplify and accelerate pull request workflows**.
It analyzes commit differences between branches and **automatically generates pull requests using AI**, with seamless **GitHub integration** to send them directly to your repositories.

---

## ✨ Features

- **AI-Powered PR Generation**: Automatically generate pull request titles and descriptions from branch diffs.
  - **Fast mode**: Generates from commit messages — quick and lightweight.
  - **Deep mode**: Analyzes file diffs in detail for thorough, context-aware descriptions.
- **Send PRs to GitHub**: Create pull requests directly on GitHub from the PRilot dashboard.
- **Multi-Account GitHub Support**: Connect your personal GitHub account and multiple organizations simultaneously.
- **Team Collaboration**: Invite members to repositories (up to 4 per repo) with email-based invitations.
- **Weekly Credit System**: 20 AI-generated PRs per week per user, with per-minute rate limiting.
- **User Authentication**: Credentials-based signup/login, GitHub OAuth, and password reset via email.
- **Modern UI**: Built with Tailwind CSS v4, Framer Motion animations, and dark mode support.

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Zustand, Lucide Icons |
| **Backend** | Next.js API Routes, Zod validation |
| **Database** | PostgreSQL, Prisma ORM |
| **AI** | Groq SDK |
| **Auth** | JWT (jose), Argon2 password hashing |
| **Caching & Rate Limiting** | Upstash Redis |
| **Email** | Resend |
| **DevOps** | Docker, Biome (lint/format) |

---

## 🔮 Upcoming

- **GitLab Integration**: Connect GitLab repositories and generate PRs for merge requests.
- **Custom PR Templates**: Define reusable templates to match your team's PR format and conventions.

---

## 💻 Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/JordanDonguy/prilot.git
   cd prilot
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Replace the placeholder values with your own credentials, database URL, and API keys.

3. Start Docker services (PostgreSQL + Redis):

   ```bash
   docker compose up -d
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Set up the database:

   * Generate Prisma client:

     ```bash
     npx prisma generate
     ```

   * Apply migrations:

     ```bash
     npm run db:migrate
     ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔑 License 

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

You are free to use, modify, and distribute this software. However, if you run a modified version of PRilot as a network service, you must make the source code of your modified version available to its users under the same license.
