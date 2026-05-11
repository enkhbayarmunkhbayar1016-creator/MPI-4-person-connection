# MPI 4-Person Distributed Chat System

Real-time distributed chat application supporting up to 4 concurrent clients across two server namespaces with an admin control panel.

## Features
- 4 client slots distributed across Server A and Server B
- Real-time message relay between servers (250ms delay simulation)
- Admin panel: live stats, server toggle (online/offline), client kick
- JWT-like token authentication for admins
- GIF and sticker support in chat
- Dark/light mode UI

## Quick Start
```bash
cd partB/src
npm install
npm start
# Open http://localhost:3000
```

## Architecture
See [partA/ARCHITECTURE.md](../partA/ARCHITECTURE.md) for system diagrams.

## Stack
- Node.js 18+ / Express 4 / Socket.IO 4
- Vanilla JS frontend (no framework)
- Deployed on Render.com

## Project Structure
```
partA/   — Planning documents
partB/   — Source code and tests
partC/   — Reflection documents
```
