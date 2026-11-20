export const pokemonTypesMap = [
  { type: 'normal', jaType: 'ノーマル', color: '#787c81' },
  { type: 'fire', jaType: 'ほのお', color: '#d7552c' },
  { type: 'water', jaType: 'みず', color: '#3486bb' },
  { type: 'electric', jaType: 'でんき', color: '#c08e08' },
  { type: 'grass', jaType: 'くさ', color: '#42875b' },
  { type: 'ice', jaType: 'こおり', color: '#3f9ca9' },
  { type: 'fighting', jaType: 'かくとう', color: '#b34651' },
  { type: 'poison', jaType: 'どく', color: '#9463a5' },
  { type: 'ground', jaType: 'じめん', color: '#ae7448' },
  { type: 'flying', jaType: 'ひこう', color: '#748cba' },
  { type: 'psychic', jaType: 'エスパー', color: '#c75582' },
  { type: 'bug', jaType: 'むし', color: '#829430' },
  { type: 'rock', jaType: 'いわ', color: '#948349' },
  { type: 'ghost', jaType: 'ゴースト', color: '#75629a' },
  { type: 'dragon', jaType: 'ドラゴン', color: '#6465b4' },
  { type: 'dark', jaType: 'あく', color: '#716278' },
  { type: 'steel', jaType: 'はがね', color: '#628893' },
  { type: 'fairy', jaType: 'フェアリー', color: '#bd6699' },
];

export const typeInfo = (value: string) =>
  pokemonTypesMap.find(item => item.type === value || item.jaType === value)
  ?? { type: value, jaType: value, color: '#737e8c' };
