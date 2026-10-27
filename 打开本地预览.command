#!/bin/zsh
set -e
cd "$(dirname "$0")"
task_preview_node=$(command -v node || true)
if [[ -z "$task_preview_node" ]]; then
  task_preview_node="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$task_preview_node" ]]; then
  print "未找到 Node.js，请安装 Node.js 22 或更新版本后重新打开。"
  read -k 1
  exit 1
fi
if ! curl --fail --silent --max-time 2 http://127.0.0.1:8811/review.html >/dev/null; then
  nohup "$task_preview_node" --watch scripts/preview.mjs > /private/tmp/andy-original-content-8811.log 2>&1 </dev/null &
  for task_preview_attempt in {1..15}; do
    if curl --fail --silent --max-time 1 http://127.0.0.1:8811/review.html >/dev/null; then break; fi
    sleep 0.2
  done
fi
open http://127.0.0.1:8811/review.html
