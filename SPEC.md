# matrix-appservice-vikunja — Specification

## Overview
A Matrix Application Service (appservice) bridge that connects Vikunja task management to Matrix rooms. Enables bidirectional task management from Matrix chat.

## Architecture

```
Vikunja Instance → Webhooks → Bridge HTTP Server → Matrix Rooms (notifications)
Matrix Users → Bot Commands → Bridge → Vikunja API (actions)
```

The bridge registers as a Matrix Application Service with Synapse, using the official `matrix-appservice-bridge` Node.js SDK.

## Features (MVP)

### 1. Webhook Receiver (Vikunja → Matrix)
- Listen on a configurable HTTP port for Vikunja webhook events
- Events to handle:
  - `task.created` — "📋 New task: {title} (assigned to {assignee})"
  - `task.updated` — "🔄 Task updated: {title} — {changes}"
  - `task.deleted` — "🗑️ Task deleted: {title}"
  - `task.assignee.created` — "👤 {user} assigned to: {title}"
  - `task.comment.created` — "💬 Comment on {title}: {text}"
- Format messages with Matrix HTML for rich display
- Route events to the correct Matrix room based on project mapping

### 2. Bot Commands (Matrix → Vikunja)
- `!vikunja tasks` — List open tasks in the linked project
- `!vikunja task <id>` — Show task details
- `!vikunja create <title>` — Create a new task
- `!vikunja assign <id> <user>` — Assign a task
- `!vikunja done <id>` — Mark task as done
- `!vikunja link <project-id>` — Link current Matrix room to a Vikunja project
- `!vikunja help` — Show available commands

### 3. Room-Project Mapping
- Each Matrix room can be linked to one Vikunja project
- Mapping stored in Matrix room state events (no external DB needed)
- State event type: `com.vikunja.bridge.config`

## Configuration

```yaml
# config.yaml
homeserver:
  url: https://matrix.example.com
  domain: example.com

appservice:
  port: 9500
  bindAddress: 0.0.0.0

vikunja:
  url: https://tasks.example.com
  apiToken: "your-vikunja-api-token"

webhook:
  port: 9501
  secret: "webhook-signing-secret"

logging:
  level: info
```

## Registration File

The bridge generates a `vikunja-registration.yaml` for Synapse:
- Namespace: `@vikunja_.*:domain`
- Bot user: `@vikunjabot:domain`
- Alias namespace: `#vikunja_.*:domain`

## Tech Stack
- **Language**: TypeScript (ESM)
- **Matrix SDK**: `matrix-appservice-bridge` (official matrix-org library)
- **HTTP Server**: Express (webhook receiver)
- **Storage**: Matrix room state (no external DB)
- **Config**: YAML

## File Structure
```
src/
├── index.ts              — Entry point, starts bridge + webhook server
├── bridge.ts             — Matrix appservice bridge setup
├── config.ts             — Configuration loading and validation
├── generate-registration.ts — CLI to generate Synapse registration YAML
├── vikunja/
│   ├── client.ts         — Vikunja REST API client
│   ├── types.ts          — Vikunja data types
│   └── webhooks.ts       — Webhook event parser and router
├── matrix/
│   ├── commands.ts       — Bot command handler (!vikunja ...)
│   ├── formatter.ts      — Rich message formatting (HTML)
│   └── room-store.ts     — Room-project mapping via state events
└── config/
    └── schema.ts         — Config validation
```

## Security
- **NEVER include real server URLs, IPs, tokens, or credentials in code or docs**
- Use placeholder examples only (example.com, tasks.example.com)
- Webhook secret validation (HMAC if Vikunja supports it)
- API token stored in config file, not hardcoded
- Appservice token authentication for Matrix

## Future (post-MVP)
- Task labels as Matrix room tags
- Due date reminders
- File attachment bridging
- Multiple Vikunja instance support
- Docker image + Helm chart
- PR to matrix.org ecosystem bridges listing
