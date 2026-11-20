const shapes: Record<string, string> = {
  normal: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  fire: 'M13 2c1 4-2 5 0 8 1 1 3-1 3-3 4 3 6 7 3 11a8 8 0 0 1-14-2c-1-4 2-7 4-9-1 3 0 4 1 4 2-2 0-5 3-9Zm0 12c-1 2-4 3-3 5 1 2 4 1 5-1 0-2-1-3-2-4Z',
  water: 'M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-9-8-13Zm-4 13c0 2 1 4 4 4',
  electric: 'm14.5 2-11 12h7l-1 8L21 9h-8z',
  grass: 'M20 3C9 4 3 8 4.5 15c1 5 8 6 12 1 3-4 2-9 3.5-13ZM3 21l12-13m-7 8 .2-5m3 2 4-.5',
  ice: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2M3.5 10 7 9l-.5-3M17.5 18l-.5-3 3.5-1M3.5 14 7 15l-.5 3M17.5 6 17 9l3.5 1',
  fighting: 'M4 12V9a1.8 1.8 0 0 1 3.6 0V6a1.8 1.8 0 0 1 3.6 0V4.5a1.8 1.8 0 0 1 3.6 0V6a1.8 1.8 0 0 1 3.6 0v5l1.2-1a1.5 1.5 0 0 1 2 2l-5.6 8H8l-4-5z',
  poison: 'M4 11c0-4 3.5-7 8-7s8 3 8 7c0 3-2 5-4 6v3H8v-3c-2-1-4-3-4-6Zm4.5.5h1m5 0h1M11 17v3m3-3v3',
  ground: 'm2 19 7-12 5 8 3-6 5 10z',
  flying: 'M3 18c2-7 7-12 18-13-2 3-4 5-8 6l5-.5c-2 3-5 4-9 4l5 .5c-3 3-6 4-11 3Z',
  psychic: 'M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  bug: 'M7 10h10v6a5 5 0 0 1-10 0v-6Zm1 0V8a4 4 0 0 1 8 0v2M9 5 7 2m8 3 2-3M3 10l4 2m10 0 4-2M3 16h4m10 0h4M5 21l3-3m8 0 3 3M12 11v8',
  rock: 'm3 17 3-9 7-5 6 4 3 10-5 4H7zM6 8l6 3 7-4m-7 4-1 8',
  ghost: 'M4 12a8 8 0 0 1 16 0v8l-4-2-4 3-4-3-4 2v-8Zm4.5-.5h1m5 0h1',
  dragon: 'm4 19 5-4-3-1 5-4-3-1 5-2 3-5 2 6 3 3-2 2-4-1-3 3 5 4z',
  dark: 'M18 4a9 9 0 1 1-14 9c1 3 4 5 7 4 6-1 8-7 7-13Z',
  steel: 'm7 3 10 0 5 9-5 9H7l-5-9zM15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
  fairy: 'm12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4zM19 15v5m-2.5-2.5h5',
};

export default function TypeIcon({ type, size = 15 }: { type: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={shapes[type] ?? shapes.normal} /></svg>;
}
