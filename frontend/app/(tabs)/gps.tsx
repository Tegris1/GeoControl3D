import { ThemedView } from "@/components/themed-view";
import TopconGPSReader from "@/pages/topcon-gps-reader";
import { StyleSheet } from "react-native";

export default function GPSScreen() {
  return (
    <ThemedView style={styles.container}>
      <TopconGPSReader />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
