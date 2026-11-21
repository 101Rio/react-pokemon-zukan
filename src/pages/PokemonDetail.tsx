import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPokemonDetail, PokemonNotFoundError } from '../api/pokemonDetail';
import type { PokemonDetailData } from '../api/pokemonDetail';
import { fetchPokemonIndex } from '../api/pokemon';
import { dexNumber, englishLabel, useCatalog } from '../api/catalog';
import { apiQueryKeys } from '../queryKeys';
import { emptyFilters, makeSearch, measureInput, measureKeys, measureLabel, measures, readSearch, searchCatalog } from '../search';
import type { Filters, Measure } from '../search';
import { pokemonName } from '../pokemonNames';
import { typeInfo } from '../pokemonTypesMap';
import { Icon } from '../components/Icon';
import PokemonImage from '../components/PokemonImage';
import PokemonTypeLabel from '../components/PokemonTypeLabel';
import FormNavigation from '../components/FormNavigation';

export default function PokemonDetail() {
  const { id } = useParams();
  const [showSprite, setShowSprite] = useState(false);
  const number = Number(id);
  const valid = /^[1-9]\d*$/.test(id ?? '') && Number.isSafeInteger(number);
  const { search, state } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const { data: catalog, isLoading: waitForCatalog } = useCatalog();
  const entry = catalog?.byId.get(number);
  const live = useQuery({
    queryKey: apiQueryKeys.pokemon.detail(number),
    queryFn: ({ signal }) => fetchPokemonDetail(number, signal),
    enabled: valid,
    retry: (count, error) => !(error instanceof PokemonNotFoundError) && count < 1,
    staleTime: 30 * 60_000,
  });
  // Direct links to newer API records still work before the bundled index is refreshed.
  const index = useQuery({
    queryKey: apiQueryKeys.pokemon.index,
    queryFn: fetchPokemonIndex,
    enabled: Boolean(live.data && !entry && !waitForCatalog),
    staleTime: 60 * 60_000,
  });
  const cached: PokemonDetailData | undefined = entry && catalog ? {
    id: entry.id, number: entry.number, name: entry.name, japaneseName: entry.species.ja,
    types: entry.types, abilities: entry.abilities.map(key => catalog.abilities[key] ?? key),
    description: entry.species.description || '説明文がありません。', image: null,
    baseStats: entry.stats.map((value, i) => ({ name: catalog.statNames[i], value })),
  } : undefined;
  const data = live.data ?? cached;
  const display = entry?.display ?? (data ? pokemonName(data.japaneseName, data.name) : undefined);
  const title = display?.full;
  const back = <Link className="back-link" to={{ pathname: '/', search }} state={{ returnToList: true }}><Icon name="left" size={16} />{search ? '検索結果に戻る' : '一覧に戻る'}</Link>;
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (state?.focusEntry) heading.current?.focus({ preventScroll: true });
  }, [number, state?.focusEntry]);
  useEffect(() => { document.title = title ? `${title} | ポケモン図鑑` : 'ポケモン詳細 | ポケモン図鑑'; }, [title]);

  if (!valid || !data) {
    const loading = valid && (live.isPending || waitForCatalog);
    const notFound = live.error instanceof PokemonNotFoundError;
    return <div className="shell detail-shell">{back}<div className="state-box" role={loading ? 'status' : 'alert'}>
      <Icon name="ball" size={35} />
      <h1>{!valid ? '図鑑番号が正しくありません' : loading ? 'ポケモンを読み込み中…' : notFound ? 'ポケモンが見つかりませんでした' : '詳細を読み込めませんでした'}</h1>
      {valid && !loading && !notFound && <button type="button" className="btn secondary" disabled={live.isFetching} onClick={() => void live.refetch()}>再読み込み</button>}
    </div></div>;
  }
  const pixel = Boolean(showSprite && data.sprite);
  const currentType = typeInfo(data.types[0]);
  const total = data.baseStats.reduce((sum, stat) => sum + stat.value, 0);
  const searchState = readSearch(new URLSearchParams(search), catalog);
  function related(filters: Partial<Filters>, query = '', openField?: Measure) {
    const params = makeSearch(query, { ...emptyFilters, ...filters }, searchState.sort, searchState.direction);
    if (openField) params.set('advanced', openField);
    return { pathname: '/', search: params.toString() };
  }
  const nameText = <span>{display?.name ?? data.japaneseName}
    {display?.form && <small className="name-form">（{display.form}）</small>}
    {display?.qualifier && <small className="name-form">{display.qualifier}</small>}
  </span>;
  let neighbours: { id: number; label: string }[] = [];
  if (entry && catalog) {
    const matches = searchCatalog(catalog, searchState.query, searchState.filters, searchState.sort, searchState.direction);
    const scope = matches.some(item => item.id === number) ? matches : searchCatalog(catalog, '', emptyFilters, searchState.sort, searchState.direction);
    neighbours = scope.map(item => ({ id: item.id, label: item.display.full }));
  } else if (index.data) {
    neighbours = index.data.map(item => ({ id: Number(item.url.split('/').filter(Boolean).pop()), label: item.name }));
  }
  const position = neighbours.findIndex(item => item.id === number);
  const previous = position > 0 ? neighbours[position - 1] : undefined;
  const next = position >= 0 ? neighbours[position + 1] : undefined;

  return <div className="shell detail-shell" style={{ '--type': currentType.color } as CSSProperties}>
    {back}
    <article className="detail-layout">
      <div className="detail-art-panel">
        <div className="detail-canvas"><i className="stage-ball" aria-hidden="true" /><span className="card-number"><span>No.</span> {dexNumber(data.number)}</span><Icon name="scan" size={24} />
          <PokemonImage key={number} id={number} pixel={pixel} image={pixel ? data.sprite : data.image} eager name={title ?? data.japaneseName} />
        </div>
        <div className="specimen-strip"><Icon name="ball" size={18} /><span lang="en">{entry ? englishLabel(entry) : data.name}</span>{data.sprite ? <button type="button" aria-pressed={pixel} onClick={() => setShowSprite(previous => !previous)}><Icon name="grid" size={14} />ドット絵</button> : <i aria-hidden="true" />}</div>
      </div>
      <div className="detail-sheet">
        <div className="detail-title"><span className="small-kicker" lang="en">POKÉDEX ENTRY</span><h1 ref={heading} tabIndex={-1}>{entry
          ? <Link className="name-search" to={related({ speciesId: entry.number }, entry.species.ja)} state={{ focusSearch: true }}
              title={`${entry.species.ja}のすべての姿を検索`} aria-label={`${title}の同種を検索`}>{nameText}<Icon name="search" size={18} /></Link>
          : nameText}</h1></div>
        <div className="types detail-type-links">{data.types.map(type => {
          const info = typeInfo(type);
          return <Link key={info.type} to={related({ types: [info.type] })} state={{ focusResults: true }}
            aria-label={info.jaType + 'タイプのポケモンを検索'} style={{ '--type': info.color } as CSSProperties}>
            <PokemonTypeLabel type={info.type} /><Icon name="search" size={14} />
          </Link>;
        })}</div>
        {entry && <div className="measurements">{measureKeys.map(key => {
          const value = measureInput(key === 'height' ? entry.heightDm : entry.weightHg);
          const lowerBound = key === 'height' && entry.name.endsWith('-gmax');
          const label = measureLabel(key, value);
          return <Link key={key} to={related({ [key]: value }, '', key)} state={{ focusResults: true }}
            aria-label={`${measures[key].label}${label}${lowerBound ? '以上' : ''}で詳細検索`}>
            <span className="measure-caption">{measures[key].label}</span>
            <strong>{label}{lowerBound && <small> 以上</small>}</strong><Icon name="search" size={15} />
          </Link>;
        })}</div>}
        <section className="detail-section"><h2><Icon name="book" size={17} />図鑑説明</h2><p className="description">{data.description}</p></section>
        <section className="detail-section"><h2><Icon name="stack" size={17} />特性</h2><div className="ability-list">{data.abilities.length ? data.abilities.map(ability => <Link key={ability} to={related({ ability, abilityExact: true })} state={{ focusResults: true }}
          aria-label={'特性「' + ability + '」のポケモンを検索'}>{ability}<Icon name="search" size={14} /></Link>) : <span>データなし</span>}</div></section>
        <section className="detail-section stats"><div className="stats-heading"><h2><Icon name="bars" size={17} />種族値</h2><span>合計 <strong>{total}</strong></span></div>
          <dl>{data.baseStats.map(stat => <div className="stat-line" key={stat.name}><dt>{stat.name}</dt><dd><span className="stat-track" aria-hidden="true"><i style={{ width: `${Math.min(100, stat.value / 255 * 100)}%` }} /></span><strong>{stat.value}</strong></dd></div>)}</dl>
        </section>
      </div>
    </article>
    {entry && catalog && <FormNavigation forms={catalog.bySpecies.get(entry.number) ?? []} currentId={number} search={search} />}
    {live.isError && <p className="refresh-notice" role="status">{live.data ? '前に読み込んだ情報を表示しています。' : '収録データを表示しています。'}<button type="button" disabled={live.isFetching} onClick={() => void live.refetch()}>最新情報を再取得</button></p>}
    <nav className="entry-nav" aria-label="前後のポケモン">
      {previous && <Link to={{ pathname: `/pokemon/${previous.id}`, search }}><Icon name="left" size={18} /><span><small>前のポケモン</small><strong>{previous.label}</strong></span></Link>}
      {next && <Link className="next" to={{ pathname: `/pokemon/${next.id}`, search }}><span><small>次のポケモン</small><strong>{next.label}</strong></span><Icon name="right" size={18} /></Link>}
    </nav>
    {!entry && index.isError && <p className="refresh-notice">前後のポケモンを確認できませんでした。<button type="button" disabled={index.isFetching} onClick={() => void index.refetch()}>再読み込み</button></p>}
  </div>;
}
