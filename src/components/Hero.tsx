import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dexNumber } from '../api/catalog';
import type { CatalogEntry } from '../api/catalog';
import { Icon } from './Icon';
import PokemonImage from './PokemonImage';
import PokemonNameLabel from './PokemonNameLabel';

export default function Hero({ entries, onOpen }: { entries: CatalogEntry[]; onOpen: () => void }) {
  const [{ index, cycle, manual }, setSelection] = useState({ index: 0, cycle: 0, manual: false });
  const { search } = useLocation();
  const pokemon = entries[index];
  const page = pokemon && { pathname: '/pokemon/' + pokemon.id, search };
  function select(index: number) {
    setSelection(current => ({ index, cycle: current.cycle + 1, manual: true }));
  }
  function switchBy(step: number, finishedCycle?: number) {
    setSelection(current => {
      // A manual selection can arrive while the previous bar's finish event is queued.
      if (finishedCycle !== undefined && finishedCycle !== current.cycle) return current;
      return {
        index: (current.index + step + entries.length) % entries.length,
        cycle: current.cycle + 1,
        manual: finishedCycle === undefined,
      };
    });
  }
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
              aria-label={entry.display.full + 'をピックアップに表示'} onClick={() => select(i)}>
              <PokemonImage id={entry.id} eager />
            </button>)}
            {entries.length > 1 && <span className="featured-progress" aria-hidden="true">
              <span key={cycle} onAnimationEnd={() => switchBy(1, cycle)} />
            </span>}
          </div>
        </div>
        <div className="showcase" aria-label="ピックアップポケモン">
          <div className="reticle" aria-hidden="true"><i /><b /><span /></div>
          {pokemon && page &&
            <Link className="showcase-art" onClick={onOpen} to={page} aria-label={pokemon.display.full + 'の詳細を見る'}>
              {entries.map((entry, i) => <span key={entry.id} className="showcase-slide" data-active={index === i} aria-hidden="true">
                <PokemonImage id={entry.id} featured eager />
              </span>)}
            </Link>}
        </div>
        {pokemon && page && <div className="showcase-controls">
          <button type="button" onClick={() => switchBy(-1)} aria-label="前のピックアップ"><Icon name="left" size={15} /></button>
          <Link className="showcase-label" onClick={onOpen} to={page} aria-live={manual ? 'polite' : 'off'}>
            {entries.map((entry, i) => <span key={entry.id} className="showcase-caption" aria-hidden={index !== i}>
              <span className="showcase-number">No. {dexNumber(entry.number)}</span>
              <PokemonNameLabel entry={entry} />
            </span>)}
          </Link>
          <button type="button" onClick={() => switchBy(1)} aria-label="次のピックアップ"><Icon name="right" size={15} /></button>
        </div>}
      </div>
    </section>
  );
}
