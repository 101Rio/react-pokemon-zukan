import { Link, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PokemonList from './pages/PokemonList';
import PokemonDetail from './pages/PokemonDetail';
import './App.css';

export default function App() {
  return <div className="app">
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>本文へ移動</a>
    <Header />
    <main id="main-content" tabIndex={-1}>
      <Routes><Route path="/" element={<PokemonList />} /><Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="*" element={<div className="shell"><div className="state-box"><h1>ページが見つかりません</h1><Link className="btn secondary" to="/">図鑑一覧に戻る</Link></div></div>} />
      </Routes>
    </main><Footer />
  </div>;
}
