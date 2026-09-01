import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env.js";

const clientId = ENV.GOOGLE_CLIENT_ID;

const client = new OAuth2Client({
  clientId,
});

export async function verifyIdToken(idToken: string) {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const userData = loginTicket.getPayload();
  return userData;
}
