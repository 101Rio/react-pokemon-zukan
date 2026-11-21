import { useState } from 'react';
import localIds from '../data/local-artwork.json';
import { Icon } from './Icon';

const largeArtwork = new Set([6, 94, 448]);
const local = new Set(localIds);
const spriteRoot = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const assets = import.meta.env.BASE_URL + 'artwork/';

type Props = { id: number; name?: string; image?: string | null; featured?: boolean; eager?: boolean; pixel?: boolean };

export default function PokemonImage({ id, name = '', image, featured, eager, pixel }: Props) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = pixel ? [image] : [
    featured && largeArtwork.has(id) ? `${assets}feature-${id}.webp` : null,
    local.has(id) ? `${assets}${id}.webp` : null,
    image,
    `${spriteRoot}/other/official-artwork/${id}.png`,
    `${spriteRoot}/${id}.png`,
  ];
  const source = candidates.find(src => src && !failed.includes(src));
  if (!source) return <span className="missing-image"><Icon name="ball" size={30} />画像なし</span>;
  return <img className={pixel ? 'pokemon-image sprite-image' : 'pokemon-image'} src={source} alt={name} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} onError={() => setFailed(previous => [...previous, source])} />;
}
