import { styles } from "@/pages/topcon-gps-reader.styles";
import React from "react";
import { Button, Text, TextInput, View } from "react-native";
import type { BluetoothDevice } from "react-native-bluetooth-classic";

interface ReceiverInitSectionProps {
  receiverInitCommand: string;
  onCommandChange: (command: string) => void;
  onSendCommand: (
    device: BluetoothDevice,
    command: string,
    statusMessage?: string,
  ) => Promise<boolean>;
  onStatusUpdate: (status: string) => void;
  connectedDeviceRef: React.MutableRefObject<BluetoothDevice | null>;
}

export const ReceiverInitSection = ({
  receiverInitCommand,
  onCommandChange,
  onSendCommand,
  onStatusUpdate,
  connectedDeviceRef,
}: ReceiverInitSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Receiver initialization</Text>
      <Text style={styles.hintText}>
        If the receiver requires a startup command to enable GGA output, put it
        here. The app sends it automatically after Bluetooth connects.
      </Text>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        value={receiverInitCommand}
        onChangeText={onCommandChange}
        placeholder="Example: em,,nmea/GGA:1"
        placeholderTextColor="#6b7280"
      />
       <Button
         title="Send init command now"
         onPress={() => {
           const device = connectedDeviceRef.current;
           if (!device) {
             onStatusUpdate("Connect the receiver before sending commands.");
             return;
           }

           onSendCommand(
             device,
             receiverInitCommand,
             "Receiver initialization command sent.",
           ).catch((error: unknown) => {
             onStatusUpdate(
               error instanceof Error
                 ? error.message
                 : "Failed to send the receiver initialization command.",
             );
           });
         }}
       />
    </View>
  );
};
