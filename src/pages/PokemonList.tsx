import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import type { CatalogEntry } from '../api/catalog';
import { useCatalog } from '../api/catalog';
import { INITIAL_POKEMON_LIST_LIMIT } from '../config';
import Hero from '../components/Hero';
import { Icon } from '../components/Icon';
import TypeIcon from '../components/TypeIcon';
import AdvancedSearch from '../components/AdvancedSearch';
import PokemonCard from '../components/PokemonCard';
import { typeInfo } from '../pokemonTypesMap';
import { emptyFilters, makeSearch, readSearch, searchCatalog, sortOptions } from '../search';
import type { Direction, Filters, Sort } from '../search';

const quickTypes = ['fire', 'water', 'grass', 'electric', 'ghost'];
const pageSize = INITIAL_POKEMON_LIST_LIMIT;
const directionLabels: Record<Sort, Record<Direction, string>> = {
  number: { asc: '番号が小さい順', desc: '番号が大きい順' },
  kana: { asc: 'アからンの順', desc: 'ンからアの順' },
  stats: { asc: '種族値が低い順', desc: '種族値が高い順' },
};
type Position = { search: string; limit: number; y: number };
let lastPosition: Position | undefined;

function Results({ entries, search, restore, showStats }: { entries: CatalogEntry[]; search: string; restore?: Position; showStats: boolean }) {
  const [limit, setLimit] = useState(restore?.limit ?? pageSize);
  const sentinel = useRef<HTMLDivElement>(null);
  const more = entries.length > limit;

  useLayoutEffect(() => {
    if (restore) window.scrollTo({ top: restore.y, behavior: 'instant' });
  }, [restore]);

  useEffect(() => {
    if (!more || !sentinel.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([record]) => {
      if (record.isIntersecting) setLimit(previous => previous + pageSize);
    }, { rootMargin: '120px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [more, limit]);

  const remember = () => { lastPosition = { search, limit, y: window.scrollY }; };
  return <>
    <div className="pokemon-grid">{entries.slice(0, limit).map((pokemon, i) =>
      <PokemonCard key={pokemon.id} pokemon={pokemon} search={search} onOpen={remember} showStats={showStats} eager={i < 8} />
    )}</div>
    {more && <div ref={sentinel} className="load-more"><button type="button" className="btn secondary" onClick={() => setLimit(previous => previous + pageSize)}><Icon name="plus" size={16} />続きを読み込む</button></div>}
  </>;
}

export default function PokemonList() {
  const { data: catalog, isError, refetch } = useCatalog();
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const navigation = useNavigationType();
  const { query, filters, sort, direction } = useMemo(() => readSearch(params), [params]);
  const base = makeSearch(query, filters, sort, direction).toString();
  const search = base ? '?' + base : '';
  const [restore] = useState(() => (navigation === 'POP' || state?.returnToList) && lastPosition?.search === search ? lastPosition : undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState<string | null>(null);
  const advanced = params.get('advanced') === '1';
  const entries = useMemo(() => catalog ? searchCatalog(catalog, query, filters, sort, direction) : [], [catalog, query, filters, sort, direction]);

  function update(newQuery: string, next: Filters, order = sort, dir = direction) {
    setParams(makeSearch(newQuery, next, order, dir), { replace: true });
  }
  function openAdvanced() {
    const next = makeSearch(query, filters, sort, direction);
    next.set('advanced', '1');
    setParams(next, { replace: true });
  }
  const reset = () => { setComposing(null); update('', emptyFilters); };
  const chips: { label: string; remove: () => void }[] = [
    ...filters.types.map(type => ({ label: typeInfo(type).jaType, remove: () => update(query, { ...filters, types: filters.types.filter(v => v !== type) }) })),
  ];
  if (filters.generation) chips.push({ label: `第${filters.generation}世代`, remove: () => update(query, { ...filters, generation: '' }) });
  if (filters.ability) chips.push({ label: `特性：${filters.ability}`, remove: () => update(query, { ...filters, ability: '', abilityExact: false }) });
  if (filters.form) chips.push({ label: filters.form === 'base' ? '標準の姿のみ' : '別の姿のみ', remove: () => update(query, { ...filters, form: '' }) });
  if (filters.from || filters.to) chips.push({ label: `No. ${filters.from || '1'}〜${filters.to || catalog?.lastNumber || ''}`, remove: () => update(query, { ...filters, from: '', to: '' }) });

  useLayoutEffect(() => {
    if (!restore) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [restore]);
  useLayoutEffect(() => {
    if (state?.focusResults && !restore) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [restore, state?.focusResults]);
  useEffect(() => { document.title = 'ポケモン図鑑'; }, []);

  return <>
    <Hero entries={catalog?.featured ?? []} onOpen={() => { lastPosition = { search, limit: pageSize, y: window.scrollY }; }} />
    <div className="shell catalog-shell">
      <section className="search-console" aria-label="ポケモンを探す">
        <div className="search-row">
          <label className="search-box"><Icon name="search" size={23} /><span className="sr-only">名前・図鑑番号で検索</span>
            <input ref={input} type="search" enterKeyHint="search" autoComplete="off" placeholder="名前・図鑑番号" value={composing ?? query}
              onCompositionStart={e => setComposing(e.currentTarget.value)} onCompositionEnd={e => { setComposing(null); update(e.currentTarget.value, filters); }}
              onChange={e => composing === null ? update(e.target.value, filters) : setComposing(e.target.value)} />
          </label>
          {query && <button className="clear-query" type="button" aria-label="キーワードを消去" onClick={() => { setComposing(null); update('', filters); input.current?.focus(); }}><Icon name="close" size={16} /></button>}
          <button type="button" className="advanced-trigger" onClick={openAdvanced} aria-haspopup="dialog"><Icon name="filters" size={19} />詳細検索{chips.length > 0 && <span>{chips.length}</span>}</button>
        </div>
        <div className="quick-filters" aria-label="タイプで絞り込み">
          <span className="quick-title">タイプ</span>
          <button type="button" className="quick-chip all-chip" aria-pressed={!filters.types.length} onClick={() => update(query, { ...filters, types: [] })}>すべて</button>
          {quickTypes.map(key => {
            const type = typeInfo(key);
            const active = filters.types.includes(key);
            return <button type="button" key={key} className="quick-chip" aria-pressed={active} style={{ '--type': type.color } as CSSProperties}
              onClick={() => update(query, { ...filters, types: active && filters.types.length === 1 ? [] : [key] })}><TypeIcon type={key} />{type.jaType}</button>;
          })}
          <button className="more-types" type="button" onClick={openAdvanced}><Icon name="plus" size={14} />ほかのタイプ</button>
        </div>
      </section>
      {chips.length > 0 && <div className="applied-filters" aria-label="適用中の条件">{chips.map(chip =>
        <button key={chip.label} type="button" onClick={chip.remove} aria-label={`${chip.label}の条件を解除`}>{chip.label}<Icon name="close" size={12} /></button>
      )}<button type="button" className="clear-filters" onClick={() => update(query, emptyFilters)}>条件をクリア</button></div>}
      <section className="catalog-results" aria-labelledby="results-title">
        <header className="results-header">
          <div className="result-titles"><span className="title-stripe" aria-hidden="true" /><h2 id="results-title" ref={heading} tabIndex={-1}>{query || chips.length ? '検索結果' : 'ポケモン一覧'}</h2>
            <span className="result-count" role="status">{catalog ? <><b>{entries.length.toLocaleString('ja-JP')}</b> 件</> : '読込中'}</span>
          </div>
          <div className="order-controls"><label className="sort select-wrap"><Icon name="sort" size={17} /><span className="sr-only">並べ替えの項目</span><select value={sort} onChange={e => update(query, filters, e.target.value as Sort)}>
            {Object.entries(sortOptions).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select><Icon name="down" size={14} /></label>
            <div className="order-direction" role="group" aria-label="並べ替えの方向">
              {(['asc', 'desc'] as const).map(dir => <button key={dir} type="button" aria-pressed={direction === dir}
                title={directionLabels[sort][dir]}
                onClick={() => update(query, filters, sort, dir)}><span aria-hidden="true">{dir === 'asc' ? '↑' : '↓'}</span>{dir === 'asc' ? '昇順' : '降順'}</button>)}
            </div>
          </div>
        </header>
        {isError && !catalog ? <div className="state-box" role="alert"><Icon name="book" size={30} /><h3>図鑑を読み込めませんでした</h3><button type="button" className="btn secondary" onClick={() => void refetch()}>再読み込み</button></div>
          : !catalog ? <div className="pokemon-grid" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-card" />)}</div>
          : entries.length ? <Results key={base} showStats={sort === 'stats'} entries={entries} search={search} restore={restore?.search === search ? restore : undefined} />
          : <div className="state-box"><span className="state-symbol"><Icon name="search" size={32} /></span><h3>ポケモンが見つかりませんでした</h3><p>名前の一部で検索するか、絞り込み条件を減らしてみてください。</p><button className="btn secondary" type="button" onClick={reset}>検索条件をリセット</button></div>}
      </section>
    </div>
    {advanced && catalog && <AdvancedSearch catalog={catalog} query={query} current={filters} onClose={() => update(query, filters)} onApply={next => update(query, next)} />}
  </>;
}
