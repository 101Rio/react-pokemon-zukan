import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { kanaRows } from '../abilityOptions';
import type { AbilityOption } from '../abilityOptions';
import { normalizeName } from '../search';
import { Icon } from './Icon';

type Props = {
  options: AbilityOption[];
  value: string;
  exact: boolean;
  onChange: (value: string, exact: boolean) => void;
};

export default function AbilityPicker({ options, value, exact, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState('');
  const [cursor, setCursor] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const needle = exact ? '' : normalizeName(value);
  const choices = useMemo(() => options.filter(option =>
    (!row || option.row === row) && (!needle || option.keys.some(key => key.includes(needle)))
  ), [options, row, needle]);
  const rows = useMemo(() => {
    const available = new Set(options.map(option => option.row));
    return [...kanaRows, 'その他'].filter(key => available.has(key));
  }, [options]);
  const active = open && cursor >= 0 && cursor < choices.length ? cursor : -1;

  useEffect(() => {
    if (active >= 0) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function toggle(next: boolean) {
    setOpen(next);
    setCursor(-1);
    if (!next) setRow('');
  }
  function select(name: string) {
    input.current?.focus({ preventScroll: true });
    onChange(name, true);
    toggle(false);
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const last = choices.length - 1;
      setCursor(event.key === 'ArrowDown' ? Math.min(active + 1, last) : active < 0 ? last : Math.max(0, active - 1));
    } else if (event.key === 'Enter' && open && choices.length) {
      event.preventDefault();
      select(choices[active < 0 ? 0 : active].name);
    }
  }

  return <div className="ability-picker" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) toggle(false);
  }} onKeyDown={event => {
    if (open && event.key === 'Escape' && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault();
      event.stopPropagation();
      input.current?.focus({ preventScroll: true });
      toggle(false);
    }
  }}>
    <label className="field" htmlFor={id}>特性名</label>
    <div className="ability-input">
      <Icon name="search" size={17} />
      <input ref={input} id={id} type="text" role="combobox" autoComplete="off" aria-autocomplete="list"
        aria-expanded={open} aria-controls={open ? id + '-list' : undefined} aria-activedescendant={active >= 0 ? id + '-' + active : undefined}
        placeholder="例：いかく、ふゆう" value={value} onKeyDown={keyDown}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={event => {
          onChange(event.target.value, false);
          setRow('');
          setCursor(-1);
          setOpen(true);
        }} />
      {value && <button type="button" aria-label="特性名を消去" onClick={() => {
        onChange('', false); setRow(''); setCursor(-1); input.current?.focus(); setOpen(true);
      }}><Icon name="close" size={15} /></button>}
      <button type="button" aria-label={open ? '特性候補を閉じる' : '特性候補を開く'} aria-expanded={open}
        onMouseDown={event => event.preventDefault()} onClick={() => {
          if (!open) input.current?.focus({ preventScroll: true });
          toggle(!open);
        }}><Icon name="down" size={17} /></button>
    </div>
    {open && <div className="ability-menu">
      <div className="ability-rows" role="group" aria-label="特性の五十音索引">
        {['', ...rows].map(key => <button key={key} type="button" aria-pressed={row === key}
          aria-label={key ? key + (key === 'その他' ? '' : '行の特性') : 'すべての特性'}
          onClick={() => {
            if (!exact && value) onChange('', false);
            setRow(key); setCursor(-1); input.current?.focus({ preventScroll: true });
            list.current?.scrollTo({ top: 0 });
          }}>{key || 'すべて'}</button>)}
      </div>
      <div className="ability-options" role="listbox" aria-label="特性候補" ref={list} id={id + '-list'}>
        {choices.map((option, i) => <div role="option" key={option.name} id={id + '-' + i}
          aria-selected={exact && option.name === value} data-active={i === active || undefined}
          onMouseDown={event => event.preventDefault()} onClick={() => select(option.name)}>
          <span>{option.name}</span><small>{option.count.toLocaleString('ja-JP')}件</small>
        </div>)}
      </div>
      {!choices.length && <p role="status" className="ability-empty">条件に合う特性がありません。</p>}
    </div>}
  </div>;
}
