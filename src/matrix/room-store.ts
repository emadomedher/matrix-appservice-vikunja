import type { Intent } from "matrix-bot-sdk";

const STATE_EVENT_TYPE = "com.vikunja.bridge.config";

export interface RoomProjectMapping {
  projectId: number;
  projectTitle?: string;
  linkedBy: string;
  linkedAt: string;
}

/**
 * Get the Vikunja project ID linked to a Matrix room.
 * Uses Matrix room state events for storage (no external DB).
 */
export async function getProjectForRoom(
  intent: Intent,
  roomId: string
): Promise<RoomProjectMapping | null> {
  try {
    const event = await intent.underlyingClient.getRoomStateEvent(
      roomId,
      STATE_EVENT_TYPE,
      ""
    );
    if (event && typeof event.projectId === "number") {
      return event as RoomProjectMapping;
    }
    return null;
  } catch {
    // State event doesn't exist yet
    return null;
  }
}

/**
 * Link a Matrix room to a Vikunja project via state event.
 */
export async function linkRoomToProject(
  intent: Intent,
  roomId: string,
  projectId: number,
  projectTitle: string,
  linkedBy: string
): Promise<void> {
  const content: RoomProjectMapping = {
    projectId,
    projectTitle,
    linkedBy,
    linkedAt: new Date().toISOString(),
  };

  await intent.underlyingClient.sendStateEvent(
    roomId,
    STATE_EVENT_TYPE,
    "",
    content
  );
}
