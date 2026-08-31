export function normalizeOptionText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX");
}

export function uniqueOptionsByLabel(items = [], getLabel) {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeOptionText(getLabel(item));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueOptionsByValue(items = [], getValue) {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeOptionText(getValue(item));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
