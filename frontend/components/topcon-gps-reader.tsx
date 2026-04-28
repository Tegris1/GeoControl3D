import React, { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { ASGEUPOSService } from "../utils/asg-eupos-service";
import {
  ASG_EUPOS_DEFAULTS,
  TopconHiper2Commands,
  type ASGEUPOSConfig,
} from "../utils/ntrip-config";

const TopconGPSReader = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);
  const [position, setPosition] = useState("Brak fiksa pozycji...");
  const [rawData, setRawData] = useState("");
  const [status, setStatus] = useState("");

  // Konfiguracja NTRIP
  const [showNTRIPConfig, setShowNTRIPConfig] = useState(false);
  const [ntripUsername, setNtripUsername] = useState("");
  const [ntripPassword, setNtripPassword] = useState("");
  const [ntripServer, setNtripServer] = useState("asg-eupos.geonet.pl");
  const [ntripMountpoint, setNtripMountpoint] = useState("WAW0");
  const [rtcmData, setRtcmData] = useState("");
  const [rtkActive, setRtkActive] = useState(false);

  // Prośba o uprawnienia (wymagane w Androidzie)
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          if (
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
              PermissionsAndroid.RESULTS.GRANTED
          ) {
            setStatus("✓ Uprawnienia przyznane");
          } else {
            setStatus("✗ Uprawnienia odrzucone");
          }
        } catch (err) {
          console.error("Błąd podczas requestowania uprawnień:", err);
          setStatus("✗ Błąd uprawnień");
        }
      }
    };
    requestPermissions();
  }, []);

  // Wyszukiwanie sparowanych urządzeń
  const getPairedDevices = async () => {
    try {
      setStatus("Wyszukuję urządzenia...");
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);
      setStatus(`Znaleziono ${paired.length} urządzeń`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Błąd pobierania urządzeń:", err);
      setStatus(`✗ Błąd: ${errorMsg}`);
    }
  };

  // Łączenie z wybranym odbiornikiem
  const connectToDevice = async (device: any) => {
    try {
      setStatus("Łączę...");

      if (device.connect) {
        const connection = await device.connect({
          connectorType: "rfcomm",
          DELIMITER: "\n",
        });

        if (connection) {
          setConnectedDevice(device);
          setStatus(`✓ Połączono z ${device.name}`);
          startReadingData(device);
        } else {
          setStatus("✗ Nie udało się połączyć");
        }
      } else {
        setStatus("✗ Urządzenie nie obsługuje połączenia");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Błąd połączenia:", err);
      setStatus(`✗ Błąd: ${errorMsg}`);
    }
  };

  // Rozpoczęcie nasłuchiwania danych NMEA
  const startReadingData = (device: any) => {
    try {
      if (!device.onDataReceived) {
        console.warn("Urządzenie nie obsługuje onDataReceived");
        return;
      }

      device.onDataReceived((data: any) => {
        try {
          // Bezpieczny dostęp do danych - obsługa różnych formatów
          const line = data?.data?.trim?.() || String(data).trim();
          setRawData(line);

          // Prosty parser dla NMEA GGA
          if (line.startsWith("$GPGGA") || line.startsWith("$GNGGA")) {
            const parts = line.split(",");

            // Sprawdzenie, czy pozycja jest poprawnie ustalona (parts[6] > 0)
            if (parts.length > 9 && parts[2] && parts[4] && parts[6] !== "0") {
              const lat = parts[2] + " " + parts[3];
              const lon = parts[4] + " " + parts[5];
              const alt = parts[9] + " m";
              const satellites = parts[7];
              const hdop = parts[8];

              setPosition(
                `Szerokość: ${lat}\nDługość: ${lon}\nWysokość: ${alt}\nSatellity: ${satellites}\nHDOP: ${hdop}`,
              );
              setStatus("✓ Fiks aktywny");
            } else {
              setPosition("Śledzenie satelitów (oczekiwanie na fiks)...");
              setStatus("○ Synchronizacja");
            }
          }
        } catch (parseErr) {
          console.error("Błąd parsowania linii NMEA:", parseErr);
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Błąd nasłuchiwania:", err);
      setStatus(`✗ Błąd nasłuchiwania: ${errorMsg}`);
    }
  };

  // Rozłączanie
  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        // Deaktywuj RTK
        if (rtkActive) {
          try {
            await deactivateRTK();
          } catch (rtkErr) {
            console.error("Błąd deaktywacji RTK:", rtkErr);
          }
        }

        // Rozłącz Bluetooth
        if (connectedDevice.disconnect) {
          await connectedDevice.disconnect();
        }

        setConnectedDevice(null);
        setPosition("Rozłączono.");
        setRawData("");
        setStatus("Rozłączono");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("Błąd podczas rozłączania:", err);
        setStatus(`✗ Błąd rozłączania: ${errorMsg}`);
      }
    }
  };

  // Wysyłanie komendy do odbiornika
  const sendCommand = async (command: string) => {
    if (!connectedDevice) {
      setStatus("✗ Urządzenie nie podłączone");
      return;
    }

    try {
      if (connectedDevice.write) {
        await connectedDevice.write(command);
        setStatus(`📤 Wysłano komendę`);
        console.log("Wysłana komenda:", command);
      } else {
        setStatus("✗ Urządzenie nie obsługuje wysyłania");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Błąd wysyłania komendy:", err);
      setStatus(`✗ Błąd wysyłania: ${errorMsg}`);
    }
  };

  // Aktywacja RTK z konfiguracją NTRIP
  const activateRTK = async () => {
    if (!ntripUsername || !ntripPassword) {
      setStatus("✗ Podaj login i hasło do ASG EUPOS");
      return;
    }

    try {
      setStatus("⚙️ Konfiguracja RTK...");

      const config: ASGEUPOSConfig = {
        username: ntripUsername,
        password: ntripPassword,
        ntripServer,
        ntripPort: 2101,
        mountpoint: ntripMountpoint,
      };

      // Zapisz konfigurację
      await ASGEUPOSService.saveConfig(config);

      // Wyślij komendy konfiguracyjne
      const commands = TopconHiper2Commands.getRTKActivationCommand(config);

      for (const cmd of commands) {
        await sendCommand(cmd);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Czekaj między komendami
      }

      setRtkActive(true);
      setStatus("✓ RTK aktywny - oczekiwanie na poprawki");
    } catch (err) {
      console.error("Błąd aktywacji RTK:", err);
      setStatus(
        `✗ Błąd: ${err instanceof Error ? err.message : "Nieznany błąd"}`,
      );
    }
  };

  // Deaktywacja RTK
  const deactivateRTK = async () => {
    try {
      const command = TopconHiper2Commands.getRTKDeactivationCommand();
      await sendCommand(command);
      setRtkActive(false);
      setStatus("✓ RTK wyłączony");
    } catch (err) {
      console.error("Błąd deaktywacji RTK:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📡 Topcon GPS (Bluetooth)</Text>

      {status && <Text style={styles.statusText}>{status}</Text>}

      {!connectedDevice ? (
        <>
          <Button
            title="🔍 Szukaj sparowanych urządzeń"
            onPress={getPairedDevices}
          />

          {devices.length > 0 ? (
            <FlatList
              data={devices}
              scrollEnabled={false}
              keyExtractor={(item, index) => item.address || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deviceItem}
                  onPress={() => connectToDevice(item)}
                >
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceAddress}>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noDevicesText}>Brak urządzeń</Text>
          )}
        </>
      ) : (
        <>
          <View style={styles.connectedHeader}>
            <Text style={styles.connectedText}>
              ✓ Połączono z: {connectedDevice.name}
            </Text>
            <Button
              title="Rozłącz"
              color="#d32f2f"
              onPress={disconnectDevice}
            />
          </View>

          {/* Konfiguracja RTK/NTRIP */}
          <View style={styles.rtkConfigBox}>
            <Text style={styles.boldText}>🛰️ Konfiguracja RTK (ASG EUPOS)</Text>

            {!rtkActive ? (
              <>
                <Text style={styles.configLabel}>Login ASG EUPOS:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Użytkownik"
                  value={ntripUsername}
                  onChangeText={setNtripUsername}
                  placeholderTextColor="#999"
                />

                <Text style={styles.configLabel}>Hasło:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Hasło"
                  value={ntripPassword}
                  onChangeText={setNtripPassword}
                  secureTextEntry
                  placeholderTextColor="#999"
                />

                <Text style={styles.configLabel}>
                  Punkt montażu (Mountpoint):
                </Text>
                <View style={styles.mountpointContainer}>
                  {Object.keys(ASG_EUPOS_DEFAULTS).map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.mountpointButton,
                        ntripMountpoint ===
                          ASG_EUPOS_DEFAULTS[
                            key as keyof typeof ASG_EUPOS_DEFAULTS
                          ].mountpoint && styles.mountpointButtonActive,
                      ]}
                      onPress={() =>
                        setNtripMountpoint(
                          ASG_EUPOS_DEFAULTS[
                            key as keyof typeof ASG_EUPOS_DEFAULTS
                          ].mountpoint!,
                        )
                      }
                    >
                      <Text style={styles.mountpointButtonText}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title="✓ Aktywuj RTK"
                  onPress={activateRTK}
                  color="#4caf50"
                />
              </>
            ) : (
              <>
                <Text style={styles.rtkActiveText}>
                  ✓ RTK aktywny - Mountpoint: {ntripMountpoint}
                </Text>
                <Button
                  title="✗ Wyłącz RTK"
                  onPress={deactivateRTK}
                  color="#d32f2f"
                />
              </>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.boldText}>📍 Pozycja:</Text>
            <Text style={styles.positionText}>{position}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.boldText}>📡 Ostatnia ramka NMEA:</Text>
            <Text style={styles.rawText}>
              {rawData || "Oczekiwanie na dane..."}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  statusText: {
    fontSize: 14,
    color: "#1976d2",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
  },
  deviceItem: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 5,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#1976d2",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deviceAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  noDevicesText: {
    fontSize: 14,
    color: "#999",
    marginVertical: 20,
    textAlign: "center",
  },
  connectedHeader: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 4,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  connectedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  rtkConfigBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 4,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginTop: 8,
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mountpointContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  mountpointButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    borderRadius: 4,
    margin: 4,
  },
  mountpointButtonActive: {
    backgroundColor: "#ff9800",
    borderColor: "#ff9800",
  },
  mountpointButtonText: {
    fontSize: 12,
    color: "#333",
  },
  rtkActiveText: {
    fontSize: 14,
    color: "#4caf50",
    marginBottom: 10,
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 4,
    marginVertical: 10,
  },
  positionText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
    fontFamily: "monospace",
  },
  rawText: {
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
  },
});

export default TopconGPSReader;
