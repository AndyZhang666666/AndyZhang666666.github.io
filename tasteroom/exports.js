import { posterSvg } from './experiments.js';

// Both image formats use the exact SVG shown in the working canvas.
export function visibleRoom(room, comparison, side) {
  return comparison && ['a', 'b'].includes(side)
    ? { ...room, canvas: { ...comparison.variants[side === 'a' ? 0 : 1] } }
    : room;
}

export function replacedRules(room, dimension, scope) {
  if (scope === 'once') return [];
  return room.memories.filter(m => m.status === 'active' && m.dimension === dimension &&
    (scope === 'global' || m.context === room.context));
}

export function trialParameter(room, dimension, value) {
  const memory = { id: 'once_' + ++room.seq, dimension, preference: value, type: 'explicit',
    context: room.context, confidence: 1, sourceReason: '本人临时试用；未授权长期记忆',
    status: 'overridden', order: room.seq };
  room.memories.push(memory);
  room.update(dimension, value, memory.id);
}

export async function posterPng(room, content) {
  // Capture the clicked canvas before yielding; later edits belong to the next export.
  const svg = posterSvg(room, content);
  await document.fonts.ready;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(Error('海报渲染失败，请重试或导出 SVG。')); image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 1200;
    canvas.getContext('2d').drawImage(image, 0, 0, 900, 1200);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('浏览器无法生成 PNG，请导出 SVG。')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

export function savePreference(room, dimension, value, scope) {
  if (!['current','global'].includes(scope) || (scope==='current' && room.context==='global')) throw Error('请明确选择有效的保存场景。');
  if (scope==='global') room.memories.filter(m=>m.status==='active'&&m.dimension===dimension).forEach(m=>m.status='overridden');
  const memory=room.upsert(dimension,value,'explicit',scope==='global'?'global':room.context,'本人在保存前核对维度、场景和替换规则，明确授权保存。');
  room.update(dimension,value,memory.id);room.log('confirm_preference',{dimension,value,scope});
}
