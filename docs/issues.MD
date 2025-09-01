# Issues

## Mobile App Enhancements

| Priority | Issue | Description | Status |
|----------|-------|-------------|--------|
| High | Expo Notifications | Add expo notifications for when messages are completed processing by Claude | Todo |
| High | Claude Session Persistence | Add ability for Claude to maintain its session across app restarts | Todo |
| High | UI/UX Improvements | Improve layout, orientation handling, and styling to make the app much easier and nicer to use | Todo |
| Medium | MCP Server Integration | Enable Claude to use our MCP servers from the mobile app | Todo |
| Medium | Hands-free Mode | Add hands-free version that works without popping up the keyboard | Todo |
| Low | Issues Database | Create instant DB issues table viewable from the app | Todo |

## Instant DB Schema for Issues Table

```javascript
// Issues entity structure for instant DB
entities: {
  issues: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    priority: { type: "string", required: true }, // "High", "Medium", "Low"
    status: { type: "string", required: true },   // "Todo", "In Progress", "Done"
    createdAt: { type: "date", required: true },
    updatedAt: { type: "date", required: true }
  }
}
```
