import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { dexNumber, englishLabel } from '../api/catalog';
import type { CatalogEntry } from '../api/catalog';
import { typeInfo } from '../pokemonTypesMap';
import PokemonTypeLabel from './PokemonTypeLabel';
import PokemonImage from './PokemonImage';
import { Icon } from './Icon';

interface Props { pokemon: CatalogEntry; search: string; onOpen: () => void; eager?: boolean; showStats?: boolean }

export default function PokemonCard({ pokemon, search, onOpen, eager, showStats }: Props) {
  const { name, form } = pokemon.display;
  return (
    <Link className="pokemon-card" to={{ pathname: `/pokemon/${pokemon.id}`, search }} onClick={onOpen} style={{ '--type': typeInfo(pokemon.types[0]).color } as CSSProperties}>
      <div className="card-stage">
        <span className="card-number"><span>No.</span> {dexNumber(pokemon.number)}</span>
        <span className="card-scan" aria-hidden="true"><Icon name="scan" size={15} /></span>
        <i className="stage-ball" aria-hidden="true" />
        <PokemonImage id={pokemon.id} eager={eager} />
      </div>
      <div className="card-info">
        <div className="card-title"><h3>{name}{form && <small className="name-form">（{form}）</small>}</h3><span lang="en">{englishLabel(pokemon)}</span></div>
        {showStats && <div className="card-stats">合計種族値 <b>{pokemon.stats.reduce((sum, stat) => sum + stat, 0)}</b></div>}
        <div className="types">{pokemon.types.map(type => <PokemonTypeLabel key={type} type={type} />)}</div>
      </div>
    </Link>
  );
}
