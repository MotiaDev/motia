// Tutorial configuration for the quickstart flow
// Each step defines a title and line ranges for comments and code
// You can safely ignore and delete this file if you're done with the quickstart

export type TutorialStepConfig = {
  id: string;
  title: string;
  comment: { start: number; end: number };
  code: { start: number; end: number };
};

export const tutorialConfig: TutorialStepConfig[] = [
  {
    id: "intro",
    title: "What are Steps?",
    comment: { start: 1, end: 2 },
    code: { start: 3, end: 4 },
  },
  {
    id: "config-object",
    title: "Config Object",
    comment: { start: 6, end: 7 },
    code: { start: 14, end: 14 },
  },
  {
    id: "config-types",
    title: "Types of Configs",
    comment: { start: 9, end: 13 },
    code: { start: 14, end: 14 },
  },
  {
    id: "config-fields",
    title: "Required Fields",
    comment: { start: 15, end: 17 },
    code: { start: 18, end: 29 },
  },
  {
    id: "config-subscribing",
    title: "Subscribing",
    comment: { start: 20, end: 21 },
    code: { start: 27, end: 28 },
  },
  {
    id: "config-changing",
    title: "Changing Triggers",
    comment: { start: 22, end: 26 },
    code: { start: 27, end: 27 },
  },
  {
    id: "config-optional",
    title: "Optional Fields",
    comment: { start: 31, end: 34 },
    code: { start: 35, end: 39 },
  },
  {
    id: "handler",
    title: "Handlers",
    comment: { start: 41, end: 44 },
    code: { start: 49, end: 56 },
  },
  {
    id: "done",
    title: "Done",
    comment: { start: 46, end: 48 },
    code: { start: 49, end: 56 },
  },
];
