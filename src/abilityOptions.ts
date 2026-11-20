import type { CatalogEntry } from './api/catalog';
import { normalizeName } from './search';

const rows = [
  ['あ', 'アイウエオァィゥェォ'], ['か', 'カキクケコ'], ['さ', 'サシスセソ'],
  ['た', 'タチツテトッ'], ['な', 'ナニヌネノ'], ['は', 'ハヒフヘホ'],
  ['ま', 'マミムメモ'], ['や', 'ヤユヨャュョ'], ['ら', 'ラリルレロ'], ['わ', 'ワヲン'],
];
export const kanaRows = rows.map(([row]) => row);
const collator = new Intl.Collator('ja');

export type AbilityOption = { name: string; row: string; keys: string[]; count: number };

export function abilityOptions(entries: CatalogEntry[], names: Record<string, string>): AbilityOption[] {
  const groups = new Map<string, { keys: Set<string>; count: number }>();
  for (const pokemon of entries) {
    const counted = new Set<string>();
    for (const key of pokemon.abilities) {
      const name = names[key] || key;
      const group = groups.get(name) ?? { keys: new Set<string>([normalizeName(name)]), count: 0 };
      group.keys.add(normalizeName(key));
      if (!counted.has(name)) group.count++;
      counted.add(name);
      groups.set(name, group);
    }
  }
  return [...groups].map(([name, group]) => {
    const initial = normalizeName(name).normalize('NFD').charAt(0);
    const row = rows.find(([, kana]) => kana.includes(initial))?.[0] ?? 'その他';
    return { name, row, keys: [...group.keys], count: group.count };
  }).sort((a, b) => collator.compare(a.name, b.name));
}
