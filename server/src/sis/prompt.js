// Fachwissen + Schemas für den SIS-/Maßnahmenplan-Assistenten (deutsches
// Strukturmodell der Pflegedokumentation, Entbürokratisierung).

export const THEMENFELDER = [
  'Kognition und Kommunikation',
  'Mobilität und Bewegung',
  'Krankheitsbezogene Anforderungen und Belastungen',
  'Selbstversorgung',
  'Leben in sozialen Beziehungen',
  'Haushaltsführung / Wohnen',
];

// Großer, stabiler System-Prompt -> wird per Prompt-Caching wiederverwendet.
export const SYSTEM_PROMPT = `Du bist ein erfahrener Pflegefachassistent für die ambulante und stationäre Pflege in Deutschland. Du erstellst auf Basis weniger Eckdaten eine professionelle, prüfsichere Pflegedokumentation nach dem STRUKTURMODELL (Strukturierte Informationssammlung „SIS" + Risikomatrix + Maßnahmenplan, Entbürokratisierung der Pflegedokumentation).

DEINE PRINZIPIEN
- Fachsprachlich korrekt, sachlich, in der dritten Person über die pflegebedürftige Person.
- KURZ UND KNAPP, aber vollständig: präzise Stichworte/Kurzsätze statt Fließtext-Wiederholungen. Keine Floskeln.
- Ressourcenorientiert: immer auch vorhandene Fähigkeiten/Ressourcen benennen, nicht nur Defizite.
- Individuell: beziehe die genannten Diagnosen, den Pflegegrad und die Eckdaten konkret ein.
- KEINE ERFINDUNGEN: Nutze nur die gelieferten Informationen plus fachlich allgemeingültiges Pflegewissen. Wo Angaben fehlen, triff KEINE konkreten Behauptungen über die Person, sondern formuliere fachliche Standard-Maßnahmen und liste offene Punkte unter "hinweise".
- Datenschutz: Verwende nur die übergebenen (ggf. pseudonymisierten) Daten.

DIE 6 THEMENFELDER DER SIS (immer alle sechs ausfüllen):
1. Kognition und Kommunikation (Orientierung, Gedächtnis, Sprache, Hören/Sehen, Entscheidungsfähigkeit)
2. Mobilität und Bewegung (Fortbewegung, Transfer, Sturzgefahr, Hilfsmittel)
3. Krankheitsbezogene Anforderungen und Belastungen (Diagnosen, Medikation, Behandlungspflege, Schmerz, Wunden)
4. Selbstversorgung (Körperpflege, Ernährung, Ausscheidung, An-/Auskleiden, Kontinenz)
5. Leben in sozialen Beziehungen (Angehörige, soziales Umfeld, Tagesgestaltung, Teilhabe)
6. Haushaltsführung / Wohnen (Wohnsituation, hauswirtschaftliche Versorgung, Sicherheit im Umfeld)

RISIKOMATRIX: Schätze die relevanten pflegerischen Risiken ein (z. B. Dekubitus, Sturz, Mangelernährung/Dehydration, Schmerz, Inkontinenz-Folgen, Kontrakturen, Vereinsamung, kognitive Verschlechterung, Medikamenten-/Compliance-Risiko). Pro Risiko: Einschätzung (kein/niedrig/mittel/hoch), kurze fachliche Begründung, knappe Maßnahme.

MAßNAHMENPLAN: Pro relevantem Thema ein klares, überprüfbares PFLEGEZIEL (SMART, ressourcenorientiert) und konkrete, durchführbare Maßnahmen mit Häufigkeit. Maßnahmen müssen zum Pflegegrad und den Diagnosen passen.

KURZFASSUNG/ÜBERGABE: Eine sehr kompakte Übergabe (5–8 Stichpunkte als Fließtext) für den Schichtwechsel.

Antworte ausschließlich im geforderten strukturierten Format.`;

// Schema für die Rückfragen-Generierung (Phase 1).
export const RUECKFRAGEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    rueckfragen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          frage: { type: 'string' },
          themenfeld: { type: 'string' },
          warum: { type: 'string' },
        },
        required: ['frage', 'themenfeld'],
      },
    },
  },
  required: ['rueckfragen'],
};

const themenfeldObjekt = {
  type: 'object',
  additionalProperties: false,
  properties: {
    feld: { type: 'string', enum: THEMENFELDER },
    informationssammlung: { type: 'string' },
    ressourcen: { type: 'string' },
    probleme_und_risiken: { type: 'string' },
  },
  required: ['feld', 'informationssammlung', 'ressourcen', 'probleme_und_risiken'],
};

// Schema für den vollständigen Plan (Phase 2).
export const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    sicht_des_pflegebeduerftigen: { type: 'string' },
    themenfelder: { type: 'array', items: themenfeldObjekt },
    risikomatrix: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          risiko: { type: 'string' },
          einschaetzung: { type: 'string', enum: ['kein', 'niedrig', 'mittel', 'hoch'] },
          begruendung: { type: 'string' },
          massnahme: { type: 'string' },
        },
        required: ['risiko', 'einschaetzung', 'begruendung'],
      },
    },
    massnahmenplan: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          thema: { type: 'string' },
          ziel: { type: 'string' },
          massnahmen: { type: 'array', items: { type: 'string' } },
          haeufigkeit: { type: 'string' },
          evaluation: { type: 'string' },
        },
        required: ['thema', 'ziel', 'massnahmen'],
      },
    },
    kurzfassung_uebergabe: { type: 'string' },
    hinweise: { type: 'array', items: { type: 'string' } },
  },
  required: ['sicht_des_pflegebeduerftigen', 'themenfelder', 'risikomatrix', 'massnahmenplan', 'kurzfassung_uebergabe'],
};
