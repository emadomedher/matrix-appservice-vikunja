import { createHmac } from "node:crypto";
import express, { type Request, type Response } from "express";
import type { VikunjaWebhookEvent, VikunjaTask, VikunjaUser } from "./types.js";
import { matrixMessage } from "../matrix/formatter.js";

const LOG_PREFIX = "[Webhooks]";

interface WebhookHandlerDeps {
  secret: string;
  sendToProject: (
    projectId: number,
    content: ReturnType<typeof matrixMessage>
  ) => Promise<void>;
}

/**
 * Create an Express router for Vikunja webhook events.
 */
export function createWebhookRouter(deps: WebhookHandlerDeps): express.Router {
  const router = express.Router();

  router.use(express.json({ limit: "1mb" }));

  router.post("/webhook", (req: Request, res: Response) => {
    // Validate webhook secret via query parameter or header
    const providedSecret =
      (req.query.secret as string) ??
      req.headers["x-vikunja-secret"] as string | undefined;

    if (providedSecret !== deps.secret) {
      console.warn(LOG_PREFIX, "Rejected webhook: invalid secret");
      res.status(401).json({ error: "Invalid secret" });
      return;
    }

    const event = req.body as VikunjaWebhookEvent;
    console.log(LOG_PREFIX, `Received event: ${event.event_name}`);

    // Process async, respond immediately
    processEvent(event, deps).catch((err) => {
      console.error(LOG_PREFIX, "Error processing webhook:", err);
    });

    res.status(200).json({ ok: true });
  });

  return router;
}

async function processEvent(
  event: VikunjaWebhookEvent,
  deps: WebhookHandlerDeps
): Promise<void> {
  const { event_name, data } = event;
  const task = data as unknown as VikunjaTask;

  if (!task?.project_id) {
    console.warn(LOG_PREFIX, "Event has no project_id, skipping");
    return;
  }

  let msg: ReturnType<typeof matrixMessage> | null = null;

  switch (event_name) {
    case "task.created": {
      const assigneeStr =
        task.assignees?.length > 0
          ? ` (assigned to ${task.assignees.map((a) => a.username).join(", ")})`
          : "";
      const plain = `📋 New task: ${task.title}${assigneeStr}`;
      msg = matrixMessage(plain, `<p>${plain}</p>`);
      break;
    }
    case "task.updated": {
      const plain = `🔄 Task updated: ${task.title}`;
      msg = matrixMessage(plain, `<p>${plain}</p>`);
      break;
    }
    case "task.deleted": {
      const plain = `🗑️ Task deleted: ${task.title}`;
      msg = matrixMessage(plain, `<p>${plain}</p>`);
      break;
    }
    case "task.assignee.created": {
      const assignee = (data as Record<string, unknown>).assignee as VikunjaUser | undefined;
      const username = assignee?.username ?? "Someone";
      const plain = `👤 ${username} assigned to: ${task.title}`;
      msg = matrixMessage(plain, `<p>${plain}</p>`);
      break;
    }
    case "task.comment.created": {
      const comment = (data as Record<string, unknown>).comment as
        | { comment?: string; author?: VikunjaUser }
        | undefined;
      const text = comment?.comment ?? "";
      const author = comment?.author?.username ?? "Someone";
      const plain = `💬 Comment on ${task.title} by ${author}: ${text}`;
      msg = matrixMessage(plain, `<p>${plain}</p>`);
      break;
    }
    default:
      console.log(LOG_PREFIX, `Ignoring unhandled event: ${event_name}`);
      return;
  }

  if (msg) {
    await deps.sendToProject(task.project_id, msg);
  }
}
