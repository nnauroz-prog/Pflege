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

export const LEAD_STATUS = [
  { value: 'neu', label: 'Neu' },
  { value: 'kontaktiert', label: 'Kontaktiert' },
  { value: 'termin', label: 'Termin' },
  { value: 'gewonnen', label: 'Gewonnen' },
  { value: 'kein_interesse', label: 'Kein Interesse' },
];

export const KATEGORIE_ICON = {
  krankenhaus: '🏥',
  seniorenheim: '🏡',
  hausarzt: '🩺',
  sanitaetshaus: '🦽',
  apotheke: '💊',
  physiotherapie: '🤸',
  pflegestuetzpunkt: 'ℹ️',
};
