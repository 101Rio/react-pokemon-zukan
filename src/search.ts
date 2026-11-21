import type { Catalog } from './api/catalog';
import { pokemonTypesMap } from './pokemonTypesMap';

export type Filters = {
  speciesId: number | null;
  height: string;
  weight: string;
  types: string[];
  generation: string;
  ability: string;
  abilityExact: boolean;
  from: string;
  to: string;
  form: string;
};

export const emptyFilters: Filters = { speciesId: null, height: '', weight: '', types: [], generation: '', ability: '', abilityExact: false, from: '', to: '', form: '' };
export const measureKeys = ['height', 'weight'] as const;
export type Measure = typeof measureKeys[number];
export const measures = { height: { label: '高さ', unit: 'm' }, weight: { label: '体重', unit: 'kg' } };
export const unknownWeight = '不明';

// The catalog stores integer decimetres / hectograms. The UI and URLs use m / kg.
export function measureInput(tenths: number | null) {
  return tenths === null ? unknownWeight : (tenths / 10).toFixed(1);
}

export function canonicalMeasure(field: Measure, value: string) {
  const text = value.normalize('NFKC').trim();
  if (field === 'weight' && text === unknownWeight) return unknownWeight;
  if (!/^(?:\d+(?:\.\d?0*)?|\.\d0*)$/.test(text)) return '';
  const tenths = Math.round(Number(text) * 10);
  return Number.isSafeInteger(tenths) && tenths > 0 ? measureInput(tenths) : '';
}

export function measureLabel(field: Measure, value: string) {
  return value === unknownWeight ? value : `${value} ${measures[field].unit}`;
}
export const sortOptions = { number: '図鑑番号', kana: '名前', stats: '強さ（合計種族値）' };
export type Sort = keyof typeof sortOptions;
export type Direction = 'asc' | 'desc';
const typeKeys = new Set(pokemonTypesMap.map(type => type.type));

export function readSearch(params: URLSearchParams, catalog?: Catalog) {
  const types = [...new Set(params.getAll('type').filter(type => typeKeys.has(type)))].slice(0, 2);
  const value = (key: string) => params.get(key) ?? '';
  const number = (key: string) => /^\d{1,6}$/.test(value(key)) ? value(key) : '';
  const form = value('form');
  const query = value('q');
  const speciesId = Number(number('species')) || null;
  const speciesName = speciesId && catalog?.bySpecies.get(speciesId)?.[0]?.species.ja;
  const legacy = value('sort');
  const sort: Sort = Object.hasOwn(sortOptions, legacy) ? legacy as Sort : 'number';
  const dir = value('dir');
  // Previously "reverse" encoded number-desc and "stats" on its own meant strongest first.
  const direction: Direction = dir === 'asc' || dir === 'desc' ? dir : legacy === 'reverse' || legacy === 'stats' ? 'desc' : 'asc';
  return {
    query, sort, direction,
    filters: {
      speciesId: query && (!catalog || query === speciesName) ? speciesId : null,
      height: canonicalMeasure('height', value('height')),
      weight: canonicalMeasure('weight', value('weight') === 'unknown' ? unknownWeight : value('weight')),
      types, generation: number('gen'),
      ability: value('ability'), abilityExact: Boolean(value('ability')) && value('exact') === '1',
      from: number('from'), to: number('to'),
      form: ['base', 'variant'].includes(form) ? form : '',
    },
  };
}

export function makeSearch(query: string, filters: Filters, sort: Sort = 'number', direction: Direction = 'asc') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (query && filters.speciesId) params.set('species', String(filters.speciesId));
  if (filters.height) params.set('height', filters.height);
  if (filters.weight) params.set('weight', filters.weight === unknownWeight ? 'unknown' : filters.weight);
  filters.types.forEach(type => params.append('type', type));
  if (filters.generation) params.set('gen', filters.generation);
  if (filters.ability.trim()) {
    params.set('ability', filters.ability.trim());
    if (filters.abilityExact) params.set('exact', '1');
  }
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.form) params.set('form', filters.form);
  if (sort !== 'number') params.set('sort', sort);
  if (direction === 'desc' || sort === 'stats') params.set('dir', direction);
  return params;
}

export function normalizeName(value: string) {
  return value.normalize('NFKC').toLowerCase()
    .replace(/[ぁ-ゖゝゞ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
    .replace(/\p{Script=Latin}/gu, char => char.normalize('NFD').replace(/\p{Mark}/gu, ''))
    .replace(/[\s.・:：_'’()-]/g, '');
}

export function filterCatalog(catalog: Catalog, query: string, filters: Filters) {
  const candidates = filters.speciesId === null ? catalog.entries : catalog.bySpecies.get(filters.speciesId) ?? [];
  const text = filters.speciesId === null ? query.normalize('NFKC').trim() : '';
  const numeric = text.match(/^(?:#|no\.?\s*|図鑑番号\s*)?\s*(\d+)$/i);
  const terms = numeric ? [] : text.split(/\s+/).map(normalizeName).filter(Boolean);
  const ability = normalizeName(filters.ability);
  const abilityMatches = (value: string) => filters.abilityExact ? normalizeName(value) === ability : normalizeName(value).includes(ability);
  const low = Number(filters.from) || 0;
  const high = Number(filters.to) || Infinity;
  const heightDm = Math.round(Number(filters.height) * 10);
  const weightHg = filters.weight === unknownWeight ? null : Math.round(Number(filters.weight) * 10);
  return candidates.filter(entry => {
    if (filters.height && entry.heightDm !== heightDm) return false;
    if (filters.weight && entry.weightHg !== weightHg) return false;
    if (numeric && entry.number !== Number(numeric[1]) && entry.id !== Number(numeric[1])) return false;
    if (entry.number < low || entry.number > high) return false;
    if (filters.generation && entry.species.generation !== Number(filters.generation)) return false;
    if (filters.form && entry.variant !== (filters.form === 'variant')) return false;
    if (!filters.types.every(type => entry.types.includes(type))) return false;
    if (ability && !entry.abilities.some(key => abilityMatches(key) || abilityMatches(catalog.abilities[key] ?? ''))) return false;
    if (!terms.length) return true;
    const names = [entry.display.full, entry.display.sortName, entry.species.ja, entry.species.en, entry.name, entry.form, entry.englishForm ?? ''].map(normalizeName);
    return terms.every(term => names.some(name => name.includes(term)));
  });
}

export function searchCatalog(catalog: Catalog, query: string, filters: Filters, sort: Sort = 'number', direction: Direction = 'asc') {
  const matches = filterCatalog(catalog, query, filters);
  const sign = direction === 'asc' ? 1 : -1;
  matches.sort((a, b) => {
    let result = a.number - b.number;
    if (sort === 'kana') {
      // The official name index places long-vowel marks after kana (e.g. アーボ after アンノーン).
      result = a.display.sortName < b.display.sortName ? -1 : a.display.sortName > b.display.sortName ? 1 : 0;
    } else if (sort === 'stats') {
      result = a.stats.reduce((sum, value) => sum + value, 0) - b.stats.reduce((sum, value) => sum + value, 0);
    }
    return sign * result || a.number - b.number || a.display.order - b.display.order || a.id - b.id;
  });
  return matches;
}

export function rangeError(filters: Filters, max: number) {
  for (const number of [filters.from, filters.to]) {
    if (number && (!/^\d+$/.test(number) || Number(number) < 1 || Number(number) > max)) {
      return `図鑑番号は1〜${max}の整数を入力してください。`;
    }
  }
  return filters.from && filters.to && Number(filters.from) > Number(filters.to)
    ? '開始番号は終了番号以下にしてください。' : '';
}
