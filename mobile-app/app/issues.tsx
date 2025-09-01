import { useMemo } from "react";
import { View, Text, FlatList, SafeAreaView } from "react-native";
import { init } from "@instantdb/react-native";
import useStyles from "../lib/useStyles";

const db = init({
  appId:
    process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
    "fb7ff756-0a99-4d0c-81f7-71a0abee071f",
});

interface Issue {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Done";
  createdAt?: number;
  updatedAt?: number;
}

export default function IssuesScreen() {
  const { styles, palette } = useStyles();
  const { data, isLoading, error } = db.useQuery({ issues: {} });
  const issues = data?.issues || [];

  const sorted = useMemo(
    () => [...issues].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [issues],
  );

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High":
        return palette.error;
      case "Medium":
        return palette.warning;
      case "Low":
        return palette.success;
      default:
        return palette.textSecondary;
    }
  };

  const renderIssue = ({ item }: { item: Issue }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.priority && (
          <View
            style={[
              {
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: getPriorityColor(item.priority),
              },
            ]}
          >
            <Text style={[{ fontSize: 12, fontWeight: "600", color: "white" }]}>
              {item.priority}
            </Text>
          </View>
        )}
      </View>
      {item.description && (
        <Text style={styles.cardDescription}>{item.description}</Text>
      )}
      <View
        style={[
          styles.flexRow,
          styles.justifyBetween,
          styles.alignCenter,
          { marginTop: 12 },
        ]}
      >
        <Text
          style={[
            {
              fontSize: 12,
              fontWeight: "600",
              color: palette.textPrimary,
              backgroundColor: palette.surface,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: palette.border,
            },
          ]}
        >
          {item.status}
        </Text>
        {item.createdAt && (
          <Text style={[{ fontSize: 12, color: palette.textTertiary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading issues…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading issues</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.padding, styles.alignCenter, styles.marginBottom]}>
        <Text style={styles.title}>🐛 Issues</Text>
        <Text style={styles.subtitle}>Track project issues and bugs</Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🐛</Text>
          <Text style={styles.emptyStateTitle}>No issues found</Text>
          <Text style={styles.emptyStateText}>
            Issues will appear here when they are created
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderIssue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.paddingHorizontal,
            { paddingBottom: 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
