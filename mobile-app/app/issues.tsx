import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { init } from '../lib/db';

const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad',
});

export default function IssuesScreen() {
  const { data, isLoading, error } = db.useQuery({ issues: {} });
  const issues = data?.issues || [];

  const sorted = useMemo(
    () => [...issues].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [issues]
  );

  if (isLoading) return <View style={styles.center}><Text>Loading issues…</Text></View>;
  if (error) return <View style={styles.center}><Text>Error loading issues</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Issues</Text>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.title} <Text style={styles.status}>[{item.status}]</Text></Text>
            {item.priority && <Text style={styles.priority}>Priority: {item.priority}</Text>}
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No issues yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  status: { color: '#666', fontWeight: '400' },
  priority: { color: '#333', marginTop: 4 },
  desc: { color: '#555', marginTop: 6 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
