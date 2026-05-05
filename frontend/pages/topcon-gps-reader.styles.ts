import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subheader: {
    fontSize: 14,
    color: "#4b5563",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusText: {
    fontSize: 13,
    color: "#1d4ed8",
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#b3261e",
    backgroundColor: "#fdecea",
    borderRadius: 6,
    padding: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  presetButtonActive: {
    borderColor: "#1d4ed8",
    backgroundColor: "#dbeafe",
  },
  presetButtonText: {
    fontSize: 12,
    color: "#111827",
  },
  presetButtonTextActive: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
  },
  deviceItem: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 12,
    gap: 4,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  deviceAddress: {
    fontSize: 12,
    color: "#6b7280",
  },
  connectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  connectedDetails: {
    flex: 1,
    gap: 4,
  },
  connectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 20,
    color: "#111827",
  },
  rtkStageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rtkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  rtkDotActive: {
    backgroundColor: "#16a34a",
  },
  rtkDotIdle: {
    backgroundColor: "#d1d5db",
  },
  rtkStageText: {
    flex: 1,
    gap: 2,
  },
  rtkStageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  rtkStageDetail: {
    fontSize: 12,
    color: "#6b7280",
  },
});
