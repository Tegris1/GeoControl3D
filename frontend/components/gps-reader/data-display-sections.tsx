import { styles } from "@/pages/topcon-gps-reader.styles";
import React from "react";
import { Text, View } from "react-native";

interface DataDisplaySectionsProps {
  gpsSummary: string;
  rtcmPackets: number;
  rtcmBytes: number;
  ntripActive: boolean;
  latestGgaSentenceAvailable: boolean;
  lastNmeaSentence: string;
  rawReceiverData: string;
  ntripHeaders: string;
}

export const DataDisplaySections = ({
  gpsSummary,
  rtcmPackets,
  rtcmBytes,
  ntripActive,
  latestGgaSentenceAvailable,
  lastNmeaSentence,
  rawReceiverData,
  ntripHeaders,
}: DataDisplaySectionsProps) => {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receiver status</Text>
        <Text style={styles.monoText}>{gpsSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RTCM forwarding</Text>
        <Text style={styles.monoText}>
          {`Packets: ${rtcmPackets}\nBytes: ${rtcmBytes}\nConnected: ${ntripActive ? "yes" : "no"}\nGGA source: ${
            latestGgaSentenceAvailable ? "available" : "missing"
          }`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last GGA / NMEA</Text>
        <Text style={styles.monoText}>
          {lastNmeaSentence || "Waiting for NMEA from the receiver..."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw receiver data</Text>
        <Text style={styles.monoText}>
          {rawReceiverData || "Waiting for raw data from the receiver..."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Caster response</Text>
        <Text style={styles.monoText}>
          {ntripHeaders || "No NTRIP headers received yet."}
        </Text>
      </View>
    </>
  );
};
