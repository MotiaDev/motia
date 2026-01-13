// This is an example of a JavaScript step.
import * as z from "zod";

export const config = {
  type: "event",
  name: "HelloFromJavaScript",
  subscribes: ["hello"],
  input: z.object({ extra: z.string() }),
  emits: ["hello.response.javascript"],

  // Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#eventconfig
  flows: ["hello"],
  description: "Say hello from JavaScript!",
  virtualEmits: [],
  virtualSubscribes: [],
};

export const handler = async (
  input,
  { emit, logger, state } //context object
) => {
  logger.info("Hello from JavaScript!");
  emit({ topic: "hello.response.javascript", data: { extra: "js" } });
};
