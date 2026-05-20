import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../types';
import { useRoleStore } from '../../store/roleStore';
import TopBar from '../../components/TopBar';
import GBAvatar from '../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT } from '../../theme';

type Props = { navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplaeneHome'> };

export default function TrainingsplaeneHomeScreen({ navigation }: Props) {
  const { currentUser, users, setCurrentUser } = useRoleStore();

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle="GymBoss"
        title="Trainingspläne"
        trailing={<IconBtn name="settings" onPress={() => {}} />}
      />
      <ScrollView contentContainerStyle={styles.content}>

        {/* User picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Aktiver Nutzer</Text>
          {users.map((u) => {
            const on = currentUser.id === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => setCurrentUser(u.id)}
                style={[styles.userRow, on && styles.userRowActive]}
                activeOpacity={0.7}
              >
                <GBAvatar name={u.name} initials={u.initials} size={44} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userSub}>
                    {u.role === 'trainer' ? (u.spec ?? 'Trainer') : `${u.alter} J · ${u.ziel}`}
                  </Text>
                </View>
                <View style={[styles.radio, on && styles.radioActive]}>
                  {on && <GBIcon name="check" size={14} color={C.accentContrast} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation cards */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bereich öffnen</Text>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('TrainerPlanList')} activeOpacity={0.75}>
            <View style={[styles.navIconBox, { backgroundColor: C.accentLight }]}>
              <GBIcon name="dumbbell" size={22} color={C.accent} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>Trainer-Bereich</Text>
              <Text style={styles.navSub}>Pläne erstellen & verwalten</Text>
            </View>
            <GBIcon name="chevronRight" size={20} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('TrainerSportlerList')} activeOpacity={0.75}>
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(203,255,62,0.08)' }]}>
              <GBIcon name="users" size={22} color={C.accent} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>Sportlerverwaltung</Text>
              <Text style={styles.navSub}>Athleten hinzufügen & verwalten</Text>
            </View>
            <GBIcon name="chevronRight" size={20} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('SportlerPlanList')} activeOpacity={0.75}>
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(122,191,255,0.14)' }]}>
              <GBIcon name="bolt" size={22} color="#7ABFFF" />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>Sportler-Bereich</Text>
              <Text style={styles.navSub}>Pläne ansehen & Feedback geben</Text>
            </View>
            <GBIcon name="chevronRight" size={20} color={C.textDim} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.xl, gap: SP.lg, paddingBottom: 100 },

  section: { gap: SP.sm },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: SP.xs },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  userRowActive: { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.06)' },
  userInfo: { flex: 1 },
  userName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  userSub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: C.accent, borderColor: C.accent },

  navCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.lg, borderRadius: R.lg, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  navIconBox: { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  navInfo: { flex: 1 },
  navTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  navSub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
});
