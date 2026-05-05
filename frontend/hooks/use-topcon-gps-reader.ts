import { Buffer } from "buffer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  type EmitterSubscription,
} from "react-native";
import RNBluetoothClassic, {
  type BluetoothDevice,
  type BluetoothEventSubscription,
} from "react-native-bluetooth-classic";
import {
  getFixQualityLabel,
  isValidFix,
  parseGGA,
  type GGAData,
} from "@/utils/gps-helpers";
import { NtripClient } from "@/utils/ntrip-client";
import {
  ASG_EUPOS_DEFAULT_CONFIG,
  validateNTRIPConfig,
} from "@/utils/ntrip-config";
import { extractSentenceCandidates } from "@/utils/gps-reader-formatters";

const USER_AGENT = "TopconFrontend/1.0";
const GGA_PUSH_INTERVAL_MS = 5000;
const RAW_RECEIVER_LOG_LIMIT = 12000;

interface UseTopconGpsReaderReturn {
  // Bluetooth state
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  bluetoothStatus: string;
  lastNmeaSentence: string;
  rawReceiverData: string;
  
  // GPS state
  gpsData: GGAData | null;
  
  // NTRIP state
  ntripUsername: string;
  ntripPassword: string;
  ntripServer: string;
  ntripPortText: string;
  ntripMountpoint: string;
  ntripStatus: string;
  ntripActive: boolean;
  ntripHeaders: string;
  ntripError: string;
  rtcmPackets: number;
  rtcmBytes: number;
  
  // Receiver init state
  receiverInitCommand: string;

  // State setters
  setNtripUsername: (value: string) => void;
  setNtripPassword: (value: string) => void;
  setNtripServer: (value: string) => void;
  setNtripPortText: (value: string) => void;
  setNtripMountpoint: (value: string) => void;
  setReceiverInitCommand: (value: string) => void;
  setBluetoothStatus: (value: string) => void;

  // Bluetooth operations
  getPairedDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  
  // Receiver operations
  sendReceiverCommand: (
    device: BluetoothDevice,
    command: string,
    statusMessage?: string,
  ) => Promise<boolean>;
  
  // NTRIP operations
  startNtrip: () => Promise<void>;
  stopNtrip: (message?: string) => Promise<void>;

  // Refs (needed for some components)
  connectedDeviceRef: React.MutableRefObject<BluetoothDevice | null>;
  latestGgaSentenceRef: React.MutableRefObject<string>;
}

export function useTopconGpsReader(): UseTopconGpsReaderReturn {
  // Bluetooth state
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [bluetoothStatus, setBluetoothStatus] = useState(
    "Bluetooth idle. Search for a paired receiver.",
  );
  const [lastNmeaSentence, setLastNmeaSentence] = useState("");
  const [rawReceiverData, setRawReceiverData] = useState("");

  // GPS state
  const [gpsData, setGpsData] = useState<GGAData | null>(null);

  // NTRIP state
  const [ntripUsername, setNtripUsername] = useState("");
  const [ntripPassword, setNtripPassword] = useState("");
  const [ntripServer, setNtripServer] = useState(
    ASG_EUPOS_DEFAULT_CONFIG.ntripServer,
  );
  const [ntripPortText, setNtripPortText] = useState(
    String(ASG_EUPOS_DEFAULT_CONFIG.ntripPort),
  );
  const [ntripMountpoint, setNtripMountpoint] = useState(
    ASG_EUPOS_DEFAULT_CONFIG.mountpoint,
  );
  const [ntripStatus, setNtripStatus] = useState(
    "NTRIP idle. Waiting for receiver connection.",
  );
  const [ntripActive, setNtripActive] = useState(false);
  const [ntripHeaders, setNtripHeaders] = useState("");
  const [ntripError, setNtripError] = useState("");
  const [rtcmPackets, setRtcmPackets] = useState(0);
  const [rtcmBytes, setRtcmBytes] = useState(0);

  // Receiver init state
  const [receiverInitCommand, setReceiverInitCommand] =
    useState("em,,nmea/GGA:1");

  // Refs
  const connectedDeviceRef = useRef<BluetoothDevice | null>(null);
  const bluetoothReadSubscriptionRef =
    useRef<BluetoothEventSubscription | null>(null);
  const ntripStatusSubscriptionRef = useRef<EmitterSubscription | null>(null);
  const ntripDataSubscriptionRef = useRef<EmitterSubscription | null>(null);
  const ntripErrorSubscriptionRef = useRef<EmitterSubscription | null>(null);
  const ntripConnectedRef = useRef(false);
  const latestGgaSentenceRef = useRef("");
  const ggaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bluetoothWriteChainRef = useRef(Promise.resolve());
  const lastGgaSentAtRef = useRef(0);
  const bluetoothLineBufferRef = useRef("");

  useEffect(() => {
    connectedDeviceRef.current = connectedDevice;
  }, [connectedDevice]);

  const stopGgaPump = useCallback(() => {
    if (ggaIntervalRef.current) {
      clearInterval(ggaIntervalRef.current);
      ggaIntervalRef.current = null;
    }
  }, []);

  const pushLatestGga = useCallback(async () => {
    if (!ntripConnectedRef.current) {
      return;
    }

    const sentence = latestGgaSentenceRef.current.trim();
    if (!sentence) {
      return;
    }

    try {
      await NtripClient.sendGga(sentence);
      lastGgaSentAtRef.current = Date.now();
    } catch (error) {
      setNtripError(
        error instanceof Error
          ? error.message
          : "Failed to send GGA to the caster.",
      );
    }
  }, []);

  const startGgaPump = useCallback(() => {
    stopGgaPump();
    ggaIntervalRef.current = setInterval(() => {
      void pushLatestGga();
    }, GGA_PUSH_INTERVAL_MS);
  }, [pushLatestGga, stopGgaPump]);

  const stopNtrip = useCallback(
    async (message = "NTRIP stopped.") => {
      stopGgaPump();
      ntripConnectedRef.current = false;
      setNtripActive(false);

      if (!NtripClient.isSupported()) {
        setNtripStatus(message);
        return;
      }

      try {
        await NtripClient.disconnect();
      } catch {
        // Ignore disconnect failures during cleanup.
      }

      setNtripStatus(message);
    },
    [stopGgaPump],
  );

  useEffect(() => {
    if (!NtripClient.isSupported()) {
      return;
    }

    ntripStatusSubscriptionRef.current = NtripClient.addStatusListener(
      (event) => {
        if (event.headers) {
          setNtripHeaders(event.headers);
        }

        if (event.state === "connected") {
          ntripConnectedRef.current = true;
          setNtripActive(true);
          setNtripStatus(event.message ?? "NTRIP connected.");
          startGgaPump();
          void pushLatestGga();
          return;
        }

        if (event.state === "disconnected") {
          ntripConnectedRef.current = false;
          setNtripActive(false);
          stopGgaPump();
        }

        setNtripStatus(event.message ?? event.state);
      },
    );

    ntripDataSubscriptionRef.current = NtripClient.addDataListener((event) => {
      const device = connectedDeviceRef.current;
      if (!device) {
        return;
      }

      setRtcmPackets((current) => current + 1);
      setRtcmBytes((current) => current + event.bytes);

      const chunk = Buffer.from(event.base64Data, "base64");
      bluetoothWriteChainRef.current = bluetoothWriteChainRef.current
        .then(async () => {
          const activeDevice = connectedDeviceRef.current;
          if (!activeDevice) {
            return;
          }

          await activeDevice.write(chunk);
        })
        .catch(async (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to forward RTCM data over Bluetooth.";

          setNtripError(message);
          await stopNtrip("RTCM forwarding failed. NTRIP stopped.");
        });
    });

    ntripErrorSubscriptionRef.current = NtripClient.addErrorListener(
      (event) => {
        ntripConnectedRef.current = false;
        setNtripActive(false);
        setNtripError(event.message);
        if (event.headers) {
          setNtripHeaders(event.headers);
        }
        setNtripStatus(event.message);
        stopGgaPump();
      },
    );

    return () => {
      ntripStatusSubscriptionRef.current?.remove();
      ntripDataSubscriptionRef.current?.remove();
      ntripErrorSubscriptionRef.current?.remove();
      ntripStatusSubscriptionRef.current = null;
      ntripDataSubscriptionRef.current = null;
      ntripErrorSubscriptionRef.current = null;
      stopGgaPump();
    };
  }, [pushLatestGga, startGgaPump, stopGgaPump, stopNtrip]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      setBluetoothStatus("This screen requires Android Bluetooth Classic.");
      return;
    }

    const requestPermissions = async () => {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const bluetoothConnectGranted =
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const bluetoothScanGranted =
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED;

        if (bluetoothConnectGranted && bluetoothScanGranted) {
          setBluetoothStatus("Bluetooth permissions granted.");
        } else {
          setBluetoothStatus("Bluetooth permissions were not granted.");
        }
      } catch (error) {
        setBluetoothStatus(
          error instanceof Error
            ? error.message
            : "Failed to request Bluetooth permissions.",
        );
      }
    };

    void requestPermissions();
  }, []);

  useEffect(() => {
    return () => {
      bluetoothReadSubscriptionRef.current?.remove();
      void stopNtrip("NTRIP stopped during cleanup.");
      if (connectedDeviceRef.current?.disconnect) {
        void connectedDeviceRef.current.disconnect();
      }
    };
  }, [stopNtrip]);

  const processIncomingBluetoothPayload = useCallback(
    (payload: string) => {
      const normalizedPayload = payload.replace(/\0/g, "");
      if (!normalizedPayload) {
        return;
      }

      setRawReceiverData((current) => {
        const next = `${current}${normalizedPayload}`;
        if (next.length <= RAW_RECEIVER_LOG_LIMIT) {
          return next;
        }

        return next.slice(-RAW_RECEIVER_LOG_LIMIT);
      });

      bluetoothLineBufferRef.current += normalizedPayload;
      if (bluetoothLineBufferRef.current.length > 8192) {
        bluetoothLineBufferRef.current =
          bluetoothLineBufferRef.current.slice(-4096);
      }

      const endsWithLineBreak = /[\r\n]$/.test(bluetoothLineBufferRef.current);
      const parts = bluetoothLineBufferRef.current.split(/\r\n|\n|\r/);
      const tail = endsWithLineBreak ? "" : (parts.pop() ?? "");
      bluetoothLineBufferRef.current = tail;

      const candidates = parts.flatMap(extractSentenceCandidates);
      if (!candidates.length) {
        setLastNmeaSentence(normalizedPayload.trim());
        return;
      }

      let sawNmea = false;
      let sawGga = false;

      for (const candidate of candidates) {
        if (typeof candidate !== "string" || !candidate.startsWith("$")) {
          continue;
        }

        sawNmea = true;
        setLastNmeaSentence(candidate);

        const parsed = parseGGA(candidate);
        if (!parsed) {
          continue;
        }

        sawGga = true;
        setGpsData(parsed);
        latestGgaSentenceRef.current = parsed.raw;

        if (isValidFix(parsed)) {
          setBluetoothStatus(
            `Receiver connected. Current fix: ${getFixQualityLabel(parsed.fixQuality)}.`,
          );

          if (
            ntripConnectedRef.current &&
            Date.now() - lastGgaSentAtRef.current >= 1000
          ) {
            void pushLatestGga();
          }
        } else {
          setBluetoothStatus(
            `Receiver connected. GGA received, waiting for a valid fix (${getFixQualityLabel(parsed.fixQuality)}).`,
          );
        }
      }

      if (sawNmea && !sawGga) {
        setBluetoothStatus(
          "Receiver connected. NMEA is arriving, but no GGA sentence has been seen yet.",
        );
      }
    },
    [pushLatestGga],
  );

  const startReadingData = useCallback(
    (device: BluetoothDevice) => {
      bluetoothReadSubscriptionRef.current?.remove();
      bluetoothLineBufferRef.current = "";

      bluetoothReadSubscriptionRef.current = device.onDataReceived((event) => {
        try {
          const rawData =
            typeof event?.data === "string"
              ? event.data
              : String(event?.data ?? "");

          if (!rawData) {
            return;
          }

          const decodedPayload = Buffer.from(rawData, "base64").toString(
            "latin1",
          );
          processIncomingBluetoothPayload(decodedPayload);
        } catch (error) {
          setBluetoothStatus(
            error instanceof Error
              ? error.message
              : "Failed to decode Bluetooth data from the receiver.",
          );
        }
      });
    },
    [processIncomingBluetoothPayload],
  );

  const stopReadingData = useCallback(() => {
    bluetoothReadSubscriptionRef.current?.remove();
    bluetoothReadSubscriptionRef.current = null;
    bluetoothLineBufferRef.current = "";
  }, []);

  const sendReceiverCommand = useCallback(
    async (
      device: BluetoothDevice,
      command: string,
      statusMessage?: string,
    ) => {
      const trimmed = command.trim();
      if (!trimmed) {
        return false;
      }

      let normalized = command;
      if (!normalized.endsWith("\r\n")) {
        normalized = `${trimmed}\r\n`;
      }

      await device.write(normalized, "ascii");
      setBluetoothStatus(statusMessage ?? `Sent receiver command: ${trimmed}`);
      return true;
    },
    [],
  );

  const getPairedDevices = async () => {
    try {
      setBluetoothStatus("Loading paired Bluetooth devices...");
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);
      setBluetoothStatus(`Found ${paired.length} paired device(s).`);
    } catch (error) {
      setBluetoothStatus(
        error instanceof Error
          ? error.message
          : "Failed to load paired devices.",
      );
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      setBluetoothStatus(`Connecting to ${device.name || device.address}...`);
      const connection = await RNBluetoothClassic.connectToDevice(
        device.address,
        {
          connectorType: "rfcomm",
          connectionType: "binary",
          charset: "ascii",
          readSize: 4096,
        },
      );

      connectedDeviceRef.current = connection;
      setConnectedDevice(connection);
      startReadingData(connection);
      if (receiverInitCommand.trim()) {
        await sendReceiverCommand(
          connection,
          receiverInitCommand,
          `Connected to ${connection.name || connection.address}. Initialization command sent.`,
        );
      } else {
        setBluetoothStatus(
          `Connected to ${connection.name || connection.address}.`,
        );
      }
      setNtripStatus("Receiver connected. Waiting for a valid GGA sentence.");
    } catch (error) {
      setBluetoothStatus(
        error instanceof Error ? error.message : "Bluetooth connection failed.",
      );
    }
  };

  const disconnectDevice = async () => {
    try {
      await stopNtrip("NTRIP stopped because the receiver was disconnected.");
      stopReadingData();

      if (connectedDevice?.disconnect) {
        await connectedDevice.disconnect();
      }

      connectedDeviceRef.current = null;
      setConnectedDevice(null);
      setGpsData(null);
      latestGgaSentenceRef.current = "";
      setLastNmeaSentence("");
      setRawReceiverData("");
      setBluetoothStatus("Receiver disconnected.");
      setNtripStatus("NTRIP idle. Waiting for receiver connection.");
      setNtripHeaders("");
      setNtripError("");
      setRtcmPackets(0);
      setRtcmBytes(0);
    } catch (error) {
      setBluetoothStatus(
        error instanceof Error ? error.message : "Receiver disconnect failed.",
      );
    }
  };

  const startNtrip = async () => {
    if (!connectedDevice) {
      setNtripStatus("Connect the Bluetooth receiver first.");
      return;
    }

    const port = Number.parseInt(ntripPortText, 10);
    const config = {
      username: ntripUsername,
      password: ntripPassword,
      ntripServer,
      ntripPort: port,
      mountpoint: ntripMountpoint,
    };

    const validation = validateNTRIPConfig(config);
    if (!validation.valid) {
      setNtripStatus(validation.errors.join(" "));
      return;
    }

    if (!gpsData || !isValidFix(gpsData) || !latestGgaSentenceRef.current) {
      setNtripStatus(
        "ASG-EUPOS RTN on port 2101 needs a valid standalone GGA fix before login.",
      );
      return;
    }

    if (!NtripClient.isSupported()) {
      setNtripStatus(
        "Native Android NTRIP module is missing. Rebuild the app.",
      );
      return;
    }

    setNtripError("");
    setNtripHeaders("");
    setRtcmPackets(0);
    setRtcmBytes(0);
    setNtripStatus("Opening NTRIP stream...");

    try {
      await NtripClient.connect({
        host: config.ntripServer.trim(),
        port: config.ntripPort,
        mountpoint: config.mountpoint.trim(),
        username: config.username.trim(),
        password: config.password,
        userAgent: USER_AGENT,
        initialGga: latestGgaSentenceRef.current,
        connectTimeoutMs: 15000,
      });
    } catch (error) {
      setNtripActive(false);
      ntripConnectedRef.current = false;
      setNtripStatus(
        error instanceof Error ? error.message : "NTRIP connection failed.",
      );
    }
  };

  return {
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
  };
}

