// instant.schema.ts
// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    "$files": i.entity({
      "path": i.string().unique().indexed(),
      "url": i.string().optional(),
    }),
    "$users": i.entity({
      "email": i.string().unique().indexed().optional(),
    }),
    "conversations": i.entity({
      "updatedAt": i.number().optional(),
    }),
    "devices": i.entity({
      "createdAt": i.number().optional(),
      "deviceId": i.string().optional(),
      "platform": i.string().optional(),
      "pushToken": i.string().optional(),
      "updatedAt": i.number().optional(),
    }),
    "errors": i.entity({
      "content": i.string().optional(),
      "errorType": i.string().optional(),
      "metadata": i.json().optional(),
      "source": i.string().optional(),
      "status": i.string().optional(),
      "timestamp": i.number().optional(),
      "type": i.string().optional(),
    }),
    "heartbeats": i.entity({
      "kind": i.string().optional(),
      "lastSeenAt": i.number().optional(),
    }),
    "logs": i.entity({
      "kind": i.string().optional(),
      "message": i.string().optional(),
      "meta": i.json().optional(),
      "timestamp": i.number().optional(),
    }),
    "segments": i.entity({
      "text": i.string(),
      "timestamp": i.number(), // Timestamp in seconds from session start
      "formattedTimestamp": i.string(), // Human-readable timestamp like "1:23"
      "confidence": i.number().optional(), // Confidence score 0-1
      "isFinal": i.boolean(), // Whether this segment is final or from silence detection
      "isInterim": i.boolean().optional(), // Whether this is an interim (non-final) result
      "createdAt": i.date(),
      "updatedAt": i.date(),
    }),
    "transcriptions": i.entity({
      "title": i.string().optional(),
      "startedAt": i.date(),
      "endedAt": i.date().optional(),
      "duration": i.number().optional(), // Duration in seconds
      "deviceId": i.string().optional(),
      "userId": i.string().optional(),
      "status": i.string(), // 'recording', 'completed', 'paused'
      "metadata": i.json().optional(), // Additional metadata like recording settings
      "createdAt": i.date(),
      "updatedAt": i.date(),
    }),
    "userSettings": i.entity({
      "createdAt": i.number().optional(),
      "displayMode": i.string().optional(),
      "lineSpacing": i.number().optional(),
      "textSize": i.number().optional(),
      "updatedAt": i.number().optional(),
    }),
  },
  links: {
    "transcriptionSegments": {
      "forward": {
        "on": "segments",
        "has": "one",
        "label": "transcription"
      },
      "reverse": {
        "on": "transcriptions",
        "has": "many",
        "label": "segments"
      }
    }
  },
  rooms: {}
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;