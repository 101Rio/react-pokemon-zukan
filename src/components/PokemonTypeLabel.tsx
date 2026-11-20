import type { CSSProperties } from 'react';
import { typeInfo } from '../pokemonTypesMap';
import TypeIcon from './TypeIcon';

export default function PokemonTypeLabel({ type }: { type: string }) {
  const info = typeInfo(type);
  return <span className="type-label" style={{ '--type': info.color } as CSSProperties}><TypeIcon type={info.type} />{info.jaType}</span>;
}
