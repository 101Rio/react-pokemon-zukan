import { Fragment } from 'react';
import type { CatalogEntry } from '../api/catalog';

// Keep each form description together until the description itself exceeds the line.
const formSuffix = /(?=すがた|フォルム|けいたい|モード|キャップ|フェザー|スタイル|フェイス|サイズ|コア|めん|ミノ|かた|もよう)/u;

export default function PokemonNameLabel({ entry }: { entry: CatalogEntry }) {
  const { name, form } = entry.display;
  const speciesStart = name.lastIndexOf(entry.species.ja);
  return <span className="pokemon-caption-name">
    <strong>{speciesStart > 0
      ? <>{name.slice(0, speciesStart)}<wbr />{name.slice(speciesStart)}</>
      : name}</strong>
    {form && form.split('・').map((phrase, index, phrases) =>
      <Fragment key={index}><wbr /><small>
        {index === 0 && '（'}
        {phrase.split(formSuffix).map((part, i) =>
          <Fragment key={i}>{i > 0 && <wbr />}{part}</Fragment>
        )}
        {index === phrases.length - 1 ? '）' : '・'}
      </small></Fragment>
    )}
  </span>;
}
