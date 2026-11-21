import references from './data/form-display.json';

type FormReference = { name?: string; form?: string; order?: number; qualifier?: string };
const forms: Record<string, FormReference> = references;

export function pokemonName(speciesName: string, slug: string, form = '', variant = false, englishForm = '') {
  const reference = forms[slug];
  const mega = /-mega(?:-([xyz]))?(?:$|-)/.exec(slug);
  const megaName = mega ? form || `メガ${speciesName}${mega[1]?.toUpperCase() ?? ''}` : '';
  const name = reference?.name ?? (megaName || speciesName);
  const fallback = slug.endsWith('-gmax') ? 'キョダイマックスのすがた' : '';
  const description = reference?.form ?? (mega ? '' : form || fallback || (variant ? englishForm || slug.replaceAll('-', ' ') : ''));
  return {
    name,
    sortName: name.replace(/^相棒/, 'アイボウ').replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60)),
    form: description,
    qualifier: reference?.qualifier,
    full: description ? `${name}（${description}）` : name,
    // Unlisted PokéAPI varieties follow the forms in the Japanese index.
    order: reference?.order ?? (variant ? Number.MAX_SAFE_INTEGER : 0),
  };
}
