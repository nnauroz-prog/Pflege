export const QUALIFIKATIONEN = [
  { value: 'pflegehelfer', label: 'Pflegehelfer:in' },
  { value: 'pflegefachkraft', label: 'Pflegefachkraft (examiniert)' },
  { value: 'spezialisiert', label: 'Spezialisierte Pflege' },
];

export const LEISTUNGEN = [
  'grundpflege',
  'demenz',
  'palliativ',
  'wundmanagement',
  'intensivpflege',
  'beatmung',
  'medikamentengabe',
  'mobilisation',
];

export const DRINGLICHKEIT = [
  { value: 'niedrig', label: 'Niedrig' },
  { value: 'normal', label: 'Normal' },
  { value: 'hoch', label: 'Hoch' },
];

export const qualiLabel = (v) => QUALIFIKATIONEN.find((q) => q.value === v)?.label || v;
