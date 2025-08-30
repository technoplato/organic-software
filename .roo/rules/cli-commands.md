# CLI Command Execution Rules

## Always Use Non-Blocking Commands

When executing CLI commands, you MUST use commands that complete and return control to the terminal. Never use commands that run indefinitely or "hang" waiting for input/events.

### ❌ AVOID These Blocking Patterns:
- `tail -f` (follows file indefinitely)
- `watch` (runs continuously)
- `top` or `htop` (interactive monitoring)
- `npm run dev` or similar development servers without backgrounding
- `docker logs -f` (follows logs)
- Any command waiting for user input
- Interactive REPLs (node, python, irb, etc.)

### ✅ USE These Non-Blocking Alternatives:

**For Log Viewing:**
- Instead of: `tail -f logfile.log`
- Use: `tail -n 50 logfile.log` (shows last 50 lines)
- Use: `tail -100 logfile.log | grep ERROR` (last 100 lines with filtering)

**For File Monitoring:**
- Instead of: `watch ls -la`
- Use: `ls -la` (run once and check output)

**For Process Monitoring:**
- Instead of: `top`
- Use: `ps aux | grep process_name`
- Use: `pgrep -fl pattern`

**For Development Servers:**
- Instead of: `npm run dev`
- Use: `npm run dev &` (background) or `nohup npm run dev > dev.log 2>&1 &`
- Better: Create dedicated background scripts

**For Docker Logs:**
- Instead of: `docker logs -f container`
- Use: `docker logs --tail 50 container`

**For Testing Changes:**
- Instead of: `nodemon script.js`
- Use: `node script.js` (run once and check output)

### General Patterns:

1. **Add limits**: Use `-n`, `--max-count`, `--tail`, or similar flags
2. **Use timeouts**: Add `timeout 5s command` to force termination
3. **Background jobs**: Use `&` to run in background when appropriate
4. **One-shot flags**: Look for flags like `--once`, `-1`, or `--no-follow`
5. **Pipe to head/tail**: `command | head -20` to limit output

### Examples:

```bash
# ❌ BAD: Will hang
tail -f /var/log/app.log
curl http://slow-endpoint.com
nc -l 8080

# ✅ GOOD: Will complete
tail -n 100 /var/log/app.log
curl --max-time 5 http://slow-endpoint.com
echo "test" | nc localhost 8080
```

### Exception:
Only use blocking commands when explicitly instructed by the user with phrases like:
- "Keep it running"
- "Monitor continuously"
- "Watch for changes"
- "Run in foreground"

Even then, inform the user that the command will block and they may need to manually stop it.