import { useQuery } from '@tanstack/react-query';
import { apiQueryKeys } from '../queryKeys';
import { pokemonName } from '../pokemonNames';
import { featuredForDocument } from '../featured';

export interface Species {
  ja: string;
  en: string;
  generation: number;
  description: string;
}

interface RecordData {
  id: number;
  number: number;
  name: string;
  form: string;
  englishForm: string;
  variant: boolean;
  heightDm: number;
  weightHg: number | null;
  types: string[];
  abilities: string[];
  stats: number[];
}

interface CatalogFile {
  species: Record<number, Species>;
  abilities: Record<string, string>;
  statNames: string[];
  entries: RecordData[];
}

export interface CatalogEntry extends RecordData {
  species: Species;
  display: ReturnType<typeof pokemonName>;
}

export interface Catalog {
  entries: CatalogEntry[];
  byId: Map<number, CatalogEntry>;
  bySpecies: Map<number, CatalogEntry[]>;
  featured: CatalogEntry[];
  abilities: Record<string, string>;
  statNames: string[];
  generations: number[];
  speciesCount: number;
  lastNumber: number;
}

// One small index covers all forms. Filtering never requests individual Pokémon.
async function loadCatalog(): Promise<Catalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/catalog.json?v=2`);
  if (!response.ok) throw new Error('図鑑データを読み込めませんでした。');
  const data: CatalogFile = await response.json();
  const entries = data.entries.map(record => {
    const species = data.species[record.number];
    return { ...record, species, display: pokemonName(species.ja, record.name, record.form, record.variant, record.englishForm) };
  });
  const bySpecies = new Map<number, CatalogEntry[]>();
  for (const entry of entries) {
    const family = bySpecies.get(entry.number);
    if (family) family.push(entry);
    else bySpecies.set(entry.number, [entry]);
  }
  for (const family of bySpecies.values()) {
    family.sort((a, b) => Number(a.variant) - Number(b.variant) || a.display.order - b.display.order || a.id - b.id);
  }
  const numbers = Object.keys(data.species).map(Number);
  return {
    entries,
    featured: featuredForDocument(entries),
    byId: new Map(entries.map(entry => [entry.id, entry])),
    bySpecies,
    abilities: data.abilities,
    statNames: data.statNames,
    generations: [...new Set(entries.map(entry => entry.species.generation))].sort((a, b) => a - b),
    speciesCount: numbers.length,
    lastNumber: Math.max(...numbers),
  };
}

export const useCatalog = () => useQuery({
  queryKey: apiQueryKeys.pokemon.catalog,
  queryFn: loadCatalog,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});

export function dexNumber(number: number) {
  return String(number).padStart(4, '0');
}

export function englishLabel(entry: CatalogEntry) {
  if (!entry.variant) return entry.species.en;
  return entry.englishForm || entry.name.replaceAll('-', ' ');
}
