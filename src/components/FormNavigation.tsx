import { Link } from 'react-router-dom';
import type { CatalogEntry } from '../api/catalog';
import { Icon } from './Icon';
import PokemonImage from './PokemonImage';
import PokemonNameLabel from './PokemonNameLabel';

type Props = { forms: CatalogEntry[]; currentId: number; search: string };

export default function FormNavigation({ forms, currentId, search }: Props) {
  if (forms.length < 2) return null;

  function formLink(entry: CatalogEntry) {
    const { qualifier } = entry.display;
    const current = entry.id === currentId;
    return <Link className="form-card" to={{ pathname: `/pokemon/${entry.id}`, search }}
      state={{ focusEntry: true }} aria-current={current ? 'page' : undefined} replace={current}>
      <PokemonImage id={entry.id} />
      <span className="form-label"><PokemonNameLabel entry={entry} />
        {qualifier && <small className="form-qualifier">{qualifier}</small>}
        {current && <span className="form-current"><Icon name="check" size={12} />表示中</span>}
      </span>
    </Link>;
  }

  const [base, ...alternates] = forms;
  return <nav className="form-nav" aria-labelledby="form-nav-title">
    <h2 id="form-nav-title"><Icon name="stack" size={18} />同じポケモンの姿</h2>
    <div className="form-family">
      <div className="form-origin">{formLink(base)}</div>
      <ul className="form-branches">{alternates.map(entry => <li key={entry.id}>{formLink(entry)}</li>)}</ul>
    </div>
  </nav>;
}
