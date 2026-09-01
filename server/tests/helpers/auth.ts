import assert from "node:assert/strict";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { InjectOptions } from "light-my-request";

export interface TestCookie {
  name: string;
  value: string;
}

export type Authed = { cookies: TestCookie[] };

export const registerUser = async (
  app: FastifyInstance,
  body: { fullName: string; email: string; password: string },
): Promise<LightMyRequestResponse> => {
  return app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: body,
  });
};

export const loginUser = async (
  app: FastifyInstance,
  body: { email: string; password: string },
): Promise<LightMyRequestResponse> => {
  return app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: body,
  });
};

export const toTestCookies = (
  res: LightMyRequestResponse,
): TestCookie[] => res.cookies.map(({ name, value }) => ({ name, value }));

/** Registers + logs in, returning the auth cookies for follow-up requests. */
export const createAuthedAgent = async (
  app: FastifyInstance,
  body: { fullName: string; email: string; password: string },
): Promise<{ cookies: TestCookie[]; registerRes: LightMyRequestResponse; loginRes: LightMyRequestResponse }> => {
  const registerRes = await registerUser(app, body);

  assert.equal(registerRes.statusCode, 201, JSON.stringify(registerRes.body));

  const loginRes = await loginUser(app, { email: body.email, password: body.password });

  assert.equal(loginRes.statusCode, 200, JSON.stringify(loginRes.body));
  assert.ok(loginRes.cookies.length > 0, "login should set a session cookie");

  return { cookies: toTestCookies(loginRes), registerRes, loginRes };
};

/** Runs an inject() attaching the agent's `sid` session cookie. */
export const authedInject = async (
  app: FastifyInstance,
  cookies: TestCookie[],
  opts: {
    method: "GET" | "POST";
    url: string;
    payload?: unknown;
  },
): Promise<LightMyRequestResponse> => {
  const injectOpts: InjectOptions = {
    method: opts.method,
    url: opts.url,
    cookies: Object.fromEntries(cookies.map(({ name, value }) => [name, value])),
  };

  if (opts.payload !== undefined) {
    injectOpts.payload = opts.payload as Exclude<InjectOptions["payload"], undefined>;
  }

  return app.inject(injectOpts);
};