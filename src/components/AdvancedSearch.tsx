import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Catalog } from '../api/catalog';
import { canonicalMeasure, emptyFilters, filterCatalog, measureInput, measureKeys, measures, rangeError, unknownWeight } from '../search';
import type { Filters, Measure } from '../search';
import { pokemonTypesMap } from '../pokemonTypesMap';
import TypeIcon from './TypeIcon';
import AbilityPicker from './AbilityPicker';
import { abilityOptions } from '../abilityOptions';
import { Icon } from './Icon';

type Props = {
  catalog: Catalog;
  query: string;
  current: Filters;
  focusMeasure?: Measure;
  onClose: () => void;
  onApply: (filters: Filters, query: string) => void;
};

export default function AdvancedSearch({ catalog, query, current, focusMeasure, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<Filters>(current);
  const dialog = useRef<HTMLDialogElement>(null);
  const initialField = useRef<HTMLInputElement>(null);
  const draftQuery = current.speciesId && !draft.speciesId ? '' : query;
  const numberError = rangeError(draft, catalog.lastNumber);
  const invalidMeasure = measureKeys.find(key => draft[key] && !canonicalMeasure(key, draft[key]));
  const invalid = Boolean(numberError || invalidMeasure);
  const count = useMemo(() => invalid ? 0 : filterCatalog(catalog, draftQuery, draft).length, [catalog, draftQuery, draft, invalid]);
  const { types, generation, form, from, to, speciesId, height, weight } = draft;
  const abilities = useMemo(() => {
    const eligible = filterCatalog(catalog, draftQuery, { ...emptyFilters, types, generation, form, from, to, speciesId, height, weight });
    return abilityOptions(eligible, catalog.abilities);
  }, [catalog, draftQuery, types, generation, form, from, to, speciesId, height, weight]);
  const measureOptions = useMemo(() => {
    const options = (values: (number | null)[]) => [...new Set(values.filter(v => v !== null))].sort((a, b) => a - b).map(measureInput);
    return {
      height: options(catalog.entries.map(entry => entry.heightDm)),
      weight: [...options(catalog.entries.map(entry => entry.weightHg)), unknownWeight],
    };
  }, [catalog]);

  useLayoutEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    const root = document.documentElement;
    const { overflow, paddingInlineEnd } = root.style;
    const gutter = window.innerWidth - root.clientWidth;
    if (gutter > 0 && !CSS.supports('scrollbar-gutter: stable')) root.style.paddingInlineEnd = `${gutter}px`;
    root.style.overflow = 'hidden';
    node?.showModal();
    const field = initialField.current;
    if (field && window.matchMedia('(pointer: coarse)').matches) {
      // Expose the preset without opening the software keyboard over the results button.
      field.scrollIntoView({ block: 'center' });
    } else {
      field?.focus();
    }
    return () => {
      node?.close();
      root.style.overflow = overflow;
      root.style.paddingInlineEnd = paddingInlineEnd;
      const target = previous instanceof HTMLElement && previous !== document.body && previous.isConnected && !node?.contains(previous)
        ? previous : document.querySelector<HTMLButtonElement>('.advanced-trigger');
      target?.focus({ preventScroll: true });
    };
  }, []);

  function change<K extends keyof Filters>(field: K, value: Filters[K]) {
    setDraft(previous => ({ ...previous, [field]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!invalid) onApply({
      ...draft, height: canonicalMeasure('height', draft.height), weight: canonicalMeasure('weight', draft.weight),
      from: draft.from ? String(Number(draft.from)) : '', to: draft.to ? String(Number(draft.to)) : '',
    }, draftQuery);
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
          <div>
            <div className="field-pair">{measureKeys.map(key => <label className="field" key={key}>
              {measures[key].label}（{measures[key].unit}）
              <input ref={focusMeasure === key ? initialField : undefined} inputMode="decimal" list={`values-${key}`} autoComplete="off"
                placeholder="指定なし" value={draft[key]} aria-invalid={invalidMeasure === key}
                aria-describedby={invalidMeasure === key ? 'measure-error' : 'measure-hint'}
                onChange={e => change(key, e.target.value.normalize('NFKC'))} />
              <datalist id={`values-${key}`}>{measureOptions[key].map(value => <option key={value} value={value} />)}</datalist>
            </label>)}</div>
            <p id="measure-hint" className="field-hint measure-hint">図鑑の値で完全一致検索します。「以上」とある高さは下限値を使います。</p>
            {invalidMeasure && <p id="measure-error" className="field-error" role="alert">{measures[invalidMeasure].label}は0.1単位の正の数{invalidMeasure === 'weight' ? 'か「不明」' : ''}を入力してください。</p>}
          </div>
          <AbilityPicker value={draft.ability} exact={draft.abilityExact} options={abilities}
            onChange={(ability, abilityExact) => setDraft(previous => ({ ...previous, ability, abilityExact }))} />
          <fieldset><legend>全国図鑑番号</legend><div className="number-fields">
            <input aria-label="開始番号" inputMode="numeric" placeholder="1" aria-invalid={Boolean(numberError)} value={draft.from} onChange={e => change('from', e.target.value.normalize('NFKC'))} />
            <span aria-hidden="true">〜</span>
            <input aria-label="終了番号" inputMode="numeric" placeholder={String(catalog.lastNumber)} aria-invalid={Boolean(numberError)} value={draft.to} onChange={e => change('to', e.target.value.normalize('NFKC'))} />
          </div>{numberError && <p className="field-error" role="alert">{numberError}</p>}</fieldset>
        </div>
        <div className="drawer-footer">
          <button className="btn secondary" type="button" onClick={() => setDraft(emptyFilters)}>条件をリセット</button>
          <button className="btn primary" type="submit" disabled={invalid}><Icon name="search" size={17} /><span aria-live="polite">{count.toLocaleString('ja-JP')}件を表示</span></button>
        </div>
      </form>
    </dialog>
  );
}
