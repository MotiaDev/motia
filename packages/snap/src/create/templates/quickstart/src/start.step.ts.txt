import type { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  // Required fields for API routes
  type: "api",
  name: "StartTheTutorial",
  path: "/hello",
  method: "GET",
  emits: ["hello"],

  // Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#apirouteconfig
  description: "",
  flows: ["hello"],
  virtualEmits: ["notification.sent"], // These are visual indicators in Workbench only.
  virtualSubscribes: [], // They don't have any impact on code execution.
};

export const handler: Handlers["StartTheTutorial"] = async (
  req,
  { emit, logger, state }
) => {
  emit({
    topic: "hello",
    data: {
      extra: `Pass any data to subscribing events with the data property. 
Use primitive types, don't pass objects or functions.
This data will be serialized and passed to JavaScript or Python handler functions.`,
    },
  });
};
