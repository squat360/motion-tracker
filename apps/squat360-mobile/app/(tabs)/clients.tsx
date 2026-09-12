import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { gym } from '@/src/theme/gym';
import { listClients, type Client } from '@/src/db/database';

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setClients(await listClients());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clients</Text>
      <Text style={styles.muted}>Local expo-sqlite seed data for gym demos.</Text>
      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={gym.accent} />}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.muted}>{item.notes}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>No clients yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700' },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: gym.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gym.border,
    padding: 14,
    gap: 4,
  },
  cardTitle: { color: gym.text, fontSize: 16, fontWeight: '600' },
});
