import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../types';
import { useRoleStore } from '../../store/roleStore';
import { C, SP, R, FONT, SHADOW_SM, SHADOW_MD } from '../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplaeneHome'>;
};

export default function TrainingsplaeneHomeScreen({ navigation }: Props) {
  const { currentUser, users, setCurrentUser } = useRoleStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current user */}
      <View style={styles.heroCard}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>
            {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{currentUser.name}</Text>
          <View style={[styles.roleBadge, currentUser.role === 'trainer' ? styles.roleBadgeTrainer : styles.roleBadgeSportler]}>
            <Text style={[styles.roleText, currentUser.role === 'trainer' ? styles.roleTextTrainer : styles.roleTextSportler]}>
              {currentUser.role === 'trainer' ? '🏋️ Trainer' : '💪 Sportler'}
            </Text>
          </View>
        </View>
      </View>

      {/* User switcher */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nutzer wechseln</Text>
        {users.map((u) => (
          <TouchableOpacity
            key={u.id}
            style={[styles.userRow, currentUser.id === u.id && styles.userRowActive]}
            onPress={() => setCurrentUser(u.id)}
          >
            <View style={[styles.userAvatar, u.role === 'trainer' ? styles.userAvatarTrainer : styles.userAvatarSportler]}>
              <Text style={[styles.userAvatarText, u.role === 'trainer' ? styles.userAvatarTextTrainer : styles.userAvatarTextSportler]}>
                {u.name.split(' ').map((n) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name}</Text>
              <Text style={styles.userRole}>{u.role === 'trainer' ? 'Trainer' : 'Sportler'}</Text>
            </View>
            {currentUser.id === u.id && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Bereich öffnen</Text>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('TrainerPlanList')}>
          <View style={[styles.navIcon, styles.navIconTrainer]}>
            <Text style={styles.navIconText}>📋</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Trainer-Bereich</Text>
            <Text style={styles.navSub}>Pläne erstellen & verwalten</Text>
          </View>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('SportlerPlanList')}>
          <View style={[styles.navIcon, styles.navIconSportler]}>
            <Text style={styles.navIconText}>🏃</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Sportler-Bereich</Text>
            <Text style={styles.navSub}>Pläne ansehen & Feedback geben</Text>
          </View>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },

  heroCard: {
    backgroundColor: C.primary, borderRadius: R.lg, padding: SP.xl,
    flexDirection: 'row', alignItems: 'center', gap: SP.lg, ...SHADOW_MD,
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { fontSize: FONT.lg, fontWeight: '800', color: C.white },
  heroInfo: { flex: 1, gap: SP.xs },
  heroName: { fontSize: FONT.lg, fontWeight: '800', color: C.white },
  roleBadge: { alignSelf: 'flex-start', borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: 3 },
  roleBadgeTrainer: { backgroundColor: 'rgba(249,115,22,0.25)' },
  roleBadgeSportler: { backgroundColor: 'rgba(255,255,255,0.2)' },
  roleText: { fontSize: FONT.sm, fontWeight: '700' },
  roleTextTrainer: { color: C.accent },
  roleTextSportler: { color: C.white },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.sm, ...SHADOW_SM },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SP.xs },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.sm, borderRadius: R.sm },
  userRowActive: { backgroundColor: C.primaryLight },
  userAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  userAvatarTrainer: { backgroundColor: C.accentLight },
  userAvatarSportler: { backgroundColor: C.primaryLight },
  userAvatarText: { fontSize: FONT.sm, fontWeight: '800' },
  userAvatarTextTrainer: { color: C.accent },
  userAvatarTextSportler: { color: C.primary },
  userInfo: { flex: 1 },
  userName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  userRole: { fontSize: FONT.xs, color: C.textMuted, marginTop: 1 },
  checkMark: { color: C.primary, fontSize: 18, fontWeight: '700' },

  navCard: {
    flexDirection: 'row', alignItems: 'center', gap: SP.md,
    padding: SP.md, borderRadius: R.md, backgroundColor: C.bg,
  },
  navIcon: { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  navIconTrainer: { backgroundColor: C.accentLight },
  navIconSportler: { backgroundColor: C.primaryLight },
  navIconText: { fontSize: 22 },
  navInfo: { flex: 1 },
  navTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  navSub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  navChevron: { fontSize: 22, color: C.textMuted, fontWeight: '600' },
});
