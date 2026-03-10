import type { Intent } from "matrix-bot-sdk";
import type { VikunjaClient } from "../vikunja/client.js";
import {
  formatTaskList,
  formatTaskDetail,
  formatHelp,
  matrixMessage,
} from "./formatter.js";
import { getProjectForRoom, linkRoomToProject } from "./room-store.js";

const LOG_PREFIX = "[Commands]";

/**
 * Handle an incoming !vikunja command.
 */
export async function handleCommand(
  intent: Intent,
  roomId: string,
  sender: string,
  body: string,
  vikunja: VikunjaClient
): Promise<void> {
  const parts = body.trim().split(/\s+/);
  // parts[0] === "!vikunja"
  const subcommand = parts[1]?.toLowerCase() ?? "help";

  try {
    switch (subcommand) {
      case "tasks":
        await cmdTasks(intent, roomId, vikunja);
        break;
      case "task":
        await cmdTaskDetail(intent, roomId, parts[2], vikunja);
        break;
      case "create":
        await cmdCreate(intent, roomId, parts.slice(2).join(" "), vikunja);
        break;
      case "done":
        await cmdDone(intent, roomId, parts[2], vikunja);
        break;
      case "assign":
        await cmdAssign(intent, roomId, parts[2], parts[3], vikunja);
        break;
      case "link":
        await cmdLink(intent, roomId, sender, parts[2], vikunja);
        break;
      case "help":
      default:
        await sendMessage(intent, roomId, formatHelp());
        break;
    }
  } catch (err) {
    console.error(LOG_PREFIX, "Command error:", err);
    await sendMessage(
      intent,
      roomId,
      matrixMessage(
        `Error: ${(err as Error).message}`,
        `<p>❌ <b>Error:</b> ${(err as Error).message}</p>`
      )
    );
  }
}

async function requireProject(intent: Intent, roomId: string) {
  const mapping = await getProjectForRoom(intent, roomId);
  if (!mapping) {
    throw new Error(
      "No Vikunja project linked to this room. Use `!vikunja link <project-id>` first."
    );
  }
  return mapping;
}

async function cmdTasks(intent: Intent, roomId: string, vikunja: VikunjaClient) {
  const mapping = await requireProject(intent, roomId);
  const tasks = await vikunja.getProjectTasks(mapping.projectId);
  const project = await vikunja.getProject(mapping.projectId);
  await sendMessage(intent, roomId, formatTaskList(tasks, project.title));
}

async function cmdTaskDetail(
  intent: Intent,
  roomId: string,
  idStr: string | undefined,
  vikunja: VikunjaClient
) {
  if (!idStr) throw new Error("Usage: `!vikunja task <id>`");
  const taskId = parseInt(idStr, 10);
  if (isNaN(taskId)) throw new Error("Task ID must be a number.");
  const task = await vikunja.getTask(taskId);
  await sendMessage(intent, roomId, formatTaskDetail(task));
}

async function cmdCreate(
  intent: Intent,
  roomId: string,
  title: string,
  vikunja: VikunjaClient
) {
  if (!title.trim()) throw new Error("Usage: `!vikunja create <title>`");
  const mapping = await requireProject(intent, roomId);
  const task = await vikunja.createTask(mapping.projectId, title);
  const msg = `Created task #${task.id}: ${task.title}`;
  await sendMessage(
    intent,
    roomId,
    matrixMessage(msg, `<p>✅ ${msg}</p>`)
  );
}

async function cmdDone(
  intent: Intent,
  roomId: string,
  idStr: string | undefined,
  vikunja: VikunjaClient
) {
  if (!idStr) throw new Error("Usage: `!vikunja done <id>`");
  const taskId = parseInt(idStr, 10);
  if (isNaN(taskId)) throw new Error("Task ID must be a number.");
  const task = await vikunja.markTaskDone(taskId);
  const msg = `Marked task #${task.id} as done: ${task.title}`;
  await sendMessage(
    intent,
    roomId,
    matrixMessage(msg, `<p>✅ ${msg}</p>`)
  );
}

async function cmdAssign(
  intent: Intent,
  roomId: string,
  idStr: string | undefined,
  username: string | undefined,
  vikunja: VikunjaClient
) {
  if (!idStr || !username)
    throw new Error("Usage: `!vikunja assign <task-id> <username>`");
  const taskId = parseInt(idStr, 10);
  if (isNaN(taskId)) throw new Error("Task ID must be a number.");

  const users = await vikunja.searchUsers(username);
  if (users.length === 0) throw new Error(`User '${username}' not found in Vikunja.`);
  const user = users[0];

  await vikunja.assignUser(taskId, user.id);
  const msg = `Assigned ${user.username} to task #${taskId}`;
  await sendMessage(
    intent,
    roomId,
    matrixMessage(msg, `<p>👤 ${msg}</p>`)
  );
}

async function cmdLink(
  intent: Intent,
  roomId: string,
  sender: string,
  idStr: string | undefined,
  vikunja: VikunjaClient
) {
  if (!idStr) throw new Error("Usage: `!vikunja link <project-id>`");
  const projectId = parseInt(idStr, 10);
  if (isNaN(projectId)) throw new Error("Project ID must be a number.");

  const project = await vikunja.getProject(projectId);
  await linkRoomToProject(intent, roomId, projectId, project.title, sender);

  const msg = `Linked this room to Vikunja project: ${project.title} (#${project.id})`;
  await sendMessage(
    intent,
    roomId,
    matrixMessage(msg, `<p>🔗 ${msg}</p>`)
  );
}

async function sendMessage(
  intent: Intent,
  roomId: string,
  content: ReturnType<typeof matrixMessage>
) {
  await intent.underlyingClient.sendMessage(roomId, content);
}
