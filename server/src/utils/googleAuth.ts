import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env.js";

const clientId = ENV.GOOGLE_CLIENT_ID;

/**
 * Exported so tests can mock client.verifyIdToken without touching the ESM
 * namespace (node:test cannot redefine read-only namespace exports).
 */
export const googleOAuthClient = new OAuth2Client({
  clientId,
});

export async function verifyIdToken(idToken: string) {
  const loginTicket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const userData = loginTicket.getPayload();
  return userData;
}
