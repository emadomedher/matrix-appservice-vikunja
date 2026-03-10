# matrix-appservice-vikunja

A Matrix Application Service bridge for [Vikunja](https://vikunja.io) task management. Enables bidirectional task management from Matrix chat rooms.

## Architecture

```
Vikunja Instance → Webhooks → Bridge (port 9501) → Matrix Rooms (notifications)
Matrix Users → !vikunja commands → Bridge (port 9500) → Vikunja API (actions)
```

The bridge registers as a Matrix Application Service with Synapse and uses Matrix room state events for room-project mapping (no external database required).

## Setup

### 1. Install dependencies

```bash
pnpm install
pnpm build
```

### 2. Generate registration file

```bash
node dist/generate-registration.js --domain example.com --output vikunja-registration.yaml
```

Add the generated file to your Synapse `homeserver.yaml`:

```yaml
app_service_config_files:
  - /path/to/vikunja-registration.yaml
```

Restart Synapse after adding the registration.

### 3. Configure the bridge

```bash
cp config.sample.yaml config.yaml
# Edit config.yaml with your settings
```

### 4. Configure Vikunja webhooks

In Vikunja settings, add a webhook pointing to:

```
http://your-bridge-host:9501/webhook?secret=your-webhook-secret-here
```

Enable these events: `task.created`, `task.updated`, `task.deleted`, `task.assignee.created`, `task.comment.created`.

### 5. Start the bridge

```bash
node dist/index.js config.yaml vikunja-registration.yaml
```

## Docker

```bash
docker build -t matrix-appservice-vikunja .
docker run -v ./config.yaml:/app/config.yaml \
           -v ./vikunja-registration.yaml:/app/vikunja-registration.yaml \
           -p 9500:9500 -p 9501:9501 \
           matrix-appservice-vikunja
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `!vikunja tasks` | List open tasks in the linked project |
| `!vikunja task <id>` | Show task details |
| `!vikunja create <title>` | Create a new task |
| `!vikunja assign <id> <user>` | Assign a task to a user |
| `!vikunja done <id>` | Mark a task as done |
| `!vikunja link <project-id>` | Link the current room to a Vikunja project |
| `!vikunja help` | Show available commands |

## Webhook Notifications

When configured, the bridge sends notifications to linked Matrix rooms for:

- **Task created** — New task with assignee info
- **Task updated** — Task modification alerts
- **Task deleted** — Deletion notifications
- **Assignee added** — Assignment notifications
- **Comment added** — New comment alerts

## Configuration Reference

See `config.sample.yaml` for all options. Key settings:

- `homeserver.url` — Your Matrix homeserver URL
- `homeserver.domain` — Your Matrix server domain
- `appservice.port` — Port for the Matrix appservice (default: 9500)
- `vikunja.url` — Your Vikunja instance URL
- `vikunja.apiToken` — Vikunja API token for the bridge
- `webhook.port` — Port for the webhook receiver (default: 9501)
- `webhook.secret` — Shared secret for webhook validation

## License

MIT
