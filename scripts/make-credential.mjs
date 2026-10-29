/**
 * make-credential.mjs
 *
 * Returns a Firebase Admin SDK-compatible credential object using the safest
 * keyless mechanism available in the current environment, in priority order:
 *
 *   1. FIREBASE_AUTH_EMULATOR_HOST is set → return null (emulator needs no credential)
 *   2. IMPERSONATE_SERVICE_ACCOUNT env var is set
 *        → programmatic service-account impersonation via google-auth-library
 *        → wraps an Impersonated token client in a firebase-admin Credential shape
 *        → requires the caller's ADC identity to have roles/iam.serviceAccountTokenCreator
 *   3. Otherwise → applicationDefault() from firebase-admin/app
 *        → resolves: GOOGLE_APPLICATION_CREDENTIALS, gcloud ADC, GCE metadata
 *        → NOTE: plain gcloud end-user ADC does NOT work with Firebase Auth API;
 *          use impersonation (option 2) or a GCP-hosted runtime (option 3 via metadata)
 *
 * No JSON private-key file is opened by this module.
 *
 * Required IAM roles on the impersonated service account
 * (firebase-adminsdk-fbsvc@unlockshop.iam.gserviceaccount.com):
 *   - Firebase Authentication Admin  (roles/firebaseauth.admin)  ← listUsers, createUser, setCustomClaims
 *   - Cloud Datastore User           (roles/datastore.user)      ← Firestore read/write
 *
 * Required IAM role on the caller's identity (for impersonation only):
 *   - Service Account Token Creator  (roles/iam.serviceAccountTokenCreator)
 *
 * Usage:
 *   import { makeCredential } from './make-credential.mjs';
 *   const credential = await makeCredential();
 *   initializeApp({ credential, projectId: 'unlockshop' });
 */

import { applicationDefault } from 'firebase-admin/app';
import { GoogleAuth, Impersonated } from 'google-auth-library';

const FIREBASE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/firebase',
];

/**
 * Build a firebase-admin Credential from a google-auth-library Impersonated client.
 * firebase-admin expects: { getAccessToken(): Promise<{access_token, expires_in}> }
 */
function credentialFromImpersonated(impersonatedClient) {
  return {
    getAccessToken: async () => {
      const response = await impersonatedClient.getAccessToken();
      // google-auth-library returns { token, res } or { token }
      const token = response.token ?? response;
      const expiryMs =
        impersonatedClient.credentials?.expiry_date ??
        Date.now() + 3600 * 1000;
      return {
        access_token: token,
        expires_in: Math.max(1, Math.floor((expiryMs - Date.now()) / 1000)),
      };
    },
  };
}

export async function makeCredential() {
  // Emulator: no credential needed — firebase-admin ignores it
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return null;
  }

  const impersonateTarget = process.env.IMPERSONATE_SERVICE_ACCOUNT;

  if (impersonateTarget) {
    // ── Service-account impersonation (preferred keyless path) ────────────
    // ADC provides the *source* identity (gcloud user, Workload Identity, etc.)
    // Impersonated wraps it to act as the target service account.
    const baseAuth = new GoogleAuth({ scopes: FIREBASE_AUTH_SCOPES });
    const sourceClient = await baseAuth.getClient();

    const impersonated = new Impersonated({
      sourceClient,
      targetPrincipal: impersonateTarget,
      lifetime: 3600,
      targetScopes: FIREBASE_AUTH_SCOPES,
    });

    // Eagerly fetch a token to surface auth errors at startup rather than
    // on the first API call.
    await impersonated.getAccessToken();

    console.log(
      `[Auth] Using service-account impersonation: ${impersonateTarget}`
    );
    return credentialFromImpersonated(impersonated);
  }

  // ── applicationDefault() fallback ─────────────────────────────────────
  // Works on GCE / Cloud Run / App Engine (attached service-account metadata).
  // Does NOT work with plain `gcloud auth application-default login` user ADC
  // for Firebase Auth API — use IMPERSONATE_SERVICE_ACCOUNT in that case.
  console.log(
    '[Auth] Using applicationDefault() — ensure this resolves to a service-account identity.'
  );
  return applicationDefault();
}

