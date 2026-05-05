export interface ASGEUPOSConfig {
  username: string;
  password: string;
  ntripServer: string;
  ntripPort: number;
  mountpoint: string;
}

export interface ASGEUPOSMountpointPreset {
  key: string;
  mountpoint: string;
  port: number;
  requiresGga: boolean;
  label: string;
  description: string;
}

export const ASG_EUPOS_DEFAULT_CONFIG: Omit<ASGEUPOSConfig, "username" | "password"> = {
  ntripServer: "91.198.76.2",
  ntripPort: 2101,
  mountpoint: "RTN_VRS_3_1",
};

export const ASG_EUPOS_MOUNTPOINT_PRESETS: ASGEUPOSMountpointPreset[] = [
  {
    key: "rtn-vrs",
    mountpoint: "RTN_VRS_3_1",
    port: 2101,
    requiresGga: true,
    label: "RTN VRS 3.1",
    description: "Network RTK, GPS+GLONASS, requires rover GGA.",
  },
  {
    key: "rtn-mac",
    mountpoint: "RTN_MAC_3_1",
    port: 2101,
    requiresGga: true,
    label: "RTN MAC 3.1",
    description: "Network RTK, GPS+GLONASS, requires rover GGA.",
  },
  {
    key: "rtn-fkp",
    mountpoint: "RTN_FKP_3_1",
    port: 2101,
    requiresGga: true,
    label: "RTN FKP 3.1",
    description: "Network RTK, GPS+GLONASS, requires rover GGA.",
  },
];

export function getMountpointPreset(
  mountpoint: string,
): ASGEUPOSMountpointPreset | undefined {
  return ASG_EUPOS_MOUNTPOINT_PRESETS.find(
    (preset) => preset.mountpoint === mountpoint,
  );
}

export function validateNTRIPConfig(config: ASGEUPOSConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.username.trim()) errors.push("Username is required.");
  if (!config.password.trim()) errors.push("Password is required.");
  if (!config.ntripServer.trim()) errors.push("Caster host is required.");
  if (!config.mountpoint.trim()) errors.push("Mountpoint is required.");
  if (!Number.isInteger(config.ntripPort) || config.ntripPort < 1 || config.ntripPort > 65535) {
    errors.push("Port must be between 1 and 65535.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
