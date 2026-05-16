import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KundenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenList'>;
};

const PLACEHOLDER_KUNDEN = [
  { id: '1', name: 'Anna Müller', mitgliedschaft: 'Premium', seit: 'Jan 2024' },
  { id: '2', name: 'Thomas Bauer', mitgliedschaft: 'Basic', seit: 'Mär 2024' },
  { id: '3', name: 'Sophie Wagner', mitgliedschaft: 'Premium', seit: 'Feb 2024' },
];

export default function KundenListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={PLACEHOLDER_KUNDEN}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('KundeAnlegen')}
          >
            <Text style={styles.addButtonText}>+ Neuen Kunden anlegen</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('KundenDetail', { kundeId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>Mitglied seit {item.seit}</Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: item.mitgliedschaft === 'Premium' ? '#ede9fe' : '#f3f4f6' },
            ]}>
              <Text style={[
                styles.badgeText,
                { color: item.mitgliedschaft === 'Premium' ? '#6366f1' : '#6b7280' },
              ]}>
                {item.mitgliedschaft}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16, gap: 10 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: '600', color: '#111827', fontSize: 15 },
  cardSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
