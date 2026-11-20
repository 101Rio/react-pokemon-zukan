import { Icon } from './Icon';

export default function Footer() {
  return <footer className="site-footer"><div className="shell footer-inner"><span><Icon name="ball" size={18} />ポケモン図鑑</span><a href="https://pokeapi.co/" target="_blank" rel="noreferrer" lang="en">Data by PokéAPI</a></div></footer>;
}
