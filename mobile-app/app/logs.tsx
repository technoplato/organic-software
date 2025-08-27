import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { init } from '../lib/db';

const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad',
});

export default function LogsScreen() {
  const { data, isLoading, error } = db.useQuery({ logs: {} });
  const logs = data?.logs || [];

  const sorted = useMemo(
    () => [...logs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [logs]
  );

  if (isLoading) return <View style={styles.center}><Text>Loading logs…</Text></View>;
  if (error) return <View style={styles.center}><Text>Error loading logs</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logs</Text>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.kind || 'log'}</Text>
            {item.message && <Text style={styles.message}>{item.message}</Text>}
            <Text style={styles.meta}>at {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'unknown'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No logs yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  message: { color: '#333', marginTop: 4 },
  meta: { color: '#666', marginTop: 6 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
