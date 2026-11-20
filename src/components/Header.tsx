import { Link, useLocation } from 'react-router-dom';
import { BallMark, Icon } from './Icon';

export default function Header() {
  const { pathname, search } = useLocation();
  const listPage = pathname === '/';
  const scrollHome = () => { if (listPage) window.scrollTo({ top: 0, behavior: 'instant' }); };
  const params = new URLSearchParams(search);
  params.set('advanced', '1');
  return (
    <header className="site-header">
      <div className="shell head-inner">
        <Link to="/" onClick={scrollHome} className="brand" aria-label="ポケモン図鑑 トップ"><BallMark /><span lang="en">POKÉDEX</span></Link>
        <nav className="main-nav" aria-label="メインナビゲーション">
          <Link to="/" onClick={scrollHome} aria-current={listPage ? 'page' : undefined}><Icon name="grid" size={17} />図鑑一覧</Link>
          <Link to={{ pathname: '/', search: params.toString() }} replace={listPage}><Icon name="filters" size={18} />詳細検索</Link>
        </nav>
      </div>
    </header>
  );
}
