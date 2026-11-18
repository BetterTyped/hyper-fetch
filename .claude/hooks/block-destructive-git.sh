#!/bin/bash
# PreToolUse hook: stops git commands that can destroy uncommitted work or rewrite shared history.
# Quoted strings and heredoc bodies are removed first, so commit messages can mention these commands.

input=$(cat)

if command -v jq >/dev/null 2>&1; then
  command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
else
  command=$input
fi

stripped=$(printf '%s' "$command" | perl -0pe '
  s/<<-?\s*["\x27]?(\w+)["\x27]?[^\n]*\n.*?\n\s*\1(?=\n|$)/ /gs;
  s/"(?:[^"\\]|\\.)*"/""/gs;
  s/\x27[^\x27]*\x27/""/gs;
')

git='(?:^|[;&|(\n])\s*(?:\w+=\S*\s+)*git(?:\s+-[cC]\s+\S+|\s+--[\w-]+(?:=\S+)?)*\s+'
args='(?:[^;&|\n]*\s)?'
blocked="${git}(?:"
blocked+="stash(?!\s+(?:list|show)\b)"
blocked+="|reset\s+${args}--hard\b"
blocked+="|clean\s+${args}-\w*f"
blocked+="|checkout\s+${args}--(?:\s|$)"
blocked+="|checkout\s+\.(?:\s|$)"
blocked+="|push\s+${args}(?:--force\S*|-\w*f)(?:\s|$)"
blocked+="|rebase(?!\s+--(?:abort|continue|skip)\b)"
blocked+=")"

if printf '%s' "$stripped" | BLOCKED="$blocked" perl -0ne 'exit(/$ENV{BLOCKED}/m ? 0 : 1)'; then
  cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked a destructive git command (stash, hard reset, clean, checkout --, force push or rebase). Do not retry it. Use a separate worktree or a WIP commit, or ask the user to run it."
  }
}
JSON
fi

exit 0
