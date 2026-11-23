#!/bin/zsh
set -eu
set -o pipefail
cd "${0:A:h}"
site_root="$PWD"
runtime="$(command -v node || true)"
[[ -x "$runtime" ]] || runtime='/Applications/ChatGPT.app/Contents/Resources/node'
[[ -x "$runtime" ]] || { print '打开本地预览需要 Node.js。'; exit 1; }
revision='f1677dc2739866b182c9912c31e15c26eb01c480'
scratch_base="${TMPDIR:-/tmp}"
frozen_dir="${scratch_base%/}/portfolio-review-$revision"
if [[ ! -r "$frozen_dir/.preview-revision" ]]; then
  stage_dir="$(mktemp -d "${scratch_base%/}/portfolio-snapshot.XXXXXX")"
  git archive "$revision" | tar -xf - -C "$stage_dir"
  print -r -- "$revision" > "$stage_dir/.preview-revision"
  if [[ ! -e "$frozen_dir" ]]; then mv "$stage_dir" "$frozen_dir"; fi
fi
[[ "$(< "$frozen_dir/.preview-revision")" == "$revision" ]] || { print '对照底稿未能正确读取。'; exit 1; }
typeset -a preview_children
serve() {
  local port="$1" dir="$2"
  if curl -fsS --max-time 2 "http://127.0.0.1:$port/__preview__" 2>/dev/null | grep -Fq "\"root\":\"$dir\""; then return; fi
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null; then print "本地端口 $port 正由其他预览使用。"; exit 1; fi
  PREVIEW_PORT="$port" PREVIEW_ROOT="$dir" nohup "$runtime" "$site_root/scripts/preview.mjs" >"${scratch_base%/}/portfolio-studio-$port.log" 2>&1 </dev/null &
  preview_children+=("$!")
  for retry in {1..35}; do
    if curl -fsS --max-time 1 "http://127.0.0.1:$port/__preview__" >/dev/null 2>&1; then return; fi
    sleep .15
  done
  print "本地预览启动失败，端口 $port。"; exit 1
}
serve 8971 "$site_root"
serve 8972 "$frozen_dir"
url='http://127.0.0.1:8971/studio-review.html'
print -r -- "$url"
if [[ "${1:-}" != '--serve' && "${1:-}" != '--no-open' ]]; then open "$url"; fi
if [[ "${1:-}" == '--serve' ]]; then
  for child in "${preview_children[@]}"; do wait "$child"; done
fi
