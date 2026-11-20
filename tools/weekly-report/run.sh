#!/bin/zsh
# รันรายงานประจำสัปดาห์แบบอัตโนมัติ (launchd เรียกทุกศุกร์เย็น) หรือรันมือ: ./tools/weekly-report/run.sh
set -u
DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$DIR" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
LOG="tools/weekly-report/logs/$(date +%Y-%m-%d).log"

claude -p "/weekly-report" \
  --permission-mode acceptEdits \
  --allowedTools "mcp__flo__get_agent_instructions mcp__flo__get_board mcp__flo__get_item mcp__flo__list_items mcp__flo__list_wraps mcp__flo__get_wrap mcp__claude_ai_Claude_Docs__batch mcp__claude_ai_Claude_Docs__update mcp__claude_ai_Claude_Docs__read mcp__claude_ai_Claude_Docs__guide Artifact ToolSearch Read Write Edit Glob Grep Bash(ls:*) Bash(date:*)" \
  > "$LOG" 2>&1
STATUS=$?

URL="$(grep -o 'REPORT_URL: *[^ ]*' "$LOG" | tail -1 | sed 's/REPORT_URL: *//')"
if [[ $STATUS -eq 0 && -n "$URL" ]]; then
  osascript -e "display notification \"รายงานประจำสัปดาห์พร้อมแล้ว\" with title \"PEA Maintain\" sound name \"Glass\""
  echo "$URL" | pbcopy
else
  osascript -e "display notification \"สร้างรายงานไม่สำเร็จ ดู $LOG\" with title \"PEA Maintain\" sound name \"Basso\""
fi
exit $STATUS
