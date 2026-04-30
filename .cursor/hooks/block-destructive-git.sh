#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if echo "$command" | grep -qEi 'git\s+(stash|reset\s+--hard|clean\s+-fd|checkout\s+--?\s|checkout\s+\.|push\s+--force|push\s+-f|rebase)'; then
  echo '{
    "permission": "deny",
    "user_message": "Blocked destructive git command. These commands can cause data loss.",
    "agent_message": "A hook blocked this destructive git command (stash, hard reset, force push, clean, rebase, checkout -- .). Do NOT retry. Ask the user before running destructive git operations."
  }'
  exit 0
fi

echo '{ "permission": "allow" }'
exit 0
