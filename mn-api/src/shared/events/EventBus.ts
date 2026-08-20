export interface AppEvent {
  eventName: string;
  payload: any;
  timestamp: Date;
}

type EventHandler = (event: AppEvent) => Promise<void> | void;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  async publish(eventName: string, payload: any): Promise<void> {
    const event: AppEvent = {
      eventName,
      payload,
      timestamp: new Date(),
    };

    const listeners = this.handlers.get(eventName) || [];
    await Promise.all(
      listeners.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          console.error(`[EventBus] Error handling event ${eventName}:`, err);
        }
      })
    );
  }
}

export const eventBus = EventBus.getInstance();
