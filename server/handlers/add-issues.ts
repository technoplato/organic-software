#!/usr/bin/env npx tsx

import { init, tx, id } from "@instantdb/node";
import { config } from "dotenv";

// Load environment variables
config();

const APP_ID = process.env.INSTANTDB_APP_ID;
if (!APP_ID) {
  console.error("❌ INSTANTDB_APP_ID is required");
  process.exit(1);
}

const db = init({ appId: APP_ID });

interface Issue {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  status?: "Todo" | "In Progress" | "Done";
  createdAt?: number;
  updatedAt?: number;
  context?: any;
  conversationId?: string;
  messageId?: string;
}

async function createIssues() {
  // Since we don't have direct access to conversationId and messageId in this context,
  // we'll set them to null and let the user update them if needed

  const issues: Issue[] = [
    {
      id: id(),
      title: "Web heartbeat listener not working in supervisor",
      description:
        "The web heartbeat is showing as offline when running 'npm run supervisor'. Web clients can't update their heartbeat status properly.",
      priority: "High",
      status: "Todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: id(),
      title: "Issues are not editable/mutable in issues screen",
      description:
        "Users cannot modify existing issues in the issues screen. Need to add edit functionality to allow updating title, description, priority, and status.",
      priority: "Medium",
      status: "Todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: id(),
      title: "Text input should be expandable on web platform",
      description:
        "The message input text box should expand/resize automatically for longer messages on web browsers for better UX.",
      priority: "Low",
      status: "Todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  try {
    for (const issue of issues) {
      await db.transact([tx.issues[issue.id].update(issue)]);
      console.log(`✅ Created issue: ${issue.title}`);
    }
    console.log(`\n🎉 Successfully created ${issues.length} issues!`);
  } catch (error) {
    console.error("❌ Error creating issues:", error);
  } finally {
    db.shutdown();
  }
}

createIssues();
