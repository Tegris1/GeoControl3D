import { ThemedView } from "@/components/themed-view";
import TopconGPSReaderWeb from "@/components/topcon-gps-reader-web";
import { StyleSheet } from "react-native";

export default function GPSWebScreen() {
  return (
    <ThemedView style={styles.container}>
      <TopconGPSReaderWeb />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
