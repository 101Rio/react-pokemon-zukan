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
  featured: CatalogEntry[];
  abilities: Record<string, string>;
  statNames: string[];
  generations: number[];
  speciesCount: number;
  lastNumber: number;
}

// One small index covers all forms. Filtering never requests individual Pokémon.
async function loadCatalog(): Promise<Catalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`);
  if (!response.ok) throw new Error('図鑑データを読み込めませんでした。');
  const data: CatalogFile = await response.json();
  const entries = data.entries.map(record => {
    const species = data.species[record.number];
    return { ...record, species, display: pokemonName(species.ja, record.name, record.form, record.variant, record.englishForm) };
  });
  const numbers = Object.keys(data.species).map(Number);
  return {
    entries,
    featured: featuredForDocument(entries),
    byId: new Map(entries.map(entry => [entry.id, entry])),
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
