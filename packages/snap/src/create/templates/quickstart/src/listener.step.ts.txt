// This is an example step that subscribes to multiple events
// and will run any time it hears any of them.
import type { EventConfig, Handlers } from "motia";
import * as z from "zod";

export const config: EventConfig = {
  type: "event",
  name: "ListensToMultipleEvents",
  input: z.object({ extra: z.string() }),
  emits: [],
  subscribes: [
    "hello.response.typescript",
    "hello.response.javascript",
    "hello.response.python",
  ],
  flows: ["hello"],
  description: "Listens to several events, and runs for each",
  virtualEmits: [],
  virtualSubscribes: [],
};

export const handler: Handlers["ListensToMultipleEvents"] = async (
  payload,
  { emit, logger, state } // context object
) => {
  logger.info(
    `I heard an event, it had the payload: ${JSON.stringify(payload)}`
  );
};
