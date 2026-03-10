/** Vikunja API response types */

export interface VikunjaTask {
  id: number;
  title: string;
  description: string;
  done: boolean;
  done_at: string | null;
  priority: number;
  labels: VikunjaLabel[];
  assignees: VikunjaUser[];
  due_date: string | null;
  project_id: number;
  created: string;
  updated: string;
  created_by: VikunjaUser;
  identifier: string;
  index: number;
  percent_done: number;
}

export interface VikunjaUser {
  id: number;
  username: string;
  name: string;
  email: string;
}

export interface VikunjaLabel {
  id: number;
  title: string;
  hex_color: string;
}

export interface VikunjaProject {
  id: number;
  title: string;
  description: string;
  identifier: string;
  owner: VikunjaUser;
  created: string;
  updated: string;
}

export interface VikunjaComment {
  id: number;
  comment: string;
  author: VikunjaUser;
  created: string;
  updated: string;
}

export interface VikunjaTaskAssignee {
  user_id: number;
  task_id: number;
}

/** Webhook event payload from Vikunja */
export interface VikunjaWebhookEvent {
  event_name: string;
  time: string;
  data: Record<string, unknown>;
}

export type WebhookEventName =
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "task.assignee.created"
  | "task.comment.created";

/** Priority labels for display */
export const PRIORITY_LABELS: Record<number, string> = {
  0: "Unset",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Urgent",
  5: "DO NOW",
};
