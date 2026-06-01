import React from 'react';

export function ScoreBadge({ score, machbar }) {
  const tone = score >= 70 ? 'gut' : score >= 40 ? 'mittel' : 'schwach';
  return (
    <span className={`score score-${tone}`} title={machbar ? 'Einsatz machbar' : 'Eingeschraenkt machbar'}>
      {score}
      {!machbar && <span className="score-warn">!</span>}
    </span>
  );
}

export function Chips({ items }) {
  if (!items || items.length === 0) return <span className="muted">–</span>;
  return (
    <span className="chips">
      {items.map((i) => (
        <span key={i} className="chip">{i}</span>
      ))}
    </span>
  );
}

export function CheckboxGroup({ options, value, onChange }) {
  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <div className="checkbox-group">
      {options.map((opt) => (
        <label key={opt} className={value.includes(opt) ? 'cb active' : 'cb'}>
          <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
