// Local retrieval only. No inference of hiring suitability or absence of experience.
const normalise = text => String(text ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const regexEscape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export function containsKeyword(text, word) {
  const haystack = normalise(text), needle = normalise(word);
  if (!needle) return false;
  if (/^[a-z0-9 /+-]+$/i.test(needle)) {
    return new RegExp(`(?:^|[^a-z0-9])${regexEscape(needle)}(?:$|[^a-z0-9])`, 'i').test(haystack);
  }
  return haystack.includes(needle);
}

// Keep the collaboration requirement visible when the following product action has its own evidence.
function requirements(input) {
  const pieces = input
    .replace(/((?:与|同|和)[^，,。；;\n]{0,36}?算法(?:团队)?(?:协同|协作|合作))(?=优化|验证|改进|设计|制定|推进)/g, '$1；')
    .replace(/((?:collaborate|partner|work) with [^,;.\n]{0,45}?algorithms? team) to /gi, '$1;')
    .split(/[\n\r。；;!?！？，,]+|\.\s+(?=[A-Z])/u);
  return [...new Set(pieces.map(s => s.replace(/^\s*(?:[-•·]|\d+[.、)])\s*/, '').trim()).filter(Boolean))];
}

export function findEvidence(text, dimensions) {
  const input = String(text ?? '').slice(0,12000).trim();
  const clauses = requirements(input);
  const matched = dimensions.map(dim=>({
    ...dim,
    wordsFound: dim.words.filter(word=>containsKeyword(input,word)),
    clauses: clauses.filter(clause=>dim.words.some(word=>containsKeyword(clause,word))),
  })).filter(dim=>dim.wordsFound.length);
  const identified = new Set(matched.flatMap(dim=>dim.clauses));
  return {input,matched,unrecognised:clauses.filter(clause=>!identified.has(clause))};
}
