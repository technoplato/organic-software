# InstantDB Usage Rules for Claude Code

## Core Principles

1. **Read these rules thoroughly before writing any InstantDB code**
2. **If unsure about InstantDB functionality, fetch documentation URLs for clarification**
3. **Check for existing project structure before generating new projects**
4. **Use Instant MCP tools for app creation and schema management when available**

## Package Selection

### Client-Side Packages
- `@instantdb/react` - For React applications
- `@instantdb/react-native` - For React Native/Expo applications  
- `@instantdb/core` - For vanilla JavaScript applications

### Server-Side Packages
- `@instantdb/admin` - For backend/server environments only
- Always use admin token from environment variables
- Use admin SDK only for data seeding scripts

## Database Operations

### Queries
Use `db.useQuery()` for client-side data fetching:
```typescript
const { data, isLoading, error } = db.useQuery({
  tableName: {},
  relatedTable: {
    $: {
      where: {
        field: "value"
      }
    }
  }
});
```

### Transactions
Use `db.transact()` for data mutations:
```typescript
await db.transact([
  db.tx.tableName[id].update(data),
  db.tx.otherTable[otherId].delete()
]);
```

## Query Filtering

### Supported Where Operators
- **Equality**: `{ field: "value" }`
- **Inequality**: `{ field: { $gt: 5, $lt: 10 } }`
- **Null checks**: `{ field: { $isNull: true } }`
- **Set operations**: `{ field: { $in: ["a", "b", "c"] } }`
- **Substring matching**: `{ field: { $like: "%search%" } }`
- **Logical conditions**: `{ $and: [...], $or: [...] }`

## Authentication

### Magic Code Authentication
```typescript
// Send magic code
await db.auth.sendMagicCode({ email: "user@example.com" });

// Verify code
await db.auth.verifyMagicCode({ email: "user@example.com", code: "123456" });
```

### OAuth Integration
- Google OAuth
- Sign In with Apple
- Custom OAuth providers

## Real-time Features

### Presence Tracking
```typescript
const { user, peers } = db.usePresence("room-id");
```

### Collaboration
- Automatic real-time updates
- Conflict resolution
- Offline synchronization

## Schema Management

### Schema Definition
- Use TypeScript interfaces for type safety
- Define relationships between entities
- Set up proper indexing

### Data Modeling
- Normalize data appropriately
- Consider query patterns when designing schema
- Plan for scalability

## Best Practices

1. **Always validate data before transactions**
2. **Use TypeScript for type safety**
3. **Handle loading and error states properly**
4. **Implement proper authentication flows**
5. **Test real-time synchronization thoroughly**
6. **Use environment variables for sensitive data**
7. **Follow InstantDB naming conventions**

## Error Handling

```typescript
const { data, isLoading, error } = db.useQuery({...});

if (error) {
  console.error("Database error:", error);
  // Handle error appropriately
}

if (isLoading) {
  // Show loading state
}
```

## File Storage

```typescript
// Upload file
const uploadResult = await db.storage.upload(file);

// Get file URL
const fileUrl = db.storage.url(uploadResult.id);
```

## Performance Considerations

1. **Use selective queries to minimize data transfer**
2. **Implement proper caching strategies**
3. **Optimize real-time subscriptions**
4. **Consider pagination for large datasets**
5. **Use indexes for frequently queried fields**

---

*Always refer to the latest InstantDB documentation for the most up-to-date information and best practices.*