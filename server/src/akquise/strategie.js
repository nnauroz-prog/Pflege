// Virtuelles Akquise-Team: mehrere spezialisierte "Agenten", die jeweils einen
// Kanal zur Patientengewinnung in der ambulanten Pflege abdecken. Jeder Agent
// liefert konkrete Handlungsanweisungen: Erfolgswahrscheinlichkeit, Aufwand,
// wen man wie kontaktiert (persönlich/E-Mail/Telefon/online), Schritt-für-Schritt,
// fertige Vorlagen, typische Fehler und Nachfass-Rhythmus.

// erfolg: 0..100 (grobe Wahrscheinlichkeit, regelmäßig Patienten zu bekommen,
//         wenn man den Kanal SAUBER und DAUERHAFT bearbeitet)
// aufwand: 1 niedrig .. 3 hoch ; patienten: erwartete neue Patienten/Monat (eingeschwungen)

export const AGENTEN = [
  {
    key: 'klinik',
    kategorie: 'krankenhaus',
    name: 'Agent Klinik-Sozialdienst',
    kanal: 'Krankenhaus – Sozialdienst / Entlass- & Pflegeüberleitung',
    erfolg: 80,
    aufwand: 2,
    zeit_wochen: '4–12',
    patienten: '2–6',
    kontaktweg: 'persönlich',
    ansprechpartner: 'Leitung Sozialdienst / Case-Management / Pflegeüberleitung (NICHT die Pforte)',
    warum:
      'Hier entstehen die meisten ambulanten Versorgungen: Patienten müssen nach Entlassung weiterversorgt werden. Wer zuverlässig und schnell freie Kapazität meldet, wird angerufen.',
    schritte: [
      'Sozialdienst telefonisch erfragen und um einen kurzen persönlichen Termin (10 Min) mit der Leitung bitten.',
      'Eine einseitige „Kapazitätsmeldung“ mitbringen: welche Leistungen, welches Gebiet, wie viele freie Plätze, Erreichbarkeit (auch Wochenende!).',
      'Konkret sagen, was dich verlässlich macht: feste Ansprechperson, Rückruf in < 2 h, Aufnahme oft noch am selben/nächsten Tag.',
      'JEDE Woche per kurzer E-Mail die aktuelle freie Kapazität melden (3 Zeilen) – so bleibst du oben auf der Liste.',
      'Nach jeder Übernahme dem Sozialdienst kurz Rückmeldung geben („Patient X gut angekommen, danke“).',
    ],
    vorlage_typ: 'E-Mail an den Sozialdienst (Erstkontakt / wöchentliche Meldung)',
    vorlage:
      'Betreff: Freie Pflegekapazität in {Ort} – {Leistungen}\n\nSehr geehrtes Team des Sozialdienstes,\n\nwir sind ein ambulanter Pflegedienst in {Ort} mit aktuell FREIER KAPAZITÄT für: {Leistungen}.\nWir können Übernahmen i.d.R. innerhalb von 24–48 h sicherstellen, auch am Wochenende erreichbar unter {Telefon}.\n\nDarf ich kurz (10 Min) persönlich vorbeikommen und mich vorstellen? Ich melde mich ab sofort wöchentlich mit unserer freien Kapazität.\n\nBeste Grüße\n{Name}, {Pflegedienst}\n{Telefon} · {Email}',
    fehler:
      'Nur einmal anrufen und dann nie wieder melden. Den Sozialdienst nicht namentlich kennen. Keine Wochenend-Erreichbarkeit anbieten. Zu langsam zurückrufen – dann geht der Fall an den nächsten Dienst.',
    rhythmus: 'Wöchentliche Kapazitätsmeldung + Quartalsbesuch persönlich',
  },
  {
    key: 'arzt',
    kategorie: 'hausarzt',
    name: 'Agent Arztpraxen',
    kanal: 'Haus- & Facharztpraxen',
    erfolg: 65,
    aufwand: 2,
    zeit_wochen: '2–8',
    patienten: '1–3',
    kontaktweg: 'persönlich (kurz) + Material dalassen',
    ansprechpartner: 'Praxismanager:in / MFA an der Anmeldung, dann Arzt/Ärztin',
    warum:
      'Ärzte verordnen Behandlungspflege (SGB V: Injektionen, Wundversorgung, Medikamentengabe) und werden von Angehörigen nach einem guten Pflegedienst gefragt.',
    schritte: [
      'In der Sprechzeit-Randzeit kurz vorbeigehen, nach der/dem Praxismanager:in fragen.',
      'Kompakte Mappe dalassen: Leistungen, Gebiet, Erreichbarkeit, „wir übernehmen Behandlungspflege zuverlässig“.',
      'Faxnummer/sichere E-Mail für Verordnungen anbieten und Rückmeldung zur ausgeführten Pflege zusichern.',
      'Nach 2–3 Wochen einmal nachfassen (Telefon).',
    ],
    vorlage_typ: 'Kurzvorstellung / Mappe für die Praxis',
    vorlage:
      '{Pflegedienst} – ambulante Pflege in {Ort}\nWir übernehmen zuverlässig Behandlungspflege (Wundversorgung, Injektionen, Medikamentengabe) und Grundpflege.\nLeistungen: {Leistungen}\nErreichbarkeit: {Telefon} (Rückruf < 2 h) · Verordnungen an: {Email}\nWir geben Ihnen Rückmeldung zur Versorgung Ihrer Patient:innen.',
    fehler:
      'Zur Hauptsprechzeit reingehen (keine Zeit). Nur beim Arzt versuchen statt beim Praxisteam. Kein konkretes Versprechen zur Zuverlässigkeit.',
    rhythmus: 'Alle 4–6 Wochen kurzer Kontakt, frisches Material',
  },
  {
    key: 'stuetzpunkt',
    kategorie: 'pflegestuetzpunkt',
    name: 'Agent Pflegeberatung',
    kanal: 'Pflegestützpunkte & Pflegeberatung (§7a SGB XI)',
    erfolg: 60,
    aufwand: 1,
    zeit_wochen: '2–6',
    patienten: '1–2',
    kontaktweg: 'persönlich + gelistet werden',
    ansprechpartner: 'Pflegeberater:innen im Stützpunkt',
    warum:
      'Neutrale Beratungsstellen helfen Angehörigen bei der Suche und empfehlen Dienste mit freier Kapazität – ideal, wenn du gerade Plätze frei hast.',
    schritte: [
      'Stützpunkt im Gebiet finden, Beratungstermin vereinbaren, dich und deine freie Kapazität vorstellen.',
      'Bitten, in deren Liste/Empfehlungspool aufgenommen zu werden.',
      'Freie Kapazität aktuell halten (kurze Mail bei Änderungen).',
    ],
    vorlage_typ: 'Anfrage zur Aufnahme in den Empfehlungspool',
    vorlage:
      'Sehr geehrte Pflegeberatung,\nwir sind ein ambulanter Dienst in {Ort} mit freier Kapazität für {Leistungen}. Dürfen wir uns vorstellen und in Ihren Empfehlungspool aufgenommen werden? Erreichbar: {Telefon} · {Email}.',
    fehler: 'Den Stützpunkt gar nicht kennen. Kapazität nicht aktuell halten.',
    rhythmus: 'Quartalsweise Kapazität aktualisieren',
  },
  {
    key: 'sanitaetshaus',
    kategorie: 'sanitaetshaus',
    name: 'Agent Sanitätshaus / Homecare',
    kanal: 'Sanitätshäuser & Homecare-Versorger',
    erfolg: 55,
    aufwand: 2,
    zeit_wochen: '3–8',
    patienten: '1–2',
    kontaktweg: 'persönlich – Kooperation aufbauen',
    ansprechpartner: 'Filialleitung / Außendienst Homecare',
    warum:
      'Sie versorgen frisch Pflegebedürftige mit Hilfsmitteln und kennen Bedarf, bevor ein Dienst da ist. Gegenseitige Empfehlung lohnt sich.',
    schritte: [
      'Filiale besuchen, Kooperation vorschlagen: ihr empfehlt euch gegenseitig.',
      'Gemeinsame Visitenkarten/Flyer am Tresen platzieren.',
      'Konkrete Ansprechperson + kurze Wege vereinbaren.',
    ],
    vorlage_typ: 'Kooperationsvorschlag',
    vorlage:
      'Hallo, wir sind {Pflegedienst} in {Ort}. Wir haben freie Kapazität ({Leistungen}) und schlagen eine Kooperation vor: Sie empfehlen uns Pflegebedürftigen, wir Sie für Hilfsmittel. Kontakt: {Telefon} · {Email}.',
    fehler: 'Nur einmalig Flyer abgeben ohne feste Ansprechperson und ohne Gegenleistung.',
    rhythmus: 'Monatlich kurzer Kontakt zur Partnerfiliale',
  },
  {
    key: 'apotheke',
    kategorie: 'apotheke',
    name: 'Agent Apotheken',
    kanal: 'Apotheken',
    erfolg: 45,
    aufwand: 1,
    zeit_wochen: '2–8',
    patienten: '0–2',
    kontaktweg: 'persönlich + Flyer-Ständer am Tresen',
    ansprechpartner: 'Inhaber:in / Filialleitung',
    warum:
      'Apotheken haben täglich Kontakt zu Angehörigen pflegebedürftiger Menschen und werden um Empfehlungen gebeten.',
    schritte: [
      'Inhaber:in ansprechen, kleinen Flyer-Ständer/Visitenkarten am Tresen anbieten.',
      'Botendienst/Verblisterung als gemeinsames Thema nutzen.',
      'Regelmäßig Material nachfüllen.',
    ],
    vorlage_typ: 'Tresen-Karte (Kurztext)',
    vorlage:
      'Ambulante Pflege gesucht? {Pflegedienst} in {Ort} hat freie Kapazität: {Leistungen}. ☎ {Telefon}. Wir beraten kostenlos.',
    fehler: 'Briefkasten-Streuung statt gezielter Tresen-Platzierung; Material nie nachfüllen.',
    rhythmus: 'Alle 4–6 Wochen Material prüfen',
  },
  {
    key: 'heim',
    kategorie: 'seniorenheim',
    name: 'Agent Betreutes Wohnen',
    kanal: 'Betreutes Wohnen & Senioren-WGs',
    erfolg: 60,
    aufwand: 2,
    zeit_wochen: '4–10',
    patienten: '1–4',
    kontaktweg: 'persönlich – Einrichtungsleitung',
    ansprechpartner: 'Einrichtungs-/Hausleitung, WG-Koordination',
    warum:
      'Bewohner im betreuten Wohnen brauchen oft ambulante Pflege. Wer in einer Anlage fußfasst, betreut häufig mehrere Bewohner.',
    schritte: [
      'Leitung kontaktieren, Vorstellung als bevorzugter ambulanter Partner für die Anlage.',
      'Infoabend für Bewohner/Angehörige anbieten.',
      'Bei einem Bewohner starten, Qualität zeigen, Empfehlungen einsammeln.',
    ],
    vorlage_typ: 'Anfrage Einrichtungsleitung',
    vorlage:
      'Sehr geehrte Leitung, wir sind {Pflegedienst} ({Ort}) mit freier Kapazität ({Leistungen}). Gerne stellen wir uns als ambulanter Partner Ihrer Anlage vor und bieten einen Infoabend für Angehörige an. {Telefon} · {Email}.',
    fehler: 'Nur einen Bewohner betreuen und keine Empfehlungen/Folgekontakte aufbauen.',
    rhythmus: 'Quartalsweise Infoangebot, laufender Kontakt zur Leitung',
  },
  {
    key: 'physio',
    kategorie: 'physiotherapie',
    name: 'Agent Therapiepraxen',
    kanal: 'Physiotherapie / Ergotherapie',
    erfolg: 45,
    aufwand: 1,
    zeit_wochen: '3–8',
    patienten: '0–2',
    kontaktweg: 'persönlich – gegenseitige Empfehlung',
    ansprechpartner: 'Praxisleitung',
    warum: 'Therapeuten haben dieselbe Zielgruppe und empfehlen gerne verlässliche Pflegedienste.',
    schritte: ['Praxis besuchen, Empfehlungspartnerschaft vorschlagen.', 'Material dalassen, Ansprechperson festlegen.'],
    vorlage_typ: 'Empfehlungspartnerschaft',
    vorlage: 'Hallo, {Pflegedienst} ({Ort}) – wir haben freie Kapazität ({Leistungen}). Empfehlen wir uns gegenseitig? {Telefon}.',
    fehler: 'Kein fester Ansprechpartner, kein Nachfassen.',
    rhythmus: 'Alle 6–8 Wochen',
  },
  {
    key: 'online',
    kategorie: null,
    name: 'Agent Online-Sichtbarkeit',
    kanal: 'Google-Unternehmensprofil, Portale & lokale SEO',
    erfolg: 60,
    aufwand: 2,
    zeit_wochen: '4–12',
    patienten: '1–4',
    kontaktweg: 'online',
    ansprechpartner: 'du selbst (digital)',
    warum:
      'Angehörige googeln „ambulanter Pflegedienst + Ort + freie Kapazität“. Ein gepflegtes Google-Profil mit guten Bewertungen bringt planbar Anfragen – rund um die Uhr.',
    schritte: [
      'Google-Unternehmensprofil anlegen/optimieren: Leistungen, Gebiet, „Nimmt neue Patienten auf“, Fotos, Telefon.',
      'Aktiv um Google-Bewertungen bitten (zufriedene Angehörige).',
      'In Verzeichnissen eintragen (z. B. Pflegelotse/AOK, pflege.de, Weiße Liste, lokale Branchenbücher).',
      'Auf der Website klar „Wir haben aktuell freie Kapazität in {Ort}“ + Telefonnummer ganz oben.',
    ],
    vorlage_typ: 'Bewertungs-Bitte an Angehörige',
    vorlage:
      'Liebe/r {Angehörige:r}, wenn Sie mit unserer Pflege zufrieden sind, würden Sie uns mit einer kurzen Google-Bewertung sehr helfen – das hilft anderen Familien, uns zu finden. Hier der Link: {Link}. Herzlichen Dank, {Name}.',
    fehler:
      'Kein/leeres Google-Profil. Keine Bewertungen aktiv einsammeln. Telefonnummer auf der Website versteckt. „Freie Kapazität“ nirgends sichtbar.',
    rhythmus: 'Wöchentlich 1 Bewertung anfragen, Profil monatlich aktualisieren',
  },
  {
    key: 'empfehlung',
    kategorie: null,
    name: 'Agent Empfehlungen',
    kanal: 'Bestandskunden & Mundpropaganda',
    erfolg: 75,
    aufwand: 1,
    zeit_wochen: '0–4',
    patienten: '1–3',
    kontaktweg: 'persönlich – aktiv fragen',
    ansprechpartner: 'aktuelle Patienten & deren Angehörige',
    warum:
      'Die zuverlässigste und günstigste Quelle. Zufriedene Angehörige kennen andere Betroffene (Nachbarschaft, Vereine). Du musst nur aktiv fragen – das vergessen die meisten.',
    schritte: [
      'Bei zufriedenen Familien direkt fragen: „Kennen Sie jemanden, der auch Unterstützung braucht?“',
      'Kleine Empfehlungskarten mitgeben.',
      'Nach guten Phasen um Google-Bewertung bitten.',
    ],
    vorlage_typ: 'Empfehlungs-Frage',
    vorlage:
      'Es freut mich, dass Sie zufrieden sind. Falls Sie in Ihrem Umfeld jemanden kennen, der ebenfalls Pflege braucht – wir haben gerade Kapazität. Geben Sie gern unsere Karte weiter.',
    fehler: 'Nie aktiv nach Empfehlungen fragen. Annehmen, es passiere „von allein“.',
    rhythmus: 'Laufend, bei jedem positiven Kontakt',
  },
  {
    key: 'kommune',
    kategorie: null,
    name: 'Agent Kommune & Soziales',
    kanal: 'Betreuer, Kirchengemeinden, Vereine, Seniorentreffs',
    erfolg: 50,
    aufwand: 2,
    zeit_wochen: '4–12',
    patienten: '1–2',
    kontaktweg: 'persönlich + E-Mail',
    ansprechpartner: 'gesetzliche Betreuer:innen, Betreuungsvereine, Gemeindereferent:innen, Leiter Seniorentreff',
    warum:
      'Gesetzliche Betreuer organisieren Pflege für ihre Klient:innen und vergeben regelmäßig Aufträge. Gemeinden/Vereine erreichen viele Senioren direkt.',
    schritte: [
      'Örtliche Betreuungsvereine & selbstständige Betreuer:innen anschreiben/anrufen, Kapazität melden.',
      'Bei Kirchengemeinden/Seniorentreffs einen kostenlosen Info-/Vortragstermin anbieten („Pflegegrad & Leistungen“).',
      'Vor Ort präsent sein, Visitenkarten hinterlassen.',
    ],
    vorlage_typ: 'Anschreiben an Betreuer:innen',
    vorlage:
      'Sehr geehrte:r Betreuer:in, wir sind {Pflegedienst} in {Ort} mit freier Kapazität ({Leistungen}) und übernehmen kurzfristig neue Klient:innen. Erreichbar: {Telefon} · {Email}. Gerne stelle ich uns kurz vor.',
    fehler: 'Betreuer als Quelle komplett übersehen. Vorträge nicht anbieten.',
    rhythmus: 'Quartalsweise Kontakt, 1 Infoveranstaltung/Quartal',
  },
  {
    key: 'flyer',
    kategorie: null,
    name: 'Agent Flyer & Direktwerbung',
    kanal: 'Flyer / Printwerbung',
    erfolg: 25,
    aufwand: 2,
    zeit_wochen: '2–6',
    patienten: '0–1',
    kontaktweg: 'gezielte Platzierung statt Streuung',
    ansprechpartner: '–',
    warum:
      'Flyer wirken NUR an Orten, wo die Zielgruppe ohnehin ist (Apotheke, Arztpraxis, Sanitätshaus, Seniorentreff). Briefkasten-Streuung hat hohen Streuverlust und bringt kaum verlässliche Patienten.',
    schritte: [
      'Flyer NICHT in Briefkästen streuen, sondern gezielt an den o. g. Partner-Orten platzieren (siehe andere Agenten).',
      'Klare Botschaft: „Freie Kapazität in {Ort}“ + große Telefonnummer + 1 Nutzen.',
      'Wirkung messen: eigene Rufnummer/Stichwort, um Reaktionen zuzuordnen.',
    ],
    vorlage_typ: 'Flyer-Kernbotschaft',
    vorlage:
      'AMBULANTE PFLEGE mit freier Kapazität in {Ort}\n{Leistungen}\nKostenlose Beratung – wir sind für Sie da.\n☎ {Telefon}',
    fehler:
      'Genau dein wahrscheinlicher Fehler: viel Geld in Briefkasten-Flyer ohne Zielgruppenbezug. Besser: dieselben Flyer gezielt bei Partnern platzieren.',
    rhythmus: 'Einmalig produzieren, an Partnerorten dauerhaft präsent',
  },
];

export const AGENT_BY_KATEGORIE = Object.fromEntries(
  AGENTEN.filter((a) => a.kategorie).map((a) => [a.kategorie, a])
);

// Personalisiert und priorisiert das Team für die Situation des Nutzers.
export function strategiePlan({ leistungen = [], kapazitaet = 0, schon_versucht = [] } = {}) {
  const istIntensiv = leistungen.some((l) => ['intensivpflege', 'beatmung'].includes(l));
  const istBehandlung = leistungen.some((l) => ['wundmanagement', 'medikamentengabe'].includes(l));

  const kanaele = AGENTEN.map((a) => {
    let passung = 0;
    const hinweise = [];
    // fachliche Passung hebt bestimmte Kanäle
    if (istIntensiv && (a.key === 'klinik' || a.key === 'heim')) {
      passung += 12;
      hinweise.push('Für Intensiv-/Beatmungspflege besonders relevant (Kliniken/Beatmungs-WGs).');
    }
    if (istBehandlung && a.key === 'arzt') {
      passung += 12;
      hinweise.push('Du bietest Behandlungspflege – Ärzte sind dafür dein wichtigster Verordnungsweg.');
    }
    // bereits Versuchtes: Kanal nicht abwerten, sondern Diagnose mitgeben
    const versucht = schon_versucht.includes(a.key);
    if (versucht) hinweise.push('Schon versucht – prüfe die „typischen Fehler“: meist fehlen Regelmäßigkeit, fester Ansprechpartner oder Nachfassen.');

    // Priorität: Erfolg dominiert, leichter Aufwand bevorzugt, Passung als Bonus
    const prio = a.erfolg + passung + (3 - a.aufwand) * 4;
    return { ...a, passung, hinweise, versucht, prioritaet: prio };
  }).sort((x, y) => y.prioritaet - x.prioritaet);

  // 30/60/90-Tage-Plan aus den Top-Kanälen
  const plan = {
    tage_30: kanaele.slice(0, 3).map((k) => k.kanal),
    tage_60: kanaele.slice(3, 6).map((k) => k.kanal),
    tage_90: kanaele.slice(6, 9).map((k) => k.kanal),
  };

  const erwartet_min = kanaele.slice(0, 5).reduce((s, k) => s + Number(String(k.patienten).split('–')[0]) || 0, 0);
  const erwartet_max = kanaele.slice(0, 5).reduce((s, k) => s + (Number(String(k.patienten).split('–')[1]) || Number(String(k.patienten).split('–')[0]) || 0), 0);

  const diagnose = baueDiagnose(schon_versucht, kapazitaet);

  return { diagnose, plan, kanaele, erwartet_pro_monat: `${erwartet_min}–${erwartet_max}` };
}

function baueDiagnose(schonVersucht, kapazitaet) {
  const punkte = [];
  punkte.push(
    'Die wichtigste Erkenntnis: Patienten kommen in der ambulanten Pflege fast nie über EINMAL-Aktionen, sondern über VERLÄSSLICHE BEZIEHUNGEN zu wenigen guten Zuweisern (v. a. Klinik-Sozialdienst, Ärzte, Pflegeberatung). Entscheidend sind drei Dinge: schnelle Erreichbarkeit, sichtbare freie Kapazität und konsequentes Nachfassen.'
  );
  if (schonVersucht.includes('flyer'))
    punkte.push('Du hast Flyer probiert: Briefkasten-Streuung bringt fast nichts. Dieselben Flyer wirken nur gezielt bei Apotheken/Praxen/Sanitätshäusern.');
  if (schonVersucht.includes('klinik'))
    punkte.push('Du warst beim Sozialdienst: Der Schlüssel ist die WÖCHENTLICHE Kapazitätsmeldung und Wochenend-Erreichbarkeit – ein Einmalbesuch verpufft.');
  if (schonVersucht.includes('online') === false)
    punkte.push('Online-Sichtbarkeit (Google-Profil + Bewertungen) fehlt oft – das bringt rund um die Uhr planbare Anfragen und solltest du parallel aufbauen.');
  if (schonVersucht.includes('empfehlung') === false)
    punkte.push('Aktiv nach Empfehlungen fragen wird fast immer vergessen – dabei ist es die zuverlässigste Quelle.');
  if (kapazitaet > 0)
    punkte.push(`Kommuniziere deine freie Kapazität (${kapazitaet} h/Woche) ÜBERALL aktiv – „freie Plätze“ ist dein stärkstes Verkaufsargument.`);
  return punkte;
}
