import os from "node:os";
import type { FastifyInstance } from "fastify";
import { ENV } from "../config/env.js";

const toWholeMB = (bytes: number): number => Math.round(bytes / 1024 / 1024);

const toClampedPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

type CpuTimesSnapshot = { idle: number; total: number };

// Kept between requests so CPU% is measured since the last health call
let lastCpuSnapshot: CpuTimesSnapshot | null = null;

const getCpuSnapshot = (): CpuTimesSnapshot => {
  let idle = 0;
  let total = 0;

  for (const cpu of os.cpus()) {
    idle += cpu.times.idle;
    total += cpu.times.idle + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
  }

  return { idle, total };
};

const getCpuUsagePercent = (): number => {
  const current = getCpuSnapshot();

  if (!lastCpuSnapshot) {
    lastCpuSnapshot = current;
    return 0; // No baseline yet, first call after boot
  }

  const idleDelta = current.idle - lastCpuSnapshot.idle;
  const totalDelta = current.total - lastCpuSnapshot.total;

  lastCpuSnapshot = current;

  if (totalDelta <= 0) {
    return 0;
  }

  return toClampedPercent((1 - idleDelta / totalDelta) * 100);
};

const getMemoryReport = () => {
  const totalMB = toWholeMB(os.totalmem());
  const freeMB = toWholeMB(os.freemem());
  const usedMB = totalMB - freeMB;

  return {
    totalMB,
    usedMB,
    freeMB,
    systemUsedPercent: toClampedPercent((usedMB / totalMB) * 100),
    processRssMB: toWholeMB(process.memoryUsage().rss),
    processHeapUsedMB: toWholeMB(process.memoryUsage().heapUsed),
    processUsedPercentOfSystem: toClampedPercent(
      (process.memoryUsage().rss / os.totalmem()) * 100,
    ),
  };
};

const getHealthReport = () => ({
  status: "ok",
  environment: ENV.NODE_ENV,
  timestamp: new Date().toISOString(),
  uptimeSeconds: Math.round(process.uptime()),
  cpu: {
    cores: os.cpus().length,
    usagePercent: getCpuUsagePercent(),
  },
  memory: getMemoryReport(),
});

export default async function (app: FastifyInstance) {
  app.get("/health", async () => getHealthReport());
}
