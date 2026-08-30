import type { FastifyRequest } from "fastify";
import type { UAParser as UAParserType } from "ua-parser-js";
import { UAParser } from "ua-parser-js";
import { getGeoLocation } from "./geo.js";

export function getDeviceName(
  device: ReturnType<UAParserType["getDevice"]>,
  os: ReturnType<UAParserType["getOS"]>,
) {
  if (device.model) {
    return device.model;
  }

  if (device.type === "mobile") {
    return "Mobile";
  }

  if (device.type === "tablet") {
    return "Tablet";
  }

  if (os.name === "Windows") {
    return "Windows Desktop";
  }

  if (os.name === "macOS") {
    return "Mac";
  }

  if (os.name === "Linux") {
    return "Linux Desktop";
  }

  return "Desktop";
}

export function getFormattedUserAgent(req: FastifyRequest) {
  const parser = new UAParser(req.headers["user-agent"]);

  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserVersion = browser.major
    ? `${browser.name} ${browser.major}`
    : (browser.name ?? "Unknown");

  const osName = os.name ?? "Unknown";
  const osVersion = os.version ?? "";

  const operatingSystem = `${osName} ${osVersion}`.trim();

  const { countryCode, state } = getGeoLocation(req.ip);

  return {
    device: getDeviceName(device, os),
    browserVersion,
    operatingSystem,
    ip: req.ip,
    countryCode,
    state,
  };
}
