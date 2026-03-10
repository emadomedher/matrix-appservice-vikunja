import {
  Appservice,
  AutojoinRoomsMixin,
  SimpleRetryJoinStrategy,
  type IAppserviceRegistration,
} from "matrix-bot-sdk";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import type { BridgeConfig } from "./config.js";
import { VikunjaClient } from "./vikunja/client.js";
import { handleCommand } from "./matrix/commands.js";
import { getProjectForRoom } from "./matrix/room-store.js";
import { matrixMessage } from "./matrix/formatter.js";

const LOG_PREFIX = "[Bridge]";

export class VikunjaBridge {
  private appservice!: Appservice;
  private vikunja: VikunjaClient;
  private config: BridgeConfig;
  private registration: IAppserviceRegistration;

  constructor(config: BridgeConfig, registrationPath: string) {
    this.config = config;
    this.vikunja = new VikunjaClient(config.vikunja.url, config.vikunja.apiToken);

    const regYaml = readFileSync(registrationPath, "utf-8");
    this.registration = parse(regYaml) as IAppserviceRegistration;
  }

  async start(): Promise<void> {
    this.appservice = new Appservice({
      homeserverUrl: this.config.homeserver.url,
      homeserverName: this.config.homeserver.domain,
      port: this.config.appservice.port,
      bindAddress: this.config.appservice.bindAddress,
      registration: this.registration,
      joinStrategy: new SimpleRetryJoinStrategy(),
    });

    AutojoinRoomsMixin.setupOnAppservice(this.appservice);

    // Handle Matrix room events
    this.appservice.on("room.message", async (roomId: string, event: Record<string, unknown>) => {
      if ((event.sender as string) === this.botUserId) return;

      const content = event.content as Record<string, unknown> | undefined;
      if (!content) return;

      const body = content.body as string | undefined;
      if (!body || !body.startsWith("!vikunja")) return;

      console.log(LOG_PREFIX, `Command from ${event.sender} in ${roomId}: ${body}`);
      const intent = this.appservice.botIntent;
      await handleCommand(intent, roomId, event.sender as string, body, this.vikunja);
    });

    await this.appservice.begin();
    console.log(LOG_PREFIX, `Appservice listening on ${this.config.appservice.bindAddress}:${this.config.appservice.port}`);
  }

  get botUserId(): string {
    return `@${this.registration.sender_localpart}:${this.config.homeserver.domain}`;
  }

  get botIntent() {
    return this.appservice.botIntent;
  }

  /**
   * Send a notification to all rooms linked to a given Vikunja project.
   * Used by the webhook handler.
   */
  async sendToProject(
    projectId: number,
    content: ReturnType<typeof matrixMessage>
  ): Promise<void> {
    const intent = this.appservice.botIntent;
    // Get all rooms the bot is in
    const rooms = await intent.underlyingClient.getJoinedRooms();

    for (const roomId of rooms) {
      try {
        const mapping = await getProjectForRoom(intent, roomId);
        if (mapping && mapping.projectId === projectId) {
          await intent.underlyingClient.sendMessage(roomId, content);
        }
      } catch (err) {
        console.error(LOG_PREFIX, `Failed to check/send to room ${roomId}:`, err);
      }
    }
  }
}
