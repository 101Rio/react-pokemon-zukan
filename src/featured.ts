import type { CatalogEntry } from './api/catalog';
import localArt from './data/local-artwork.json';

const illustrated = new Set(localArt);
const featuredCount = 6;
const storageKey = `pokedex:${import.meta.env.BASE_URL}:previous-picks`;
let current: CatalogEntry[] | undefined;

export function drawFeatured(entries: CatalogEntry[], previous: number[], random = Math.random) {
  const bySpecies = new Map<number, CatalogEntry[]>();
  for (const entry of entries) {
    if (!illustrated.has(entry.id)) continue;
    const forms = bySpecies.get(entry.number);
    if (forms) forms.push(entry);
    else bySpecies.set(entry.number, [entry]);
  }
  const all = [...bySpecies.keys()];
  const fresh = all.filter(number => !previous.includes(number));
  const pool = fresh.length >= featuredCount ? fresh : all;
  const picks: CatalogEntry[] = [];
  for (let i = 0; i < featuredCount && pool.length; i++) {
    const index = Math.floor(random() * pool.length);
    const number = pool[index];
    pool[index] = pool[pool.length - 1];
    pool.pop();
    const forms = bySpecies.get(number)!;
    picks.push(forms[Math.floor(random() * forms.length)]);
  }
  return picks;
}

export function featuredForDocument(entries: CatalogEntry[]) {
  if (current) return current;
  let previous: number[] = [];
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
    if (Array.isArray(stored)) previous = stored.filter((value): value is number => Number.isInteger(value));
  } catch { /* Storage is optional in private or restricted contexts. */ }
  current = drawFeatured(entries, previous);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(current.map(pokemon => pokemon.number)));
  } catch { /* The selection remains available for this document. */ }
  return current;
}
