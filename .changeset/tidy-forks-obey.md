---
"@leturgero/cli": patch
---

Replaces `gunshi` with `node:util`'s `parseArgs` for argument parsing and `am-i-vibing` for agent detection. Unknown flags, positional arguments and flags missing their value are now rejected with a readable message instead of being silently ignored or printing a stack trace.
