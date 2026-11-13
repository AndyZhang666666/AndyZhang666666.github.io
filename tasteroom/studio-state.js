// UI-only state: neither a preference nor an artwork revision.
export function hasUnappliedCopy(current, details, draft, draftDetails) {
  const normal = value => String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').trim();
  return !!(draft && draft.some((value, index) => normal(value) !== normal(current[index]))) ||
    !!(draftDetails && ['when','where','action'].some(key => normal(draftDetails[key]) !== normal(details[key])));
}
export function validateCopy(values) {
  if (values.some(value => !String(value).trim())) return '请补全类别、标题、副文案和落款。';
  if (values[1].split('\n').length > 4 || values[2].split('\n').length > 4) return '标题和副文案最多四行；内容已保留，请调整换行。';
  return null;
}
