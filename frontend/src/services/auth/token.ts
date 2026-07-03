/**
 * Clerk token bridge.
 *
 * The API client needs a Clerk session JWT to authenticate requests against
 * the FastAPI backend. Clerk exposes `getToken()` differently on client vs.
 * server, so we keep a settable provider that the client layer can call.
 *
 * On the client, `registerTokenGetter` is wired up once (see
 * `useRegisterAuthToken`). On the server, pass a token getter explicitly.
 */

export type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function registerTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
