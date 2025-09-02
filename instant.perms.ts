// instant.perms.ts

import type { InstantRules } from "@instantdb/core";

const rules = {
  transcriptions: {
    allow: {
      create: "true",
      update: "true",
      delete: "true",
      view: "true",
    },
  },
  segments: {
    allow: {
      create: "true",
      update: "true",
      delete: "true",
      view: "true",
    },
  },
  attrs: {
    allow: {
      $default: "false", // Prevent schema changes from client
    },
  },
} satisfies InstantRules;

export default rules;
