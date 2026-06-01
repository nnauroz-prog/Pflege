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

// Zuweiser-Kategorien (Spiegel von server/src/akquise/categories.js) –
// lokal vorhanden, damit das Suchformular auch ohne Backend nutzbar ist.
export const KATEGORIEN_AKQUISE = [
  { key: 'krankenhaus', label: 'Krankenhaus / Entlassmanagement', tipp: 'Sozialdienst / Entlassmanagement ansprechen – hier entstehen die meisten Überleitungen.' },
  { key: 'seniorenheim', label: 'Senioren-/Pflegeheim & Betreutes Wohnen', tipp: 'Kurzzeitpflege-Überlauf und ambulante Versorgung abklären.' },
  { key: 'hausarzt', label: 'Hausarztpraxis', tipp: 'Hausärzte verordnen Behandlungspflege – Flyer + Erreichbarkeit hinterlassen.' },
  { key: 'sanitaetshaus', label: 'Sanitätshaus', tipp: 'Sanitätshäuser kennen frisch versorgte Pflegebedürftige.' },
  { key: 'apotheke', label: 'Apotheke', tipp: 'Direkter Draht zu Pflegebedürftigen und Angehörigen.' },
  { key: 'physiotherapie', label: 'Physiotherapie', tipp: 'Gemeinsame Patienten – Empfehlungen in beide Richtungen.' },
  { key: 'pflegestuetzpunkt', label: 'Pflegestützpunkt / Beratung', tipp: 'Neutrale Stellen empfehlen Pflegedienste mit freier Kapazität.' },
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
