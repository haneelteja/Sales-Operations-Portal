---
name: claude-code-hooks
description: Claude Code lifecycle hooks pattern. Reference when you need automation that runs at session start or before/after tool use.
type: reference
---

# Claude Code Hooks — Aamodha Portal

Pattern sourced from: https://github.com/chopratejas/headroom (plugins/headroom-agent-hooks)

## What Hooks Are

Hooks are shell commands that Claude Code runs automatically at specific lifecycle points. They run outside the conversation — Claude sees their output via `system-reminder` tags but hooks cannot inject code or override Claude's decisions.

## Hook Types Available

| Event | When it fires |
|-------|--------------|
| `SessionStart` | Once at the start of every conversation |
| `PreToolUse` | Before any tool call (can be scoped by tool name) |
| `PostToolUse` | After any tool call completes |
| `Stop` | When Claude finishes a turn |

## Format (in `.claude/settings.json`)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 15,
            "statusMessage": "Short description shown while running"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "your-check-here",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## This Project's Active Hook

**SessionStart** — runs at the top of every session and echoes:
- The 4 non-negotiable rules (supabase-before-git, commit+push, tsc check, migrations append-only)
- Current `git status --short` so Claude knows what's pending

## When to Add More Hooks

Add a new hook when:
- You want Claude to automatically see some state at session start (e.g., pending migrations count)
- You need a guard before a risky tool call class (use `matcher` to scope to specific tools)
- You want to run a lightweight check after all file edits (`PostToolUse` with `matcher: "Edit|Write"`)

## Caution

- `PreToolUse` without a matcher fires before **every** tool call — extremely noisy. Always scope with `matcher`.
- Hooks that fail (non-zero exit) surface as warnings but do not block Claude.
- Keep hook commands fast (under 5s). Heavy commands delay the session start.
- Don't put secrets in hook commands — they're stored in plain text in `settings.json`.
