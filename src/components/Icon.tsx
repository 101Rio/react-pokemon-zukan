import type { CSSProperties } from 'react';

const paths = {
  search: 'M20.5 20.5l-5-5M17.5 10.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  grid: 'M3.5 3.5h6.8v6.8H3.5zM13.7 3.5h6.8v6.8h-6.8zM3.5 13.7h6.8v6.8H3.5zM13.7 13.7h6.8v6.8h-6.8z',
  filters: 'M3 6h5m5 0h8M3 12h11m5 0h2M3 18h3m5 0h10M13 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM11 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  close: 'm6 6 12 12M18 6 6 18',
  left: 'm14.5 5.5-6.5 6.5 6.5 6.5',
  right: 'm9.5 5.5 6.5 6.5-6.5 6.5',
  down: 'm6 9 6 6 6-6',
  check: 'm4 12 5 5L20 6',
  sort: 'M4 6h16M4 11h11M4 16h6',
  stack: 'm3 8 9-5 9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
  ball: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h6m6 0h6m-6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  plus: 'M12 5v14M5 12h14',
  scan: 'M3 9V4h5m8 0h5v5M3 15v5h5m8 0h5v-5M9 12h6m-3-3v6',
  book: 'M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4ZM4 17h15M8 8h7',
  bars: 'M4 20h16M6 16v-4m6 4V4m6 12V8',
};
export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}><path d={paths[name]} /></svg>;
}

export function BallMark() {
  return <img className="ball-mark" src={import.meta.env.BASE_URL + 'favicon.svg?v=2'} alt="" />;
}
