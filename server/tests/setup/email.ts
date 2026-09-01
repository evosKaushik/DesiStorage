import type { TestContext } from "node:test";
import resend from "../../src/config/resend.js";

export interface SentEmail {
  receiver: string;
  subject: string;
  html: string;
}

const calls: SentEmail[] = [];

export const emailCalls = (): SentEmail[] => calls;

export const resetEmailCalls = (): void => {
  calls.length = 0;
};

/** Mock `resend.emails.send` and record every attempt for the current test. */
export function mockSendEmail(t: TestContext): void {
  t.mock.method(resend.emails, "send", async (opts: { to: string; subject: string; html: string }) => {
    calls.push({ receiver: opts.to, subject: opts.subject, html: opts.html });
    return { data: { id: "email-id" }, error: null };
  });
}

/** Make the next email attempt fail as Resend would (error object returned). */
export function failNextSend(t: TestContext): void {
  t.mock.method(
    resend.emails,
    "send",
    async () => ({ data: null, error: new Error("resend-down") }),
  );
}