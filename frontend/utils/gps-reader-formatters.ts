import type { GGAData } from "./gps-helpers";
import { getFixQualityLabel } from "./gps-helpers";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractSentenceCandidates(chunk: string): string[] {
  return chunk
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const matches = line.match(/\$[^$]+/g);
      return matches?.length ? matches : [line];
    });
}

export function formatCoordinate(
  value: number,
  positive: string,
  negative: string,
): string {
  const suffix = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(8)} ${suffix}`;
}

export function formatGpsSummary(ggaData: GGAData | null): string {
  if (!ggaData) {
    return "No valid GGA sentence received yet.";
  }

  return [
    `Fix: ${getFixQualityLabel(ggaData.fixQuality)}`,
    `Lat: ${formatCoordinate(ggaData.latitude, "N", "S")}`,
    `Lon: ${formatCoordinate(ggaData.longitude, "E", "W")}`,
    `Alt: ${ggaData.altitude.toFixed(2)} m`,
    `Satellites: ${ggaData.numSatellites}`,
    `HDOP: ${ggaData.hdop.toFixed(2)}`,
    `UTC: ${ggaData.time || "-"}`,
  ].join("\n");
}

