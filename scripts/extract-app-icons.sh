#!/bin/zsh
set -e
OUT="public/img/apps"
mkdir -p "$OUT"
extract() {
  local app="$1" name="$2"
  local plist="$app/Contents/Info.plist"
  local icon
  icon=$(defaults read "$plist" CFBundleIconFile 2>/dev/null || true)
  if [[ -z "$icon" ]]; then echo "no icon for $app"; return; fi
  [[ "$icon" != *.icns ]] && icon="$icon.icns"
  local path="$app/Contents/Resources/$icon"
  if [[ ! -f "$path" ]]; then
    path=$(find "$app/Contents/Resources" -maxdepth 2 -name '*.icns' | head -1)
  fi
  if [[ ! -f "$path" ]]; then echo "missing $path"; return; fi
  /usr/bin/sips -s format png "$path" --out "/tmp/$name.png" >/dev/null
  /usr/bin/sips -z 128 128 "/tmp/$name.png" --out "$OUT/$name.png" >/dev/null
  echo "$name <- $path"
}
extract "/Applications/Slack.app" slack
extract "/Applications/Cursor.app" cursor
extract "/Applications/Notion.app" notion
extract "/Applications/Google Chrome.app" chrome
extract "/System/Applications/Mail.app" mail
extract "/System/Applications/Messages.app" messages
extract "/System/Applications/Utilities/Terminal.app" terminal
extract "/Applications/OpenCode.app" opencode
extract "/Applications/Visual Studio Code.app" vscode
extract "/Applications/Telegram.app" telegram
extract "/Applications/Discord.app" discord
