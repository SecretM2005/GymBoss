import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore, AppTheme, AppSprache, CoachingView } from '../../store/settingsStore';
import { useColors, SP, R, FONT } from '../../theme';
import { useT } from '../../i18n';
import { GBIcon } from '../../components/GBIcon';

// ─── Option Row ───────────────────────────────────────────────────────────────

type OptionItem<T> = { value: T; labelKey: string; icon: string };

function OptionGroup<T extends string>({
  options,
  current,
  onSelect,
  C,
}: {
  options: OptionItem<T>[];
  current: T;
  onSelect: (v: T) => void;
  C: ReturnType<typeof useColors>;
}) {
  const t = useT();
  return (
    <View style={[s.optionGroup, { backgroundColor: C.surface, borderColor: C.border }]}>
      {options.map((opt, i) => {
        const active = opt.value === current;
        const isLast = i === options.length - 1;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              s.optionRow,
              !isLast && { borderBottomWidth: 1, borderBottomColor: C.border },
              active && { backgroundColor: C.accentLight },
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[s.optionIcon, active && { backgroundColor: `${C.accent}22` }]}>
              <GBIcon name={opt.icon as any} size={16} color={active ? C.accent : C.textMuted} />
            </View>
            <Text style={[s.optionLabel, { color: active ? C.text : C.textSub }]}>
              {t(opt.labelKey as any)}
            </Text>
            {active && (
              <View style={[s.checkCircle, { backgroundColor: C.accent }]}>
                <GBIcon name="check" size={11} color={C.accentContrast} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, C }: { label: string; C: ReturnType<typeof useColors> }) {
  return (
    <Text style={[s.sectionHeader, { color: C.textDim }]}>{label.toUpperCase()}</Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SPRACHE_OPTIONS: OptionItem<AppSprache>[] = [
  { value: 'de', labelKey: 'deutsch',  icon: 'globe' },
  { value: 'en', labelKey: 'englisch', icon: 'globe' },
];

const THEME_OPTIONS: OptionItem<AppTheme>[] = [
  { value: 'dark',  labelKey: 'dunkelmodus', icon: 'moon' },
  { value: 'light', labelKey: 'hellmodus',   icon: 'sun'  },
];

const COACHING_OPTIONS: OptionItem<CoachingView>[] = [
  { value: 'kalender', labelKey: 'kalender', icon: 'calendar' },
  { value: 'wochen',   labelKey: 'wochen',   icon: 'layers'   },
];

export default function MehrScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const t = useT();
  const { theme, sprache, coachingView, setTheme, setSprache, setCoachingView } = useSettingsStore();

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <GBIcon name="settings" size={22} color={C.accent} />
        <Text style={[s.headerTitle, { color: C.text }]}>{t('einstellungen')}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Language */}
        <SectionHeader label={t('sprache')} C={C} />
        <OptionGroup<AppSprache>
          options={SPRACHE_OPTIONS}
          current={sprache}
          onSelect={setSprache}
          C={C}
        />

        {/* Theme */}
        <SectionHeader label={t('erscheinungsbild')} C={C} />
        <OptionGroup<AppTheme>
          options={THEME_OPTIONS}
          current={theme}
          onSelect={setTheme}
          C={C}
        />

        {/* Coaching View */}
        <SectionHeader label={t('coaching_ansicht')} C={C} />
        <OptionGroup<CoachingView>
          options={COACHING_OPTIONS}
          current={coachingView}
          onSelect={setCoachingView}
          C={C}
        />

        {/* Info footer */}
        <View style={[s.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <GBIcon name="info" size={14} color={C.textDim} />
          <Text style={[s.infoText, { color: C.textDim }]}>
            {sprache === 'de'
              ? 'Einstellungen werden sofort auf alle Bereiche der App angewendet.'
              : 'Settings are applied immediately across all areas of the app.'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.xl, paddingVertical: SP.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.sm },

  sectionHeader: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.6, marginTop: SP.sm, marginBottom: 4, paddingHorizontal: 2 },

  optionGroup: { borderRadius: R.lg, borderWidth: 1, overflow: 'hidden' },
  optionRow:   { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.md, paddingVertical: SP.md + 2 },
  optionIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: FONT.base, fontWeight: '500' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.md, borderWidth: 1, padding: SP.md, marginTop: SP.lg },
  infoText: { flex: 1, fontSize: FONT.xs, lineHeight: 17 },
});
