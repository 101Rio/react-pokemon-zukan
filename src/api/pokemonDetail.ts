import type { FlavorTextEntry, Pokemon } from './pokemon.type';
import type { Name, NamedAPIResource } from './common.type';
import { API_BASE_URL } from '../config';

export class PokemonNotFoundError extends Error {
  constructor() {
    super('ポケモンが見つかりません');
    this.name = 'PokemonNotFoundError';
  }
}

export type PokemonDetailData = {
  id: number;
  number: number;
  name: string;
  japaneseName: string;
  image: string | null;
  sprite?: string | null;
  types: string[];
  abilities: string[];
  description: string;
  baseStats: { name: string; value: number }[];
};

type SpeciesData = { id: number; names: Name[]; flavor_text_entries: FlavorTextEntry[] };

function japaneseName(names: Name[], fallback: string) {
  return (names.find(name => name.language.name === 'ja-hrkt') ?? names.find(name => name.language.name === 'ja'))?.name ?? fallback;
}

// Type, ability and stat names are shared by many records. Share in-flight requests too.
const nameRequests = new Map<string, Promise<string>>();
function resourceName(resource: NamedAPIResource) {
  const cached = nameRequests.get(resource.url);
  if (cached) return cached;
  const request = fetch(resource.url).then(async response => {
    if (!response.ok) throw new Error('日本語名の取得に失敗しました');
    const data: { names: Name[] } = await response.json();
    return japaneseName(data.names, resource.name);
  }).catch((error: unknown) => {
    nameRequests.delete(resource.url);
    throw error;
  });
  nameRequests.set(resource.url, request);
  return request;
}

export async function fetchPokemonDetail(id: number, signal?: AbortSignal): Promise<PokemonDetailData> {
  const response = await fetch(`${API_BASE_URL}/pokemon/${id}`, { signal });
  if (response.status === 404) throw new PokemonNotFoundError();
  if (!response.ok) throw new Error('ポケモンの詳細情報の取得に失敗しました');
  const pokemon: Pokemon = await response.json();
  const [species, types, abilities, baseStats] = await Promise.all([
    fetch(pokemon.species.url, { signal }).then(async result => {
      if (!result.ok) throw new Error('ポケモン種族情報の取得に失敗しました');
      return await result.json() as SpeciesData;
    }),
    Promise.all(pokemon.types.map(slot => resourceName(slot.type))),
    Promise.all(pokemon.abilities.map(slot => resourceName(slot.ability))),
    Promise.all(pokemon.stats.map(async slot => ({ name: await resourceName(slot.stat), value: slot.base_stat }))),
  ]);
  const flavor = species.flavor_text_entries.find(entry => entry.language.name === 'ja');
  return {
    id: pokemon.id,
    number: species.id,
    name: pokemon.name,
    japaneseName: japaneseName(species.names, pokemon.name),
    image: pokemon.sprites.other?.['official-artwork']?.front_default ?? pokemon.sprites.front_default ?? null,
    sprite: pokemon.sprites.front_default,
    types,
    abilities,
    description: flavor?.flavor_text.replace(/\f/g, ' ') ?? '説明文がありません。',
    baseStats,
  };
}
