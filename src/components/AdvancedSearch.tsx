import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Catalog } from '../api/catalog';
import { emptyFilters, filterCatalog, rangeError } from '../search';
import type { Filters } from '../search';
import { pokemonTypesMap } from '../pokemonTypesMap';
import TypeIcon from './TypeIcon';
import AbilityPicker from './AbilityPicker';
import { abilityOptions } from '../abilityOptions';
import { Icon } from './Icon';

type Props = {
  catalog: Catalog;
  query: string;
  current: Filters;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export default function AdvancedSearch({ catalog, query, current, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<Filters>(current);
  const dialog = useRef<HTMLDialogElement>(null);
  const error = rangeError(draft, catalog.lastNumber);
  const count = useMemo(() => error ? 0 : filterCatalog(catalog, query, draft).length, [catalog, query, draft, error]);
  const { types, generation, form, from, to } = draft;
  const abilities = useMemo(() => {
    const eligible = filterCatalog(catalog, query, { ...emptyFilters, types, generation, form, from, to });
    return abilityOptions(eligible, catalog.abilities);
  }, [catalog, query, types, generation, form, from, to]);

  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);

  function change<K extends keyof Filters>(field: K, value: Filters[K]) {
    setDraft(previous => ({ ...previous, [field]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!error) onApply({ ...draft, from: draft.from ? String(Number(draft.from)) : '', to: draft.to ? String(Number(draft.to)) : '' });
  }

  return (
    <dialog className="filter-dialog" ref={dialog} aria-labelledby="advanced-title" onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="drawer-body" onSubmit={submit}>
        <div className="drawer-header">
          <div><span className="small-kicker" lang="en">ADVANCED SEARCH</span><h2 id="advanced-title"><Icon name="filters" size={23} />詳細検索</h2></div>
          <button className="icon-button" type="button" aria-label="詳細検索を閉じる" onClick={onClose} autoFocus><Icon name="close" /></button>
        </div>
        <div className="drawer-scroll">
          <fieldset><legend>タイプ</legend><p className="field-hint">2つまで選べます。2つ選ぶと、両方のタイプを持つポケモンを表示します。</p>
            <div className="type-options">
              {pokemonTypesMap.map(type => {
                const selected = draft.types.includes(type.type);
                return <button key={type.type} className="type-option" type="button" aria-pressed={selected} disabled={!selected && draft.types.length === 2}
                  style={{ '--type': type.color } as CSSProperties}
                  onClick={() => change('types', selected ? draft.types.filter(key => key !== type.type) : [...draft.types, type.type])}>
                  <TypeIcon type={type.type} size={16} />{type.jaType}{selected && <Icon name="check" size={13} />}
                </button>;
              })}
            </div>
          </fieldset>
          <div className="field-pair">
            <label className="field">初登場世代<span className="select-wrap"><select value={draft.generation} onChange={e => change('generation', e.target.value)}>
              <option value="">すべての世代</option>{catalog.generations.map(gen => <option key={gen} value={gen}>第{gen}世代</option>)}
            </select><Icon name="down" size={15} /></span></label>
            <label className="field">姿・フォルム<span className="select-wrap"><select value={draft.form} onChange={e => change('form', e.target.value)}>
              <option value="">すべての姿</option><option value="base">標準の姿のみ</option><option value="variant">別の姿のみ</option>
            </select><Icon name="down" size={15} /></span></label>
          </div>
          <p className="field-hint gen-hint">世代は、種族が初めて登場した世代を指します。</p>
          <AbilityPicker value={draft.ability} exact={draft.abilityExact} options={abilities}
            onChange={(ability, abilityExact) => setDraft(previous => ({ ...previous, ability, abilityExact }))} />
          <fieldset><legend>全国図鑑番号</legend><div className="number-fields">
            <input aria-label="開始番号" inputMode="numeric" placeholder="1" aria-invalid={Boolean(error)} value={draft.from} onChange={e => change('from', e.target.value.normalize('NFKC'))} />
            <span aria-hidden="true">〜</span>
            <input aria-label="終了番号" inputMode="numeric" placeholder={String(catalog.lastNumber)} aria-invalid={Boolean(error)} value={draft.to} onChange={e => change('to', e.target.value.normalize('NFKC'))} />
          </div>{error && <p className="field-error" role="alert">{error}</p>}</fieldset>
        </div>
        <div className="drawer-footer">
          <button className="btn secondary" type="button" onClick={() => setDraft(emptyFilters)}>条件をリセット</button>
          <button className="btn primary" type="submit" disabled={Boolean(error)}><Icon name="search" size={17} /><span aria-live="polite">{count.toLocaleString('ja-JP')}件を表示</span></button>
        </div>
      </form>
    </dialog>
  );
}
