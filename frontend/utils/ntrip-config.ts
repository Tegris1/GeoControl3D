/**
 * ASG EUPOS NTRIP Configuration Module
 * Obsługa wysyłania poprawek RTK do odbiornika Topcon Hiper2
 */

export interface ASGEUPOSConfig {
  username: string; // Login do ASG EUPOS
  password: string; // Hasło
  ntripServer: string; // Host NTRIP (np. "asg-eupos.geonet.pl")
  ntripPort: number; // Port (zwykle 2101)
  mountpoint: string; // Punkt montażu (np. "WRZ0" dla Wrocławia)
  latitude?: number; // Szerokość dla wybrania najbliższego punktu
  longitude?: number; // Długość dla wybrania najbliższego punktu
}

/**
 * Domyślne konfiguracje dla ASG EUPOS
 */
export const ASG_EUPOS_DEFAULTS: Record<string, Partial<ASGEUPOSConfig>> = {
  wroclaw: {
    ntripServer: "asg-eupos.geonet.pl",
    ntripPort: 2101,
    mountpoint: "WRZ0",
  },
  warsaw: {
    ntripServer: "asg-eupos.geonet.pl",
    ntripPort: 2101,
    mountpoint: "WAW0",
  },
  krakow: {
    ntripServer: "asg-eupos.geonet.pl",
    ntripPort: 2101,
    mountpoint: "KRK0",
  },
  gdansk: {
    ntripServer: "asg-eupos.geonet.pl",
    ntripPort: 2101,
    mountpoint: "GDA0",
  },
  poznan: {
    ntripServer: "asg-eupos.geonet.pl",
    ntripPort: 2101,
    mountpoint: "POZ0",
  },
};

/**
 * Topcon Hiper2 Configuration Commands
 * Komendy do konfiguracji odbiornika dla RTK
 */

export class TopconHiper2Commands {
  /**
   * Polecenie aktywacji trybu RTK
   * Wysyła do odbiornika żądanie aktywacji RTK i konfiguracji NTRIP
   */
  static getRTKActivationCommand(config: ASGEUPOSConfig): string[] {
    const commands: string[] = [];

    // 1. Konfiguracja serwera NTRIP
    commands.push(
      `$PASHS,NMX,RTCM,{\"RTCM\":{\"Enabled\":true,\"Base\":\"${config.ntripServer}\",\"Port\":${config.ntripPort},\"Mountpoint\":\"${config.mountpoint}\",\"User\":\"${config.username}\",\"Pass\":\"${config.password}\",\"Version\":\"RTCM32\",\"Rate\":1000}}*00`,
    );

    // 2. Polecenie aktywacji RTK (Topcon proprietary)
    commands.push("$PASHS,NMX,RTK,ACTIVATE*00");

    // 3. Żądanie włączenia liczby satelitów (GSV sentence)
    commands.push("$PASHS,NMX,NMEA,GSV,1*00");

    // 4. Żądanie włączenia statusu RTK (RMC sentence)
    commands.push("$PASHS,NMX,NMEA,RMC,1*00");

    // 5. Ustaw częstotliwość wyjścia NMEA na 1 Hz
    commands.push("$PASHS,NMX,NMEA,RATE,1000*00");

    return commands;
  }

  /**
   * Polecenie deaktywacji RTK
   */
  static getRTKDeactivationCommand(): string {
    return "$PASHS,NMX,RTK,DEACTIVATE*00";
  }

  /**
   * Polecenie sprawdzenia statusu RTK
   */
  static getRTKStatusCommand(): string {
    return "$PASHS,NMX,RTK,STATUS*00";
  }

  /**
   * Polecenie zresetowania odbiornika
   */
  static getResetCommand(): string {
    return "$PASHS,NMX,RESET*00";
  }

  /**
   * Polecenie dla Topcon aby włączył GPS + GLONASS
   */
  static getGNSSConfigCommand(): string {
    return '$PASHS,NMX,CONSTELLATIONS,{"GPS":true,"GLONASS":true,"Galileo":false,"BeiDou":false}*00';
  }
}

/**
 * Parsowanie statusu RTK z odpowiedzi odbiornika
 */
export function parseRTKStatus(response: string): {
  isActive: boolean;
  fixType: "float" | "fixed" | "none";
  satellites: number;
  baselineLength?: number;
} {
  return {
    isActive: response.includes("ACTIVATE"),
    fixType: response.includes("FIXED")
      ? "fixed"
      : response.includes("FLOAT")
        ? "float"
        : "none",
    satellites: parseInt(response.match(/,(\d+),/) ? RegExp.$1 : "0"),
  };
}

/**
 * Walidacja konfiguracji NTRIP
 */
export function validateNTRIPConfig(config: ASGEUPOSConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.username) errors.push("Username jest wymagany");
  if (!config.password) errors.push("Password jest wymagany");
  if (!config.ntripServer) errors.push("NTRIP server jest wymagany");
  if (!config.mountpoint) errors.push("Mountpoint jest wymagany");
  if (config.ntripPort < 1 || config.ntripPort > 65535)
    errors.push("Port musi być w zakresie 1-65535");

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Kodowanie kredencjałów dla NTRIP (Base64)
 */
export function encodeNTRIPCredentials(
  username: string,
  password: string,
): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString("base64");
}
