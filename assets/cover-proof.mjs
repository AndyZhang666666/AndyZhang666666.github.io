import {createStory, examples, revise, rows} from '../studio/script/story.mjs';
import {escapeText as escape} from '../studio/ui.mjs';

// Only the visitor's choices are stored. Replaying them against the localized
// source keeps the original lines, rule and conflict count owned by the tool.
export function readProof(actions, english = false) {
  const say = (zh, en) => english ? en : zh;
  let story = createStory(examples[english ? 'en' : 'zh'].join('\n\n'), 3,
    say('阿禾', 'Ahe'), say('寄信人是林岚', 'Lin Lan sent the letter'));
  for (const action of actions) {
    if (action === 'delay') {
      story = {...story, reveal: 5};
      continue;
    }
    const line = rows(story).find(item => item.key === action && item.conflict);
    if (!line) continue;
    const wording = line.scene === 3
      ? say('阿禾：会不会是林岚？', 'Ahe: Could it have been Lin Lan?')
      : say('阿禾：这封信会是她寄来的吗？', 'Ahe: Could she have sent this letter?');
    story = revise(story, line.key, 'doubt', wording);
  }
  const marked = rows(story).filter(line => line.requires);
  return {story, marked, pending: marked.filter(line => line.conflict).length};
}

export function proofStatus(proof, english) {
  const accepted = Object.keys(proof.story.edits).length;
  if (english) return 'Reveal in scene ' + proof.story.reveal + ' · ' + proof.pending + ' open · ' + accepted + ' revised';
  return '第 ' + proof.story.reveal + ' 场揭晓 · ' + proof.pending + ' 处待处理 · ' + accepted + ' 处已改';
}

export function renderProof(actions = [], english = false) {
  const t = (zh, en) => english ? en : zh;
  const proof = readProof(actions, english);
  const lines = proof.marked.map(line => {
    const scene = proof.story.scenes[line.scene - 1];
    const status = line.conflict ? 'flagged' : line.edit ? 'revised' : 'original';
    const marker = line.conflict ? t('提前知情', 'Too early') : line.edit ? t('已改为猜测', 'Revised') : '';
    const original = escape(line.text);
    const copy = line.edit ? '<del>' + original + '</del><ins>' + escape(line.edit.wording) + '</ins>' : original;
    const button = line.conflict ? '<button type="button" class="proof-edit" data-proof-action="' + escape(line.key) + '">' + t('改成猜测', 'Make it a question') + '</button>' : '';
    return '<li data-proof-line="' + status + '"><span class="proof-scene">' + String(line.scene).padStart(2,'0') + ' / ' + escape(scene.title) + '</span><p>' + copy + '</p><div class="proof-line-actions"><small>' + marker + '</small>' + button + '</div></li>';
  }).join('');
  const delay = proof.story.reveal === 3 ? '<button type="button" class="proof-primary" data-proof-action="delay">' + t('把揭晓推到第 5 场', 'Move the reveal to scene 5') + ' <span aria-hidden="true">→</span></button>' : '';
  const tools = actions.length ? '<button type="button" data-proof-action="undo">' + t('撤回上一步', 'Undo last step') + '</button><button type="button" data-proof-action="ticket">' + t('保存这次票根', 'Save this ticket') + ' ↓</button>' : '';
  return '<div class="proof-copy"><p>' + t('阿禾收到一封匿名信，原定在第 3 场才知道是谁写的。把真相留到结尾，再读一次她的对白。','Ahe receives an unsigned letter. She learns who wrote it in scene 3. Move the reveal to the ending, then read her lines again.') + '</p><div class="proof-actions">' + delay + tools + '</div></div><div class="proof-galley"><ol>' + lines + '</ol><output tabindex="-1" class="proof-status">' + proofStatus(proof, english) + '</output></div>';
}

export function ticketHTML(actions, english, destination) {
  const proof = readProof(actions, english), t = (zh, en) => english ? en : zh;
  const edits = proof.marked.filter(line => line.edit).map(line => '<li><b>' +
    escape(proof.story.scenes[line.scene - 1].title) + '</b><br><del>' + escape(line.text) + '</del><br>' +
    escape(line.edit.wording) + '</li>').join('');
  const title = t('改一场戏 · 我的修订票根', 'Move the reveal · My revision ticket');
  return '<!doctype html><html lang="' + (english ? 'en' : 'zh-CN') +
    '"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title +
    '</title><style>html{background:#e9e2d4;color:#251e18;font:17px/1.7 Georgia,serif}body{box-sizing:border-box;max-width:35rem;margin:8vh auto;padding:clamp(20px,6vw,60px);background:#fff9ec;border-top:10px solid #b63c2a}h1{line-height:1.2}h1,li{margin:1em 0}p,ul{padding-bottom:1rem;border-bottom:1px dashed #bbad97}ul{padding-left:1.3rem}a{color:#9c3220;overflow-wrap:anywhere}small{font-family:monospace}@media print{html{background:white}body{margin:0 auto}}</style><body><small>' +
    t('张千羽 · 产品作品集', 'Andy Zhang · Product portfolio') + '</small><h1>' + title + '</h1><p>' +
    t('将揭晓从第 3 场推迟到第 5 场。','Moved the reveal from scene 3 to scene 5.') + '<br>' + proofStatus(proof, english) + '</p>' +
    (edits ? '<ul>' + edits + '</ul>' : '') + '<a href="' + escape(destination) + '">' + t('打开完整剧本工具', 'Open the full script tool') + '</a></body></html>';
}
