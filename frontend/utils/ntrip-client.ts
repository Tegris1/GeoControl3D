import {
  DeviceEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from "react-native";

export interface NtripConnectOptions {
  host: string;
  port: number;
  mountpoint: string;
  username: string;
  password: string;
  userAgent?: string;
  initialGga?: string;
  connectTimeoutMs?: number;
}

export interface NtripStatusEvent {
  state: "connecting" | "connected" | "disconnected";
  message?: string;
  headers?: string;
}

export interface NtripDataEvent {
  base64Data: string;
  bytes: number;
}

export interface NtripErrorEvent {
  message: string;
  code?: string;
  headers?: string;
}

interface NtripNativeModule {
  connect(options: NtripConnectOptions): Promise<boolean>;
  disconnect(): Promise<boolean>;
  sendGga(ggaSentence: string): Promise<boolean>;
}

const EVENT_STATUS = "NtripClientStatus";
const EVENT_DATA = "NtripClientData";
const EVENT_ERROR = "NtripClientError";

const nativeModule = NativeModules.NtripClient as NtripNativeModule | undefined;

function assertSupported(): NtripNativeModule {
  if (Platform.OS !== "android") {
    throw new Error("The NTRIP bridge is implemented only on Android.");
  }

  if (!nativeModule) {
    throw new Error("Native NTRIP module is not available. Rebuild the Android app.");
  }

  return nativeModule;
}

export const NtripClient = {
  isSupported(): boolean {
    return Platform.OS === "android" && !!nativeModule;
  },

  connect(options: NtripConnectOptions): Promise<boolean> {
    return assertSupported().connect(options);
  },

  disconnect(): Promise<boolean> {
    return assertSupported().disconnect();
  },

  sendGga(ggaSentence: string): Promise<boolean> {
    return assertSupported().sendGga(ggaSentence);
  },

  addStatusListener(
    listener: (event: NtripStatusEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener(EVENT_STATUS, listener);
  },

  addDataListener(
    listener: (event: NtripDataEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener(EVENT_DATA, listener);
  },

  addErrorListener(
    listener: (event: NtripErrorEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener(EVENT_ERROR, listener);
  },
};
