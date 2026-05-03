// Synthetic /system/health producer.
//
// Used by the Health page when `?demo=1` is in the URL or when no real message
// has arrived within a few seconds of mount. Lets operators (and reviewers)
// see what the page looks like without an openbrain-ros backend running.

import type { SystemHealthMsg } from "./types";

interface DemoState {
  cpuPerCore: number[];
  cpuTemp: number;
  gpu: number;
  gpuTemp: number;
  ramFraction: number;
  thermals: { name: string; temp_c: number }[];
  rails: { name: string; voltage_v: number; current_a: number }[];
  uptime: number;
  startedAt: number;
}

function jitter(prev: number, low: number, high: number, step: number) {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(low, Math.min(high, next));
}

const RAM_TOTAL = 16 * 1024 * 1024 * 1024; // 16 GiB

export function makeDemoHealth(coreCount = 8): {
  next: () => SystemHealthMsg;
} {
  const state: DemoState = {
    cpuPerCore: Array.from({ length: coreCount }, () => 12 + Math.random() * 25),
    cpuTemp: 52,
    gpu: 18,
    gpuTemp: 48,
    ramFraction: 0.42,
    thermals: [
      { name: "cpu", temp_c: 52 },
      { name: "gpu", temp_c: 48 },
      { name: "ssd", temp_c: 41 },
      { name: "ambient", temp_c: 28 },
    ],
    rails: [
      { name: "5V_main", voltage_v: 5.02, current_a: 1.8 },
      { name: "12V_motors", voltage_v: 11.92, current_a: 3.4 },
      { name: "24V_drive", voltage_v: 23.85, current_a: 1.2 },
    ],
    uptime: 120,
    startedAt: Date.now(),
  };

  return {
    next() {
      state.uptime = Math.floor((Date.now() - state.startedAt) / 1000) + 120;
      state.cpuPerCore = state.cpuPerCore.map((v) => jitter(v, 5, 95, 12));
      const cpuAvg = state.cpuPerCore.reduce((a, b) => a + b, 0) / state.cpuPerCore.length;
      state.cpuTemp = jitter(state.cpuTemp, 45, 85, 1.5) + (cpuAvg - 30) * 0.02;
      state.gpu = jitter(state.gpu, 5, 85, 8);
      state.gpuTemp = jitter(state.gpuTemp, 42, 82, 1.2) + (state.gpu - 30) * 0.02;
      state.ramFraction = jitter(state.ramFraction, 0.3, 0.85, 0.02);
      state.thermals[0].temp_c = state.cpuTemp;
      state.thermals[1].temp_c = state.gpuTemp;
      state.thermals[2].temp_c = jitter(state.thermals[2].temp_c, 35, 60, 0.5);
      state.thermals[3].temp_c = jitter(state.thermals[3].temp_c, 22, 38, 0.3);
      state.rails = state.rails.map((r) => ({
        ...r,
        voltage_v: jitter(r.voltage_v, r.voltage_v - 0.1, r.voltage_v + 0.1, 0.04),
        current_a: jitter(r.current_a, 0.4, r.current_a + 1.5, 0.3),
      }));

      return {
        cpu_per_core: [...state.cpuPerCore],
        cpu_temp_c: state.cpuTemp,
        gpu_percent: state.gpu,
        gpu_temp_c: state.gpuTemp,
        ram_used_bytes: Math.floor(RAM_TOTAL * state.ramFraction),
        ram_total_bytes: RAM_TOTAL,
        thermal_zones: state.thermals.map((t) => ({ ...t })),
        power_rails: state.rails.map((r) => ({ ...r })),
        uptime_s: state.uptime,
      };
    },
  };
}
