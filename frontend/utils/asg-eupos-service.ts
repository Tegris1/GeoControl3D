/**
 * ASG EUPOS Configuration Service
 * Zarządzanie konfiguracją dostępu do sieci ASG EUPOS
 */

import { ASGEUPOSConfig, validateNTRIPConfig } from "./ntrip-config";

const STORAGE_KEY = "asg_eupos_config";

export class ASGEUPOSService {
  /**
   * Zapisanie konfiguracji do AsyncStorage (na urządzeniu)
   */
  static async saveConfig(config: ASGEUPOSConfig): Promise<void> {
    const validation = validateNTRIPConfig(config);
    if (!validation.valid) {
      throw new Error(`Konfiguracja nieważna: ${validation.errors.join(", ")}`);
    }

    if (typeof localStorage !== "undefined") {
      // Web
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } else {
      // React Native - będzie potrzebne AsyncStorage
      // import AsyncStorage from '@react-native-async-storage/async-storage';
      // await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }

  /**
   * Wczytanie konfiguracji
   */
  static async loadConfig(): Promise<ASGEUPOSConfig | null> {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (error) {
      console.error("Błąd wczytywania konfiguracji ASG EUPOS:", error);
      return null;
    }
  }

  /**
   * Usunięcie konfiguracji
   */
  static async clearConfig(): Promise<void> {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Testowanie połączenia NTRIP
   * (W rzeczywistości byłoby na backendzie)
   */
  static async testConnection(config: ASGEUPOSConfig): Promise<boolean> {
    try {
      const encodedAuth = Buffer.from(
        `${config.username}:${config.password}`,
      ).toString("base64");

      const response = await fetch(
        `http://${config.ntripServer}:${config.ntripPort}/${config.mountpoint}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${encodedAuth}`,
            "Ntrip-Version": "Ntrip/2.0",
          },
        },
      );

      return response.status === 200;
    } catch (error) {
      console.error("Błąd testowania połączenia NTRIP:", error);
      return false;
    }
  }
}

/**
 * Obliczenie najbliższego punktu ASG EUPOS
 * na podstawie bieżącej pozycji
 */
export function findNearestASGPoint(
  latitude: number,
  longitude: number,
): string {
  // Przybliżone współrzędne głównych punktów ASG EUPOS
  const points = {
    WRZ0: { lat: 51.1, lon: 17.0, city: "Wrocław" },
    WAW0: { lat: 52.2, lon: 21.0, city: "Warszawa" },
    KRK0: { lat: 50.0, lon: 19.9, city: "Kraków" },
    GDA0: { lat: 54.4, lon: 18.6, city: "Gdańsk" },
    POZ0: { lat: 52.4, lon: 16.9, city: "Poznań" },
  };

  let nearest = "WAW0";
  let minDistance = Infinity;

  for (const [mountpoint, point] of Object.entries(points)) {
    const distance = Math.sqrt(
      Math.pow(latitude - point.lat, 2) + Math.pow(longitude - point.lon, 2),
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = mountpoint;
    }
  }

  return nearest;
}
