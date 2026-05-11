# CLAUDE.md

## Project Overview
MPI 4-Person Distributed Chat System — Socket.IO + Express real-time messaging platform with admin panel, server relay, and multi-client support.

## Build Commands
```bash
cd partB/src && npm install   # Install dependencies
cd partB/src && npm start     # Run server (port 3000)
cd partB/src && npm run dev   # Run with nodemon (hot reload)
cd partB && npm test          # Run unit tests
```

## Repository Structure
```
partA/          # Plan — architecture, stack decision, ADR
partB/          # Build — source code, tests, AI sessions
partC/          # Reflect — AI usage report, ADR-002, self-evaluation
.claude/commands/  # Custom slash commands
CLAUDE.md       # This file
```

## Conventions
- Commits: Conventional Commits format (feat, fix, docs, test, refactor, chore)
- All AI-assisted commits include `Co-Authored-By: Claude <noreply@anthropic.com>`
- API routes: REST under `/api/*`
- Socket namespaces: `/admin`, `/server-a`, `/server-b`

## No-Go Zones
- Do NOT hardcode credentials in source (use env vars)
- Do NOT commit `node_modules/`
- Do NOT skip tests when adding new API endpoints
- Do NOT use `eval()` or dynamic `require()` with user input
