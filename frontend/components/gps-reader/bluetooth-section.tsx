import { styles } from "@/pages/topcon-gps-reader.styles";
import React from "react";
import { Button, FlatList, Text, TouchableOpacity, View } from "react-native";
import type { BluetoothDevice } from "react-native-bluetooth-classic";

interface BluetoothSectionProps {
  bluetoothStatus: string;
  connectedDevice: BluetoothDevice | null;
  devices: BluetoothDevice[];
  onLoadDevices: () => void;
  onConnect: (device: BluetoothDevice) => void;
  onDisconnect: () => void;
}

export const BluetoothSection = ({
  bluetoothStatus,
  connectedDevice,
  devices,
  onLoadDevices,
  onConnect,
  onDisconnect,
}: BluetoothSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bluetooth</Text>
      <Text style={styles.statusText}>{bluetoothStatus}</Text>

      {!connectedDevice ? (
        <>
          <Button title="Load paired devices" onPress={onLoadDevices} />
          {devices.length > 0 ? (
            <FlatList
              data={devices}
              scrollEnabled={false}
              keyExtractor={(item, index) => item.address || String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deviceItem}
                  onPress={() => onConnect(item)}
                >
                  <Text style={styles.deviceName}>
                    {item.name || "Unnamed device"}
                  </Text>
                  <Text style={styles.deviceAddress}>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.hintText}>
              Pair the receiver in Android settings first, then load bonded
              devices here.
            </Text>
          )}
        </>
      ) : (
        <View style={styles.connectedRow}>
          <View style={styles.connectedDetails}>
            <Text style={styles.connectedText}>
              Connected: {connectedDevice.name || connectedDevice.address}
            </Text>
            <Text style={styles.deviceAddress}>{connectedDevice.address}</Text>
          </View>
          <Button title="Disconnect" color="#b3261e" onPress={onDisconnect} />
        </View>
      )}
    </View>
  );
};
