// This is an example of a TypeScript step.
// Every step is composed of a config, and a handler function.
import type { EventConfig, Handlers } from "motia";
import * as z from "zod";

// Every Step has a trigger config that describes how a step is triggered,
// what events it emits, and what "flows" it's part of

// There are a few different types of config:

// ApiRouteConfig = Create routes (ex. /hello) that trigger your step
// EventConfig = Have specific events trigger your step
// CronConfig = Have specific times trigger your step
export const config: EventConfig = {
  // While configs vary a little bit each one has a type,
  // a name, some definition of what triggers it,
  // what its input schema is, and what events it might emit.
  type: "event",
  name: "HelloFromTypeScript",
  // EventConfigs subscribe to events, when another Step emits
  // a "hello" event then the handler below will run.
  // This "subscribes" can be easily swapped out with the equivalents
  // for ApiRouteConfig (ie. path:'/hello/ts', method: 'GET')
  // or CronConfig (ie. cron: '0 * * * *')
  // So an Event can quickly become an ApiRoute and an ApiRoute
  // can easily turn into a Cron job.
  subscribes: ["hello"],
  input: z.object({ extra: z.string() }),
  emits: ["hello.response.typescript"],

  // These fields are optional but the flow field is very useful
  // for visual organization inside this Workbench.
  // If you have a series of Steps that all complete one big task or workflow
  // then adding them to the same flow makes visualizing them in Workbench easier.
  flows: ["hello"],
  description: "Say hello from TypeScript!",
  virtualEmits: [],
  virtualSubscribes: [],
};

// This is a handler, it's the code that will run when the conditions
// defined in the config are met. Every handler gets a payload and
// a context that contains useful functions to emit events, create logs,
// modify state, etc. Checkout the docs to see all that the context can do!

// Now click the Run button to run this code. Then look at the Tracing tab
// at the bottom of the screen to see what happened.
// Motia makes it easy to follow the flow of your program.
export const handler: Handlers["HelloFromTypeScript"] = async (
  payload,
  { emit, logger, state } // context object
) => {
  logger.info("Hello from TypeScript!");
  emit({ topic: "hello.response.typescript", data: { extra: "ts" } });
};
