import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dexNumber } from '../api/catalog';
import type { CatalogEntry } from '../api/catalog';
import { Icon } from './Icon';
import PokemonImage from './PokemonImage';

export default function Hero({ entries, onOpen }: { entries: CatalogEntry[]; onOpen: () => void }) {
  const [index, setIndex] = useState(0);
  const { search } = useLocation();
  const pokemon = entries[index];
  const page = pokemon && { pathname: '/pokemon/' + pokemon.id, search };
  const switchBy = (step: number) => setIndex(current => (current + step + entries.length) % entries.length);
  return (
    <section className="hero" data-type={pokemon?.types[0]} aria-labelledby="dex-title">
      <div className="hero-plane" aria-hidden="true" />
      <div className="shell hero-inner">
        <div className="hero-copy">
          <div className="hero-kicker" lang="en"><span className="signal-bars" aria-hidden="true"><i /><i /><i /></span>POKÉDEX</div>
          <h1 id="dex-title">ポケモン図鑑</h1>
          <p>名前やタイプから、気になるポケモンを探そう。</p>
          <div className="featured-picks" role="group" aria-label="ピックアップポケモンを選ぶ">
            {entries.map((entry, i) => <button key={entry.id} type="button" aria-pressed={index === i} title={entry.display.full}
              aria-label={entry.display.full + 'をピックアップに表示'} onClick={() => setIndex(i)}>
              <PokemonImage id={entry.id} eager />
            </button>)}
          </div>
        </div>
        <div className="showcase" aria-label="ピックアップポケモン">
          <div className="reticle" aria-hidden="true"><i /><b /><span /></div>
          {pokemon && page && <>
            <Link className="showcase-art" onClick={onOpen} to={page} aria-label={pokemon.display.full + 'の詳細を見る'}>
              <PokemonImage key={pokemon.id} id={pokemon.id} featured eager />
            </Link>
            <div className="showcase-controls">
              <button type="button" onClick={() => switchBy(-1)} aria-label="前のピックアップ"><Icon name="left" size={15} /></button>
              <Link className="showcase-label" onClick={onOpen} to={page} aria-live="polite">
                <span>No. {dexNumber(pokemon.number)}</span><strong>{pokemon.display.name}{pokemon.display.form && <small>（{pokemon.display.form}）</small>}</strong>
              </Link>
              <button type="button" onClick={() => switchBy(1)} aria-label="次のピックアップ"><Icon name="right" size={15} /></button>
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}
