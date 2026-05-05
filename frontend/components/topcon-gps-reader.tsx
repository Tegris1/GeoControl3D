import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  BluetoothSection,
  DataDisplaySections,
  NtripConfigSection,
  ReceiverInitSection,
  RtkPipelineSection,
} from "./gps-reader";
import { formatGpsSummary } from "../utils/gps-reader-formatters";
import { useTopconGpsReader } from "../hooks/use-topcon-gps-reader";
import { styles } from "./topcon-gps-reader.styles";


export default function TopconGPSReader() {
  const {
    // Bluetooth state
    devices,
    connectedDevice,
    bluetoothStatus,
    lastNmeaSentence,
    rawReceiverData,
    
    // GPS state
    gpsData,
    
    // NTRIP state
    ntripUsername,
    ntripPassword,
    ntripServer,
    ntripPortText,
    ntripMountpoint,
    ntripStatus,
    ntripActive,
    ntripHeaders,
    ntripError,
    rtcmPackets,
    rtcmBytes,
    
    // Receiver init state
    receiverInitCommand,

    // State setters
    setNtripUsername,
    setNtripPassword,
    setNtripServer,
    setNtripPortText,
    setNtripMountpoint,
    setReceiverInitCommand,
    setBluetoothStatus,

    // Bluetooth operations
    getPairedDevices,
    connectToDevice,
    disconnectDevice,
    
    // Receiver operations
    sendReceiverCommand,
    
    // NTRIP operations
    startNtrip,
    stopNtrip,

    // Refs
    connectedDeviceRef,
    latestGgaSentenceRef,
  } = useTopconGpsReader();

  const gpsSummary = useMemo(() => formatGpsSummary(gpsData), [gpsData]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Topcon HiPer II</Text>
      <Text style={styles.subheader}>
        Bluetooth RFCOMM + ASG-EUPOS NTRIP forwarding
      </Text>

      <BluetoothSection
        bluetoothStatus={bluetoothStatus}
        connectedDevice={connectedDevice}
        devices={devices}
        onLoadDevices={getPairedDevices}
        onConnect={connectToDevice}
        onDisconnect={disconnectDevice}
      />

      <ReceiverInitSection
        receiverInitCommand={receiverInitCommand}
        onCommandChange={setReceiverInitCommand}
        onSendCommand={sendReceiverCommand}
        onStatusUpdate={setBluetoothStatus}
        connectedDeviceRef={connectedDeviceRef}
      />

      <NtripConfigSection
        ntripStatus={ntripStatus}
        ntripServer={ntripServer}
        ntripPort={ntripPortText}
        ntripUsername={ntripUsername}
        ntripPassword={ntripPassword}
        ntripMountpoint={ntripMountpoint}
        ntripError={ntripError}
        ntripActive={ntripActive}
        onServerChange={setNtripServer}
        onPortChange={setNtripPortText}
        onUsernameChange={setNtripUsername}
        onPasswordChange={setNtripPassword}
        onMountpointChange={setNtripMountpoint}
        onSelectPreset={(mountpoint: string, port: number) => {
          setNtripMountpoint(mountpoint);
          setNtripPortText(String(port));
        }}
        onStartNtrip={startNtrip}
        onStopNtrip={() => {
          void stopNtrip("NTRIP stopped by the user.");
        }}
      />

      <RtkPipelineSection
        ntripActive={ntripActive}
        rtcmPackets={rtcmPackets}
        rtcmBytes={rtcmBytes}
        gpsData={gpsData}
      />

      <DataDisplaySections
        gpsSummary={gpsSummary}
        rtcmPackets={rtcmPackets}
        rtcmBytes={rtcmBytes}
        ntripActive={ntripActive}
        latestGgaSentenceAvailable={!!latestGgaSentenceRef.current}
        lastNmeaSentence={lastNmeaSentence}
        rawReceiverData={rawReceiverData}
        ntripHeaders={ntripHeaders}
      />
    </ScrollView>
  );
}
