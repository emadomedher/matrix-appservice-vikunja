import type {
  VikunjaTask,
  VikunjaProject,
  VikunjaComment,
  VikunjaUser,
} from "./types.js";

export class VikunjaClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = apiToken;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Vikunja API ${method} ${path} failed (${res.status}): ${text}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  /** List tasks for a project */
  async getProjectTasks(projectId: number, page = 1): Promise<VikunjaTask[]> {
    return this.request<VikunjaTask[]>(
      "GET",
      `/projects/${projectId}/tasks?page=${page}&filter=done%20%3D%20false`
    );
  }

  /** Get a single task by ID */
  async getTask(taskId: number): Promise<VikunjaTask> {
    return this.request<VikunjaTask>("GET", `/tasks/${taskId}`);
  }

  /** Create a task in a project */
  async createTask(projectId: number, title: string, description = ""): Promise<VikunjaTask> {
    return this.request<VikunjaTask>("PUT", `/projects/${projectId}/tasks`, {
      title,
      description,
    });
  }

  /** Mark a task as done */
  async markTaskDone(taskId: number): Promise<VikunjaTask> {
    return this.request<VikunjaTask>("POST", `/tasks/${taskId}`, {
      done: true,
    });
  }

  /** Assign a user to a task */
  async assignUser(taskId: number, userId: number): Promise<void> {
    await this.request("PUT", `/tasks/${taskId}/assignees`, {
      user_id: userId,
    });
  }

  /** Get a project by ID */
  async getProject(projectId: number): Promise<VikunjaProject> {
    return this.request<VikunjaProject>("GET", `/projects/${projectId}`);
  }

  /** Search for a user by username */
  async searchUsers(query: string): Promise<VikunjaUser[]> {
    return this.request<VikunjaUser[]>("GET", `/users?s=${encodeURIComponent(query)}`);
  }

  /** Get comments for a task */
  async getTaskComments(taskId: number): Promise<VikunjaComment[]> {
    return this.request<VikunjaComment[]>("GET", `/tasks/${taskId}/comments`);
  }
}
