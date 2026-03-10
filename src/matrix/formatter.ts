import type { VikunjaTask } from "../vikunja/types.js";
import { PRIORITY_LABELS } from "../vikunja/types.js";

/**
 * Build a Matrix message with both plain text and HTML body.
 */
export function matrixMessage(plain: string, html: string) {
  return {
    msgtype: "m.text",
    body: plain,
    format: "org.matrix.custom.html",
    formatted_body: html,
  };
}

/** Format a single task for display */
export function formatTask(task: VikunjaTask) {
  const status = task.done ? "✅" : "⬜";
  const priority = task.priority > 0 ? ` [${PRIORITY_LABELS[task.priority] ?? "?"}]` : "";
  const assignees =
    task.assignees?.length > 0
      ? ` → ${task.assignees.map((a) => a.username).join(", ")}`
      : "";

  const plain = `${status} #${task.id} ${task.title}${priority}${assignees}`;
  const html = `${status} <b>#${task.id}</b> ${escapeHtml(task.title)}${priority ? ` <code>${escapeHtml(priority.trim())}</code>` : ""}${assignees ? ` → <i>${escapeHtml(assignees.slice(3))}</i>` : ""}`;

  return { plain, html };
}

/** Format a task list */
export function formatTaskList(tasks: VikunjaTask[], projectTitle: string) {
  if (tasks.length === 0) {
    const msg = `No open tasks in ${projectTitle}.`;
    return matrixMessage(msg, `<p>${escapeHtml(msg)}</p>`);
  }

  const lines = tasks.map(formatTask);
  const plain = `Open tasks in ${projectTitle}:\n${lines.map((l) => l.plain).join("\n")}`;
  const html = `<p><b>Open tasks in ${escapeHtml(projectTitle)}:</b></p><ul>${lines.map((l) => `<li>${l.html}</li>`).join("")}</ul>`;

  return matrixMessage(plain, html);
}

/** Format detailed task view */
export function formatTaskDetail(task: VikunjaTask) {
  const status = task.done ? "Done ✅" : "Open";
  const priority = PRIORITY_LABELS[task.priority] ?? "Unset";
  const assignees =
    task.assignees?.length > 0
      ? task.assignees.map((a) => a.username).join(", ")
      : "None";
  const due = task.due_date ? new Date(task.due_date).toLocaleDateString() : "None";
  const labels =
    task.labels?.length > 0 ? task.labels.map((l) => l.title).join(", ") : "None";

  const plain = [
    `Task #${task.id}: ${task.title}`,
    `Status: ${status} | Priority: ${priority}`,
    `Assignees: ${assignees}`,
    `Due: ${due} | Labels: ${labels}`,
    task.description ? `\n${task.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<h4>Task #${task.id}: ${escapeHtml(task.title)}</h4>
<table>
<tr><td><b>Status</b></td><td>${escapeHtml(status)}</td></tr>
<tr><td><b>Priority</b></td><td>${escapeHtml(priority)}</td></tr>
<tr><td><b>Assignees</b></td><td>${escapeHtml(assignees)}</td></tr>
<tr><td><b>Due</b></td><td>${escapeHtml(due)}</td></tr>
<tr><td><b>Labels</b></td><td>${escapeHtml(labels)}</td></tr>
</table>${task.description ? `<blockquote>${escapeHtml(task.description)}</blockquote>` : ""}`;

  return matrixMessage(plain, html);
}

/** Format help text */
export function formatHelp() {
  const plain = [
    "Vikunja Bridge Commands:",
    "  !vikunja tasks — List open tasks",
    "  !vikunja task <id> — Show task details",
    "  !vikunja create <title> — Create a new task",
    "  !vikunja assign <id> <user> — Assign a task",
    "  !vikunja done <id> — Mark task as done",
    "  !vikunja link <project-id> — Link room to project",
    "  !vikunja help — Show this help",
  ].join("\n");

  const html = `<b>Vikunja Bridge Commands:</b><br/>
<code>!vikunja tasks</code> — List open tasks<br/>
<code>!vikunja task &lt;id&gt;</code> — Show task details<br/>
<code>!vikunja create &lt;title&gt;</code> — Create a new task<br/>
<code>!vikunja assign &lt;id&gt; &lt;user&gt;</code> — Assign a task<br/>
<code>!vikunja done &lt;id&gt;</code> — Mark task as done<br/>
<code>!vikunja link &lt;project-id&gt;</code> — Link room to project<br/>
<code>!vikunja help</code> — Show this help`;

  return matrixMessage(plain, html);
}

/** Escape HTML special characters */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
