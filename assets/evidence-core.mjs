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

export function findEvidence(text, dimensions) {
  const input = String(text ?? '').slice(0,12000).trim();
  const clauses = [...new Set(input.split(/[\n\r。；;!?！？]+/).map(s=>s.replace(/^\s*(?:[-•·]|\d+[.、)])\s*/,'').trim()).filter(Boolean))];
  const matched = dimensions.map(dim=>({
    ...dim,
    wordsFound: dim.words.filter(word=>containsKeyword(input,word)),
    clauses: clauses.filter(clause=>dim.words.some(word=>containsKeyword(clause,word))),
  })).filter(dim=>dim.wordsFound.length);
  const identified = new Set(matched.flatMap(dim=>dim.clauses));
  return {input,matched,unrecognised:clauses.filter(clause=>!identified.has(clause))};
}
