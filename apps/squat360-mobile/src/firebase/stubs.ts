import { getFirebaseConfig } from './config';

/** Auth / sync placeholders — no network calls in scaffold. */
export async function stubSignInAnonymously(): Promise<{ uid: string; stub: true }> {
  if (!getFirebaseConfig()) {
    return { uid: 'local-anon', stub: true };
  }
  // TODO: initialize Firebase Auth when credentials are present.
  return { uid: 'firebase-stub-uid', stub: true };
}

export async function stubUploadSession(_sessionId: number): Promise<{ ok: boolean; stub: true }> {
  return { ok: false, stub: true };
}
