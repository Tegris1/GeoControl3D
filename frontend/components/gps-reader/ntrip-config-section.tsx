import { styles } from "@/pages/topcon-gps-reader.styles";
import {
  ASG_EUPOS_MOUNTPOINT_PRESETS,
  getMountpointPreset,
} from "@/utils/ntrip-config";
import React, { useMemo } from "react";
import { Button, Text, TextInput, TouchableOpacity, View } from "react-native";

interface NtripConfigSectionProps {
  ntripStatus: string;
  ntripServer: string;
  ntripPort: string;
  ntripUsername: string;
  ntripPassword: string;
  ntripMountpoint: string;
  ntripError: string;
  ntripActive: boolean;
  onServerChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onMountpointChange: (value: string) => void;
  onSelectPreset: (mountpoint: string, port: number) => void;
  onStartNtrip: () => void;
  onStopNtrip: () => void;
}

export const NtripConfigSection = ({
  ntripStatus,
  ntripServer,
  ntripPort,
  ntripUsername,
  ntripPassword,
  ntripMountpoint,
  ntripError,
  ntripActive,
  onServerChange,
  onPortChange,
  onUsernameChange,
  onPasswordChange,
  onMountpointChange,
  onSelectPreset,
  onStartNtrip,
  onStopNtrip,
}: NtripConfigSectionProps) => {
  const selectedPreset = useMemo(
    () => getMountpointPreset(ntripMountpoint),
    [ntripMountpoint],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>NTRIP</Text>
      <Text style={styles.statusText}>{ntripStatus}</Text>

      <Text style={styles.label}>ASG-EUPOS host</Text>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        value={ntripServer}
        onChangeText={onServerChange}
        placeholder="91.198.76.2"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Port</Text>
      <TextInput
        style={styles.textInput}
        value={ntripPort}
        onChangeText={onPortChange}
        placeholder="2101"
        keyboardType="numeric"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        value={ntripUsername}
        onChangeText={onUsernameChange}
        placeholder="ASG-EUPOS login"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={ntripPassword}
        onChangeText={onPasswordChange}
        placeholder="ASG-EUPOS password"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Recommended mountpoints for port 2101</Text>
      <View style={styles.presetGrid}>
        {ASG_EUPOS_MOUNTPOINT_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.key}
            style={[
              styles.presetButton,
              ntripMountpoint === preset.mountpoint &&
                styles.presetButtonActive,
            ]}
            onPress={() => onSelectPreset(preset.mountpoint, preset.port)}
          >
            <Text
              style={[
                styles.presetButtonText,
                ntripMountpoint === preset.mountpoint &&
                  styles.presetButtonTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Mountpoint</Text>
      <TextInput
        style={styles.textInput}
        autoCapitalize="characters"
        autoCorrect={false}
        value={ntripMountpoint}
        onChangeText={onMountpointChange}
        placeholder="RTN_VRS_3_1"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.hintText}>
        {selectedPreset?.description ??
          "Custom mountpoint selected. For ASG-EUPOS RTN streams on port 2101 the caster expects rover GGA."}
      </Text>

      {!ntripActive ? (
        <Button title="Start NTRIP" onPress={onStartNtrip} color="#1b7f3b" />
      ) : (
        <Button title="Stop NTRIP" onPress={onStopNtrip} color="#b3261e" />
      )}

      {ntripError ? <Text style={styles.errorText}>{ntripError}</Text> : null}
    </View>
  );
};
