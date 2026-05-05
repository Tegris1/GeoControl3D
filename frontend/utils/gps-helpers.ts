/**
 * GPS/NMEA Helper Functions
 * Obsługa parsowania i konwersji danych NMEA 0183
 */

// Interfejsy dla typów danych GPS
export interface NMEAData {
  raw: string;
  type: "GGA" | "RMC" | "GSA" | "GSV" | "UNKNOWN";
}

export interface GGAData extends NMEAData {
  type: "GGA";
  time: string; // UTC time HHMMSS.SS
  latitude: number; // w stopniach dziesiętnych
  latitudeDir: "N" | "S";
  longitude: number; // w stopniach dziesiętnych
  longitudeDir: "E" | "W";
  fixQuality: number; // 0=invalid, 1=GPS fix, 2=DGPS fix
  numSatellites: number;
  hdop: number; // Horizontal Dilution of Precision
  altitude: number; // w metrach
  geoidHeight: number; // Wysokość geoidy
}

export interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy?: number;
  timestamp: Date;
}

/**
 * Konwersja współrzędnych NMEA na stopnie dziesiętne
 * @param coord - Współrzędna w formacie NMEA (np. "5134.58" dla 51°34.58')
 * @param direction - Kierunek (N, S, E, W) */
export function convertNMEACoordinate(
  coord: string,
  direction: "N" | "S" | "E" | "W",
): number {
  if (!coord) return 0;

  const isLatitude = direction === "N" || direction === "S";
  const degrees = parseInt(coord.substring(0, isLatitude ? 2 : 3));
  const minutes = parseFloat(coord.substring(isLatitude ? 2 : 3));

  let decimal = degrees + minutes / 60;

  if (direction === "S" || direction === "W") {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Parsowanie zdania GGA
 * @param sentence - Pełne zdanie GGA (z $GPGGA lub $GNGGA na początku)
 */
export function parseGGA(sentence: string): GGAData | null {
  try {
    const line = sentence.trim();
    const ggaStart = line.search(/\$..GGA,/);

    if (ggaStart < 0) {
      return null;
    }

    const normalized = line.slice(ggaStart);
    const parts = normalized.split(",");

    if (parts.length < 10) {
      return null;
    }

    const fixQuality = parseInt(parts[6]) || 0;
    const latitude = convertNMEACoordinate(parts[2], parts[3] as "N" | "S");
    const longitude = convertNMEACoordinate(parts[4], parts[5] as "E" | "W");

    return {
      raw: normalized,
      type: "GGA",
      time: parts[1],
      latitude,
      latitudeDir: parts[3] as "N" | "S",
      longitude,
      longitudeDir: parts[5] as "E" | "W",
      fixQuality,
      numSatellites: parseInt(parts[7]) || 0,
      hdop: parseFloat(parts[8]) || 0,
      altitude: parseFloat(parts[9]) || 0,
      geoidHeight: parseFloat(parts[11]) || 0,
    };
  } catch (error) {
    console.error("Błąd parsowania GGA:", error);
    return null;
  }
}

/**
 * Konwersja GGAData na Position
 */
export function ggaToPosition(ggaData: GGAData): Position {
  return {
    latitude: ggaData.latitude,
    longitude: ggaData.longitude,
    altitude: ggaData.altitude,
    accuracy: ggaData.hdop,
    timestamp: new Date(),
  };
}

/**
 * Formatowanie pozycji do wyświetlenia
 */
export function formatPosition(position: Position): string {
  const latDir = position.latitude >= 0 ? "N" : "S";
  const lonDir = position.longitude >= 0 ? "E" : "W";

  const latAbs = Math.abs(position.latitude);
  const lonAbs = Math.abs(position.longitude);

  const latDeg = Math.floor(latAbs);
  const latMin = (latAbs - latDeg) * 60;

  const lonDeg = Math.floor(lonAbs);
  const lonMin = (lonAbs - lonDeg) * 60;

  return (
    `${latDeg}° ${latMin.toFixed(3)}' ${latDir}\n` +
    `${lonDeg}° ${lonMin.toFixed(3)}' ${lonDir}\n` +
    `Alt: ${position.altitude.toFixed(2)} m`
  );
}

/**
 * Sprawdzenie, czy pozycja jest ważna
 */
export function isValidFix(ggaData: GGAData): boolean {
  return ggaData.fixQuality > 0 && ggaData.numSatellites >= 4;
}

export function getFixQualityLabel(fixQuality: number): string {
  switch (fixQuality) {
    case 0:
      return "No fix";
    case 1:
      return "Autonomous GPS";
    case 2:
      return "DGPS";
    case 4:
      return "RTK Fixed";
    case 5:
      return "RTK Float";
    default:
      return `Fix ${fixQuality}`;
  }
}

/**
 * Obliczenie odległości między dwoma punktami (przybliżenie Haversine)
 * @param lat1, lon1 - Punkt początkowy
 * @param lat2, lon2 - Punkt docelowy
 * @returns Odległość w metrach
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Promień Ziemi w metrach
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) *
      Math.cos(rad2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
