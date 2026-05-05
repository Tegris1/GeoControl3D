import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">GPS Project</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Welcome</ThemedText>
        <ThemedText>
          Navigate using the tabs to access GPS functionality.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
  },
  content: {
    gap: 12,
    paddingVertical: 16,
  },
});
