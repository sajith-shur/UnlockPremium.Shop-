#!/usr/bin/env node
/**
 * Administrator Provisioning & Custom Claims Management CLI
 *
 * Authentication — Keyless via Application Default Credentials (ADC):
 *   1. Local Emulator:   Automatically uses local Auth/Firestore (no credentials needed)
 *   2. Developer Machine: Authenticate using service-account impersonation:
 *        gcloud auth application-default login --impersonate-service-account=firebase-adminsdk-fbsvc@unlockshop.iam.gserviceaccount.com
 *   3. Google Cloud Runtimes (Cloud Run, GCE, Workload Identity):
 *        Automatically attaches runtime service-account credentials
 *
 * Safety & Security:
 *   - No long-lived service-account private keys are read, generated, or stored
 *   - Explicitly rejects plain end-user ADC (UserRefreshClient) which Identity Toolkit rejects
 *   - Explicitly blocks any fallback to legacy static JSON keys
 *   - Verifies email is verified before granting administrative privileges
 *   - Manages /admin_users/{uid} authorisation record for 0-second instant revocation
 *   - Deactivates /admin_users/{uid} first during emergency revocation
 *   - Preserves all unrelated custom claims
 *   - Requires explicit operator confirmation (--confirm flag) for privilege changes
 *   - Sensitive setup/verification links written to a private 0600 file in a 0700 directory,
 *     never displayed in stdout, stderr, agent chat transcripts, or persistent logs
 *
 * Usage:
 *   node scripts/manage-admin.mjs verify-credentials
 *   node scripts/manage-admin.mjs list
 *   node scripts/manage-admin.mjs get <uid-or-email>
 *   node scripts/manage-admin.mjs create <email> [--verify]
 *   node scripts/manage-admin.mjs verify-email <uid-or-email>     (EMULATOR ONLY)
 *   node scripts/manage-admin.mjs send-verification-link <uid-or-email>
 *   node scripts/manage-admin.mjs grant <uid-or-email> [--confirm]
 *   node scripts/manage-admin.mjs revoke <uid-or-email> [--confirm]
 */

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import { writeFileSync, chmodSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'unlockshop';
const EXPECTED_SERVICE_ACCOUNT = 'firebase-adminsdk-fbsvc@unlockshop.iam.gserviceaccount.com';

/**
 * Initialise Firebase Admin SDK with officially supported Application Default Credentials (ADC).
 * Guarantees keyless authentication and guards against accidental JSON key fallback.
 */
async function initAdminSdk() {
  if (getApps().length > 0) {
    const app = getApps()[0];
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  // 1. Emulator mode (unit tests and local simulation)
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    const app = initializeApp({ projectId: EXPECTED_PROJECT_ID });
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  // 2. Reject any legacy static private-key JSON file in GOOGLE_APPLICATION_CREDENTIALS
  const gCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gCreds && existsSync(gCreds)) {
    try {
      const parsed = JSON.parse(readFileSync(gCreds, 'utf8'));
      if (parsed.type === 'service_account' && parsed.private_key) {
        console.error(
          `[Security Error] GOOGLE_APPLICATION_CREDENTIALS points to a long-lived service account key file (${gCreds}).`
        );
        console.error(
          `Static private keys are deprecated. Please unset GOOGLE_APPLICATION_CREDENTIALS and use keyless impersonation ADC.`
        );
        process.exit(1);
      }
    } catch {
      // Continue if not JSON
    }
  }

  // 3. Inspect resolved ADC identity before initialisation to verify impersonation
  const googleAuth = new GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/identitytoolkit',
    ],
  });

  let client;
  try {
    client = await googleAuth.getClient();
  } catch (err) {
    console.error(`[Authentication Error] Could not load Application Default Credentials (ADC): ${err.message}`);
    console.error(`To authenticate using keyless service account impersonation, run:`);
    console.error(`  gcloud auth application-default login --impersonate-service-account=${EXPECTED_SERVICE_ACCOUNT}`);
    process.exit(1);
  }

  const clientType = client.constructor?.name;

  if (clientType === 'UserRefreshClient') {
    console.error(
      `[Security Error] ADC is currently configured with plain end-user credentials (UserRefreshClient).`
    );
    console.error(
      `Google Cloud Identity Toolkit (Firebase Auth) rejects end-user OAuth credentials.`
    );
    console.error(
      `Please configure service account impersonation by running:`
    );
    console.error(
      `  gcloud auth application-default login --impersonate-service-account=${EXPECTED_SERVICE_ACCOUNT}`
    );
    process.exit(1);
  }

  if (clientType === 'Impersonated') {
    const target = client.targetPrincipal;
    console.log(`[Auth Verified] Keyless authentication verified: impersonating ${target}`);
  } else {
    console.log(`[Auth Verified] Using Application Default Credentials (${clientType || 'GCP environment'})`);
  }

  // 4. Initialize Firebase Admin SDK with standard applicationDefault()
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: EXPECTED_PROJECT_ID,
  });

  return { auth: getAuth(app), db: getFirestore(app) };
}

/**
 * Write a sensitive action link (password-reset or email-verification) to a
 * private 0600 file in a 0700 temporary directory.
 *
 * The URL is NEVER printed to stdout, stderr, or any shared terminal transcript.
 */
async function writeSecureLink({ kind, email, uid, link }) {
  const dir = join(tmpdir(), 'unlockshop-admin-links');
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${kind.toLowerCase()}-${uid}-${ts}.txt`;
  const filepath = join(dir, filename);

  const content = [
    `TYPE:    ${kind}`,
    `EMAIL:   ${email}`,
    `UID:     ${uid}`,
    `TIME:    ${new Date().toISOString()}`,
    ``,
    `PRIVATE ACTION LINK (Deliver out-of-band to administrator; delete file after use):`,
    `${link}`,
    ``,
    `To delete this file after delivery:`,
    `  rm -f "${filepath}"`,
  ].join('\n');

  writeFileSync(filepath, content, { mode: 0o600 });
  chmodSync(filepath, 0o600);

  console.log(`\n[Secure Link Created]`);
  console.log(`  File location:         ${filepath}`);
  console.log(`  File permissions:      0600 (owner read/write only)`);
  console.log(`  Directory permissions: 0700 (owner only)`);
  console.log(`  The link is NOT printed to the console or logs to prevent transcript leaks.`);
  console.log(`  View in your private shell, send via a secure channel, then run:`);
  console.log(`    rm -f "${filepath}"\n`);
}

async function resolveUser(auth, identifier) {
  try {
    if (identifier.includes('@')) {
      return await auth.getUserByEmail(identifier);
    }
    return await auth.getUser(identifier);
  } catch (err) {
    console.error(`[Error] User '${identifier}' not found in project ${EXPECTED_PROJECT_ID}.`);
    process.exit(1);
  }
}

async function main() {
  const { auth, db } = await initAdminSdk();
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(`=== UnlockPremium Shop - Administrator Management CLI ===`);
  console.log(`Active Project: ${EXPECTED_PROJECT_ID}`);
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log(`Environment: LOCAL AUTH EMULATOR (${process.env.FIREBASE_AUTH_EMULATOR_HOST})`);
  } else {
    console.log(`Environment: PRODUCTION / CLOUD IDENTITY TOOLKIT`);
  }
  console.log(`--------------------------------------------------------\n`);

  switch (command) {
    case 'verify-credentials': {
      console.log('Testing keyless read-only access to Firebase services...');

      // 1. Firebase Auth read test
      console.log(`\n[Test 1/2] Checking Firebase Authentication read access (listUsers)...`);
      const userList = await auth.listUsers(1);
      console.log(`  ✓ Successfully queried Firebase Auth (${userList.users.length} sample user found).`);

      // 2. Firestore read test
      console.log(`\n[Test 2/2] Checking Cloud Firestore read access (listCollections)...`);
      const collections = await db.listCollections();
      const colNames = collections.map((c) => c.id).join(', ');
      console.log(`  ✓ Successfully queried Firestore collections: [${colNames || 'none'}]`);

      console.log(`\n[Success] Cloud verification PASSED.`);
      console.log(`  Project:         ${EXPECTED_PROJECT_ID}`);
      console.log(`  Target Identity: ${EXPECTED_SERVICE_ACCOUNT}`);
      console.log(`  State:           Read-only checks completed successfully without modifying data.`);
      break;
    }

    case 'list': {
      const listResult = await auth.listUsers(100);
      console.log(`Found ${listResult.users.length} user(s):`);
      for (const u of listResult.users) {
        const claims = u.customClaims || {};
        const isAdmin = claims.admin === true;
        let authRecord = 'none';
        try {
          const doc = await db.collection('admin_users').doc(u.uid).get();
          if (doc.exists) {
            authRecord = doc.data().active ? 'active' : 'inactive';
          }
        } catch {
          authRecord = 'unknown';
        }
        console.log(
          `  - UID: ${u.uid} | Email: ${u.email} | Verified: ${u.emailVerified} | Claim: ${isAdmin} | AuthRecord: ${authRecord}`
        );
      }
      break;
    }

    case 'get': {
      const id = args[1];
      if (!id) {
        console.error('Usage: node scripts/manage-admin.mjs get <uid-or-email>');
        process.exit(1);
      }
      const user = await resolveUser(auth, id);
      const adminDoc = await db.collection('admin_users').doc(user.uid).get();
      const adminData = adminDoc.exists ? adminDoc.data() : null;

      console.log(`User Profile for: ${user.email}`);
      console.log(`  UID:                   ${user.uid}`);
      console.log(`  Email Verified:        ${user.emailVerified}`);
      console.log(`  Disabled:              ${user.disabled}`);
      console.log(`  Custom Claims:         ${JSON.stringify(user.customClaims || {}, null, 2)}`);
      console.log(`  Authorisation Record:  ${adminDoc.exists ? (adminData.active ? 'ACTIVE (active: true)' : 'INACTIVE (active: false)') : 'NOT FOUND'}`);
      if (adminData) {
        console.log(`  Record Details:        ${JSON.stringify(adminData, null, 2)}`);
      }
      break;
    }

    case 'create': {
      const email = args[1];
      const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

      if (!email) {
        console.error('Usage: node scripts/manage-admin.mjs create <email> [--verify]');
        process.exit(1);
      }

      // In production: no plaintext password accepted via CLI
      if (!isEmulator && args[2] && !args[2].startsWith('--')) {
        console.error(
          '[Security Error] Passing plaintext passwords via CLI arguments is prohibited. ' +
          'Omit the password argument; a secure one-time password-reset link will be written to a private file.'
        );
        process.exit(1);
      }

      // Ephemeral cryptographic password for initial user creation; discarded immediately
      const { randomBytes } = await import('node:crypto');
      const ephemeralPassword = randomBytes(24).toString('base64url');

      const verify = isEmulator && args.includes('--verify');

      const newUser = await auth.createUser({
        email: email.trim(),
        password: ephemeralPassword,
        emailVerified: verify,
      });

      console.log(`[Success] User account created:`);
      console.log(`  UID:            ${newUser.uid}`);
      console.log(`  Email:          ${newUser.email}`);
      console.log(`  Email Verified: ${newUser.emailVerified}`);

      if (!isEmulator) {
        await writeSecureLink({
          kind: 'PASSWORD_RESET',
          email: newUser.email,
          uid: newUser.uid,
          link: await auth.generatePasswordResetLink(newUser.email),
        });
      }
      break;
    }

    case 'verify-email': {
      if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        console.error(
          `[Security Violation] Direct email verification override is strictly prohibited in production.`
        );
        console.error(
          `In production, use 'send-verification-link <email>' to generate a genuine email verification link.`
        );
        process.exit(1);
      }
      const id = args[1];
      if (!id) {
        console.error('Usage: node scripts/manage-admin.mjs verify-email <uid-or-email>');
        process.exit(1);
      }
      const user = await resolveUser(auth, id);
      await auth.updateUser(user.uid, { emailVerified: true });
      console.log(`[Success] Email verified marked as true for emulator user: ${user.email} (${user.uid})`);
      break;
    }

    case 'send-verification-link': {
      const id = args[1];
      if (!id) {
        console.error('Usage: node scripts/manage-admin.mjs send-verification-link <uid-or-email>');
        process.exit(1);
      }
      const user = await resolveUser(auth, id);
      await writeSecureLink({
        kind: 'EMAIL_VERIFICATION',
        email: user.email,
        uid: user.uid,
        link: await auth.generateEmailVerificationLink(user.email),
      });
      break;
    }

    case 'grant': {
      const id = args[1];
      const confirm = args.includes('--confirm');

      if (!id) {
        console.error('Usage: node scripts/manage-admin.mjs grant <uid-or-email> [--confirm]');
        process.exit(1);
      }

      const user = await resolveUser(auth, id);

      if (!user.emailVerified) {
        console.error(
          `[Security Violation] User '${user.email}' (${user.uid}) does not have a verified email.`
        );
        console.error(
          `Administrator privileges strictly require email_verified == true prior to assignment.`
        );
        process.exit(1);
      }

      if (!confirm) {
        console.log(`[Safety Check] You are about to grant administrative privileges to:`);
        console.log(`  UID:   ${user.uid}`);
        console.log(`  Email: ${user.email}`);
        console.log(`To confirm this action, rerun with the --confirm flag:`);
        console.log(`  node scripts/manage-admin.mjs grant ${id} --confirm`);
        process.exit(0);
      }

      // Step 1: Create active authorisation record in /admin_users/{uid}
      console.log(`[Step 1/2] Creating active authorisation record in /admin_users/${user.uid}...`);
      await db.collection('admin_users').doc(user.uid).set({
        active: true,
        email: user.email,
        updatedAt: new Date().toISOString(),
        grantedAt: new Date().toISOString(),
      }, { merge: true });

      // Step 2: Assign custom claims in Firebase Auth
      console.log(`[Step 2/2] Assigning custom claim 'admin: true'...`);
      const existingClaims = user.customClaims || {};
      const newClaims = {
        ...existingClaims,
        admin: true,
      };

      await auth.setCustomUserClaims(user.uid, newClaims);
      console.log(`[Success] Administrative access granted to ${user.email}.`);
      console.log(`Active authorisation record written to Firestore (/admin_users/${user.uid}).`);
      console.log(`Preserved claims: ${JSON.stringify(newClaims, null, 2)}`);
      break;
    }

    case 'revoke': {
      const id = args[1];
      const confirm = args.includes('--confirm');

      if (!id) {
        console.error('Usage: node scripts/manage-admin.mjs revoke <uid-or-email> [--confirm]');
        process.exit(1);
      }

      const user = await resolveUser(auth, id);

      if (!confirm) {
        console.log(`[Safety Check] You are about to REVOKE administrative privileges from:`);
        console.log(`  UID:   ${user.uid}`);
        console.log(`  Email: ${user.email}`);
        console.log(`To confirm this action, rerun with the --confirm flag:`);
        console.log(`  node scripts/manage-admin.mjs revoke ${id} --confirm`);
        process.exit(0);
      }

      // Step 1: Deactivate authorisation record first (immediate 0ms cutoff)
      console.log(`[Step 1/3] Deactivating authorisation record in /admin_users/${user.uid}...`);
      await db.collection('admin_users').doc(user.uid).set({
        active: false,
        revokedAt: new Date().toISOString(),
      }, { merge: true });

      // Step 2: Update custom claims
      console.log(`[Step 2/3] Revoking 'admin' custom claim in Firebase Auth...`);
      const existingClaims = user.customClaims || {};
      const newClaims = {
        ...existingClaims,
        admin: false,
      };
      await auth.setCustomUserClaims(user.uid, newClaims);

      // Step 3: Revoke all active refresh tokens
      console.log(`[Step 3/3] Revoking all active refresh tokens for UID ${user.uid}...`);
      await auth.revokeRefreshTokens(user.uid);

      console.log(`[Success] Administrative privileges successfully revoked from ${user.email}.`);
      console.log(`Firestore record deactivated (immediate 0-second denial).`);
      console.log(`All refresh tokens revoked for UID ${user.uid}.`);
      break;
    }

    default:
      console.log(`Available commands:`);
      console.log(`  verify-credentials                          Test read-only Firebase Auth & Firestore access`);
      console.log(`  list                                        List all registered users`);
      console.log(`  get <uid-or-email>                          Inspect user details and claims`);
      console.log(`  create <email> [--verify]                   Provision account (link → private temp file)`);
      console.log(`  verify-email <uid-or-email>                 Mark email verified (EMULATOR ONLY)`);
      console.log(`  send-verification-link <uid-or-email>       Generate verification link (→ private temp file)`);
      console.log(`  grant <uid-or-email> [--confirm]            Grant admin: true and create active authorisation record`);
      console.log(`  revoke <uid-or-email> [--confirm]           Deactivate authorisation record, revoke claim, and revoke refresh tokens`);
      console.log(``);
      console.log(`Authentication (Keyless via Application Default Credentials):`);
      console.log(`  gcloud auth application-default login --impersonate-service-account=${EXPECTED_SERVICE_ACCOUNT}`);
      break;
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err.message || err);
  process.exit(1);
});
