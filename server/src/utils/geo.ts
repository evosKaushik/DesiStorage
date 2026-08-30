import geoip from "geoip-lite";

interface GeoLocation {
  countryCode: string;
  state: string;
}

const UNKNOWN = "unknown";
const LOCAL_IPS = new Set(["::1", "127.0.0.1", "localhost"]);

export const getGeoLocation = (ip: string): GeoLocation => {
  if (!ip) {
    return { countryCode: UNKNOWN, state: UNKNOWN };
  }

  let normalizedIp = ip;

  if (ip.startsWith("::ffff:")) {
    normalizedIp = ip.slice("::ffff:".length);
  }

  if (LOCAL_IPS.has(normalizedIp)) {
    return { countryCode: UNKNOWN, state: UNKNOWN };
  }

  const lookup = geoip.lookup(normalizedIp);

  if (!lookup) {
    return { countryCode: UNKNOWN, state: UNKNOWN };
  }

  return {
    countryCode: lookup.country ?? UNKNOWN,
    state: lookup.region ?? UNKNOWN,
  };
};
