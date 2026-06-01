// Zuweiser-Kategorien für die Patienten-Akquise in der ambulanten Pflege.
// Jede Kategorie hat: Anzeigename, OSM-Filter (für den Live-Bot), ein
// Potenzial-Gewicht (wie wertvoll als Zuweiser) und einen Gesprächsaufhänger.

export const KATEGORIEN = {
  krankenhaus: {
    label: 'Krankenhaus / Entlassmanagement',
    osm: [{ k: 'amenity', v: 'hospital' }],
    gewicht: 100,
    tipp: 'Sozialdienst / Entlassmanagement ansprechen – hier entstehen die meisten Überleitungen.',
  },
  seniorenheim: {
    label: 'Senioren-/Pflegeheim & Betreutes Wohnen',
    osm: [
      { k: 'amenity', v: 'nursing_home' },
      { k: 'social_facility', v: 'nursing_home' },
      { k: 'social_facility', v: 'assisted_living' },
    ],
    gewicht: 85,
    tipp: 'Kurzzeitpflege-Überlauf und ambulante Versorgung im betreuten Wohnen abklären.',
  },
  hausarzt: {
    label: 'Hausarztpraxis',
    osm: [{ k: 'amenity', v: 'doctors' }, { k: 'healthcare', v: 'doctor' }],
    gewicht: 80,
    tipp: 'Hausärzte verordnen Behandlungspflege (SGB V) – Flyer + Erreichbarkeit hinterlassen.',
  },
  sanitaetshaus: {
    label: 'Sanitätshaus',
    osm: [{ k: 'shop', v: 'medical_supply' }],
    gewicht: 70,
    tipp: 'Kooperation: Sanitätshäuser kennen frisch versorgte Pflegebedürftige.',
  },
  apotheke: {
    label: 'Apotheke',
    osm: [{ k: 'amenity', v: 'pharmacy' }],
    gewicht: 60,
    tipp: 'Apotheken haben direkten Draht zu Pflegebedürftigen und Angehörigen.',
  },
  physiotherapie: {
    label: 'Physiotherapie',
    osm: [{ k: 'healthcare', v: 'physiotherapist' }, { k: 'shop', v: 'physiotherapist' }],
    gewicht: 55,
    tipp: 'Gemeinsame Patienten – Empfehlungen in beide Richtungen.',
  },
  pflegestuetzpunkt: {
    label: 'Pflegestützpunkt / Beratung',
    osm: [{ k: 'social_facility', v: 'outreach' }],
    gewicht: 75,
    tipp: 'Neutrale Beratungsstellen empfehlen freie Pflegedienste mit Kapazität.',
  },
};

export const KATEGORIE_LISTE = Object.entries(KATEGORIEN).map(([key, v]) => ({
  key,
  label: v.label,
  gewicht: v.gewicht,
}));
