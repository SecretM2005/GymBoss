import { useSettingsStore } from '../store/settingsStore';

const de = {
  // Tabs
  tab_home:      'Home',
  tab_plaene:    'Pläne',
  tab_sportler:  'Sportler',
  tab_mehr:      'Mehr',

  // Settings
  einstellungen:    'Einstellungen',
  sprache:          'Sprache',
  erscheinungsbild: 'Erscheinungsbild',
  coaching_ansicht: 'Coaching-Ansicht',
  dunkelmodus:      'Dunkelmodus',
  hellmodus:        'Hellmodus',
  kalender:         'Kalender',
  wochen:           'Wochen',
  deutsch:          'Deutsch',
  englisch:         'Englisch',

  // Common
  speichern:   'Speichern',
  abbrechen:   'Abbrechen',
  loeschen:    'Löschen',
  bearbeiten:  'Bearbeiten',

  // Plan screens
  trainingsplaene:     'Trainingspläne',
  trainingsplan:       'Trainingsplan',
  neuer_plan:          'Neuer Plan',
  kein_plan:           'Noch keine Pläne',
  plan_erstellen:      'Plan erstellen',
  woche:               'Woche',
  einheit_hinzufuegen: 'Einheit hinzufügen',
  uebung_hinzufuegen:  'Übung hinzufügen',
  kreis_hinzufuegen:   'Kreis hinzufügen',
  intervall:           'Intervall',
  kein_sportler_zugewiesen: 'Kein Sportler zugewiesen',

  // Athlete screens
  sportler_verw:    'Trainer · Verwaltung',
  alle_sportler:    'Alle Sportler',
  kein_sportler:    'Noch keine Sportler',
  sportler_anlegen: 'Sportler anlegen',
  neuer_sportler:   'Neuer Sportler',
  aktiv:            'Aktiv',
  sportarten:       'Sportarten',
  kein_treffer:     'Kein Treffer',
  suche_sportler:   'Sportler suchen…',
  suche_plaene:     'Pläne suchen…',

  // Phases
  phase_warmup:  'Aufwärmen',
  phase_haupt:   'Haupteinheit',
  phase_cooldown: 'Cooldown',

  // Dashboard
  heute:   'Heute',
  kein_einheit_heute: 'Keine Einheit heute',
  naechste_woche: 'Diese Woche',
};

const en: typeof de = {
  tab_home:      'Home',
  tab_plaene:    'Plans',
  tab_sportler:  'Athletes',
  tab_mehr:      'More',

  einstellungen:    'Settings',
  sprache:          'Language',
  erscheinungsbild: 'Appearance',
  coaching_ansicht: 'Coaching View',
  dunkelmodus:      'Dark Mode',
  hellmodus:        'Light Mode',
  kalender:         'Calendar',
  wochen:           'Weekly',
  deutsch:          'German',
  englisch:         'English',

  speichern:   'Save',
  abbrechen:   'Cancel',
  loeschen:    'Delete',
  bearbeiten:  'Edit',

  trainingsplaene:     'Training Plans',
  trainingsplan:       'Training Plan',
  neuer_plan:          'New Plan',
  kein_plan:           'No plans yet',
  plan_erstellen:      'Create plan',
  woche:               'Week',
  einheit_hinzufuegen: 'Add Session',
  uebung_hinzufuegen:  'Add Exercise',
  kreis_hinzufuegen:   'Add Circuit',
  intervall:           'Interval',
  kein_sportler_zugewiesen: 'No athlete assigned',

  sportler_verw:    'Trainer · Management',
  alle_sportler:    'All Athletes',
  kein_sportler:    'No athletes yet',
  sportler_anlegen: 'Add athlete',
  neuer_sportler:   'New Athlete',
  aktiv:            'Active',
  sportarten:       'Sports',
  kein_treffer:     'No results',
  suche_sportler:   'Search athletes…',
  suche_plaene:     'Search plans…',

  phase_warmup:   'Warm-up',
  phase_haupt:    'Main Session',
  phase_cooldown: 'Cool-down',

  heute:   'Today',
  kein_einheit_heute: 'No session today',
  naechste_woche: 'This Week',
};

const DICTS = { de, en } as const;

export type TKey = keyof typeof de;

export function useT() {
  const sprache = useSettingsStore((s) => s.sprache);
  const dict = DICTS[sprache];
  return (key: TKey): string => dict[key] ?? de[key];
}
