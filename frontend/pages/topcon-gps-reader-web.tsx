import { GGAData, isValidFix, parseGGA } from "@/utils/gps-helpers";
import React, { useEffect, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SimulatedLocation {
  lat: number;
  lon: number;
  alt: number;
  name: string;
}

// Przykładowe lokalizacje do testowania
const DEMO_LOCATIONS: SimulatedLocation[] = [
  {
    lat: 51.75714,
    lon: 19.45675,
    alt: 189.5,
    name: "🏛️ Łódź, Polska",
  },
  {
    lat: 52.2297,
    lon: 21.0122,
    alt: 78.2,
    name: "🏰 Warszawa, Polska",
  },
  {
    lat: 50.0647,
    lon: 14.4373,
    alt: 235.1,
    name: "🇨🇿 Praga, Czechy",
  },
  {
    lat: 50.1109,
    lon: 8.6821,
    alt: 112.8,
    name: "🏙️ Frankfurt, Niemcy",
  },
];

const TopconGPSReaderWeb = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [position, setPosition] = useState("Brak fiksa pozycji...");
  const [rawData, setRawData] = useState("");
  const [status, setStatus] = useState("Aplikacja demo - testowanie na web");
  const [currentLocation, setCurrentLocation] =
    useState<SimulatedLocation | null>(null);
  const [gpsData, setGpsData] = useState<GGAData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Generowanie zdania GGA z współrzędnych
  const generateGGASentence = (
    lat: number,
    lon: number,
    alt: number,
  ): string => {
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = (Math.abs(lat) - latDeg) * 60;
    const latStr =
      String(latDeg).padStart(2, "0") + latMin.toFixed(2).padStart(5, "0");
    const latDir = lat >= 0 ? "N" : "S";

    const lonDeg = Math.floor(Math.abs(lon));
    const lonMin = (Math.abs(lon) - lonDeg) * 60;
    const lonStr =
      String(lonDeg).padStart(3, "0") + lonMin.toFixed(2).padStart(5, "0");
    const lonDir = lon >= 0 ? "E" : "W";

    const time = new Date().toISOString().substring(11, 19).replace(/:/g, "");
    const fixQuality = "1"; // 1 = GPS fix
    const numSatellites = "12";
    const hdop = "1.2";
    const geoidHeight = "0.0";

    return `$GNGGA,${time},${latStr},${latDir},${lonStr},${lonDir},${fixQuality},${numSatellites},${hdop},${alt.toFixed(1)},,${geoidHeight}`;
  };

  // Symulacja odbierania danych
  const simulateDataReceived = (location: SimulatedLocation) => {
    const sentence = generateGGASentence(
      location.lat,
      location.lon,
      location.alt,
    );
    setRawData(sentence);

    const parsed = parseGGA(sentence);
    if (parsed && isValidFix(parsed)) {
      setGpsData(parsed);
      const pos = {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        altitude: parsed.altitude,
        accuracy: parsed.hdop,
        timestamp: new Date(),
      };

      const latDeg = Math.floor(Math.abs(pos.latitude));
      const latMin = (Math.abs(pos.latitude) - latDeg) * 60;
      const latDir = pos.latitude >= 0 ? "N" : "S";

      const lonDeg = Math.floor(Math.abs(pos.longitude));
      const lonMin = (Math.abs(pos.longitude) - lonDeg) * 60;
      const lonDir = pos.longitude >= 0 ? "E" : "W";

      setPosition(
        `Szerokość: ${latDeg}° ${latMin.toFixed(3)}' ${latDir}\n` +
          `Długość: ${lonDeg}° ${lonMin.toFixed(3)}' ${lonDir}\n` +
          `Wysokość: ${pos.altitude.toFixed(2)} m\n` +
          `Satelity: ${parsed.numSatellites}\n` +
          `HDOP: ${parsed.hdop.toFixed(1)}`,
      );
      setStatus("✓ Dane odebrane");
    }
  };

  // Symulacja periodycznego odbioru danych
  useEffect(() => {
    if (!isSimulating || !currentLocation) return;

    const interval = setInterval(() => {
      // Dodaj małe szumy do współrzędnych
      const noiseLat = (Math.random() - 0.5) * 0.0001;
      const noiseLon = (Math.random() - 0.5) * 0.0001;
      const noiseAlt = (Math.random() - 0.5) * 5;

      simulateDataReceived({
        ...currentLocation,
        lat: currentLocation.lat + noiseLat,
        lon: currentLocation.lon + noiseLon,
        alt: currentLocation.alt + noiseAlt,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, currentLocation]);

  const handleConnect = (location: SimulatedLocation) => {
    setCurrentLocation(location);
    setIsConnected(true);
    setIsSimulating(true);
    setStatus(`Połączono z: ${location.name}`);
    simulateDataReceived(location);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsSimulating(false);
    setCurrentLocation(null);
    setPosition("Rozłączono.");
    setRawData("");
    setStatus("Rozłączono");
    setGpsData(null);
  };

  const handleRandomMove = () => {
    if (isConnected && currentLocation) {
      // Przesuń na losową pozycję
      const randomLoc =
        DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
      setCurrentLocation(randomLoc);
      simulateDataReceived(randomLoc);
      setStatus(`Przeniesiono do: ${randomLoc.name}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📡 Topcon GPS - Wersja Demo (Web)</Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ To jest wersja testowa dla przeglądarki
        </Text>
        <Text style={styles.warningSubText}>
          Dane GPS są symulowane. Na urządzeniu Android będzie rzeczywiste
          Bluetooth.
        </Text>
      </View>

      {status && <Text style={styles.statusText}>{status}</Text>}

      {!isConnected ? (
        <>
          <Text style={styles.sectionTitle}>
            Wybierz lokalizację do testowania:
          </Text>

          {DEMO_LOCATIONS.map((location) => (
            <TouchableOpacity
              key={location.name}
              style={styles.deviceItem}
              onPress={() => handleConnect(location)}
            >
              <Text style={styles.deviceName}>{location.name}</Text>
              <Text style={styles.deviceAddress}>
                {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
              </Text>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <>
          <View style={styles.connectedHeader}>
            <Text style={styles.connectedText}>
              ✓ Połączono z: {currentLocation?.name}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="🔄 Przenieś na inną lokalizację"
              onPress={handleRandomMove}
              color="#1976d2"
            />
          </View>

          <View style={styles.spacer} />

          <Button
            title="❌ Rozłącz"
            color="#d32f2f"
            onPress={handleDisconnect}
          />

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

          {gpsData && (
            <View style={styles.infoBox}>
              <Text style={styles.boldText}>📊 Dane strukturalne:</Text>
              <Text style={styles.dataText}>
                {`Typ: ${gpsData.type}\n` +
                  `Czas UTC: ${gpsData.time}\n` +
                  `Pozycja: ${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}\n` +
                  `Wysokość: ${gpsData.altitude.toFixed(2)} m\n` +
                  `Satelity: ${gpsData.numSatellites}\n` +
                  `HDOP: ${gpsData.hdop.toFixed(2)}\n` +
                  `Jakość fixa: ${gpsData.fixQuality === 1 ? "GPS fix" : "Brak fixa"}`}
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.boldText}>ℹ️ Instrukcja testowania:</Text>
        <Text style={styles.instructionText}>
          {`1. Kliknij na dowolną lokalizację, aby symulować połączenie GPS\n` +
            `2. Aplikacja będzie generować zdania NMEA GGA\n` +
            `3. Dane będą się uaktualniać co 2 sekundy z małym szumem\n` +
            `4. Kliknij "Przenieś" aby testować różne pozycje\n` +
            `5. Dla rzeczywistego testu na Android - użyj Development Build`}
        </Text>
      </View>
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
    marginBottom: 16,
    textAlign: "center",
    color: "#1976d2",
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
  },
  warningSubText: {
    fontSize: 12,
    color: "#856404",
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    color: "#0d47a1",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  deviceItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
    borderRadius: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deviceAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  buttonStyle: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
  } as React.CSSProperties,
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  buttonSubText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 10,
  },
  spacer: {
    height: 12,
  },
  moveButton: {
    backgroundColor: "#e3f2fd",
  },
  disconnectButton: {
    backgroundColor: "#ffebee",
  },
  connectedHeader: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    marginTop: 16,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  boldText: {
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 14,
    color: "#1976d2",
  },
  positionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    fontFamily: "System",
  },
  rawText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#555",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
  },
  dataText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 12,
    color: "#555",
    lineHeight: 20,
  },
});

export default TopconGPSReaderWeb;
