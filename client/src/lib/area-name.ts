const LOWERCASE_WORDS = new Set(["and", "of"]);

// Source names mix casings: some all caps, some French names with a lowercase
// generic term. Apostrophes don't start a word so "MARY'S" becomes "Mary's".
export function formatAreaName(name: string): string {
  const isAllCaps = name === name.toUpperCase() && name !== name.toLowerCase();
  const cased = isAllCaps
    ? name
        .toLowerCase()
        .replace(/(^|[\s\-(/.])(\p{L}+)/gu, (_, sep: string, word: string) =>
          sep && LOWERCASE_WORDS.has(word)
            ? sep + word
            : sep + word[0].toUpperCase() + word.slice(1),
        )
    : name;
  return cased.charAt(0).toUpperCase() + cased.slice(1);
}
