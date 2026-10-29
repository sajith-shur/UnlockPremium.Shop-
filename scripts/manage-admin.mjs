#!/usr/bin/env node
/**
 * Administrator Provisioning & Custom Claims Management CLI
 *
 * Authentication — keyless, in priority order:
 *   1. FIREBASE_AUTH_EMULATOR_HOST set → no credential (emulator, no network needed)
 *   2. IMPERSONATE_SERVICE_ACCOUNT=<sa-email> set → short-lived impersonation token
 *      (your ADC identity must have roles/iam.serviceAccountTokenCreator on the SA)
 *   3. applicationDefault() → GCE / Cloud Run / App Engine attached metadata
 *
 * ⚠  Plain `gcloud auth application-default login` user ADC does NOT work with
 *    the Firebase Authentication API (identitytoolkit.googleapis.com).
 *    Use option 2 (impersonation) from a developer workstation.
 *
 * Usage:
 *   node scripts/manage-admin.mjs list
 *   node scripts/manage-admin.mjs get <uid-or-email>
 *   node scripts/manage-admin.mjs create <email> [--verify]
 *   node scripts/manage-admin.mjs verify-email <uid-or-email>     (EMULATOR ONLY)
 *   node scripts/manage-admin.mjs send-verification-link <uid-or-email>
 *   node scripts/manage-admin.mjs grant <uid-or-email> [--confirm]
 *   node scripts/manage-admin.mjs revoke <uid-or-email> [--confirm]
 *
 * Safety & Security:
 *   - No JSON private-key file is opened by this script
 *   - Verifies email before granting administrative privileges
 *   - Manages /admin_users/{uid} authorisation record for 0-second instant revocation
 *   - Deactivates /admin_users/{uid} first during emergency revocation
 *   - Preserves all unrelated custom claims
 *   - Requires --confirm flag for privilege changes
 *   - Never prints passwords or tokens
 *   - Sensitive setup/verification links written to a mode-600 temp file,
 *     never to stdout, stderr, or any shared terminal/transcript
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { makeCredential } from './make-credential.mjs';
import { writeFileSync, chmodSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'unlockshop';

/**
 * Initialise Firebase Admin SDK with the best available keyless credential.
 * Fails fast with a clear error if no usable credential can be obtained.
 * Never falls back silently to a JSON key file.
 */
async function initAdminSdk() {
  if (getApps().length > 0) {
    const app = getApps()[0];
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  const credential = await makeCredential();
  const config = { projectId: EXPECTED_PROJECT_ID };
  if (credential) config.credential = credential;

  const app = initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}

/**
 * Write a sensitive action link (password-reset or email-verification) to a
 * mode-600 file in a private temp directory, never to stdout, stderr, or any
 * terminal that could be captured by an agent transcript or log collector.
 *
 * The file path is printed to stdout so the operator can open it manually.
 */
async function writeSecureLink({ kind, email, uid, link }) {
  const dir = join(tmpdir(), 'unlockshop-admin-links');
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${kind.toLowerCase()}-${uid}-${ts}.txt`;
  const filepath = join(dir, filename);

  const content = [
    `KIND:    ${kind}`,
    `EMAIL:   ${email}`,
    `UID:     ${uid}`,
    `CREATED: ${new Date().toISOString()}`,
    ``,
    `ACTION REQUIRED — DELIVER OUT-OF-BAND`,
    `Copy the URL below and send it to the administrator via a secure private channel.`,
    `Do NOT paste it into chat, email, a commit, or any shared terminal session.`,
    `This file should be read once and then deleted.`,
    ``,
    `URL: ${link}`,
    ``,
    `--- delete this file after use ---`,
  ].join('\n');

  writeFileSync(filepath, content, { mode: 0o600 });
  chmodSync(filepath, 0o600); // enforce even if umask overrides

  console.log(`[Secure Link] Written to: ${filepath}`);
  console.log(`  Open this file privately, copy the URL, then delete the file.`);
  console.log(`  The URL is NOT displayed here to prevent transcript or log capture.`);
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

      // In production: no password argument accepted.
      // Account password is set by the user via the secure one-time reset link.
      if (!isEmulator && args[2] && !args[2].startsWith('--')) {
        console.error(
          '[Security Error] Passing plaintext passwords via CLI arguments is prohibited. ' +
          'Omit the password argument; a secure one-time password-reset link will be written to a private file.'
        );
        process.exit(1);
      }

      // Generate an ephemeral cryptographically-random password for account
      // creation only. It is never logged or printed; the user replaces it via
      // the password-reset link.
      const { randomBytes } = await import('node:crypto');
      const ephemeralPassword = randomBytes(24).toString('base64url');

      const verify = isEmulator && args.includes('--verify');

      const newUser = await auth.createUser({
        email: email.trim(),
        password: ephemeralPassword,
        emailVerified: verify,
      });

      // Log UID and email only — ephemeralPassword is intentionally discarded
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
      console.log(`  list                                        List all registered users`);
      console.log(`  get <uid-or-email>                          Inspect user details and claims`);
      console.log(`  create <email> [--verify]                   Provision account (link → private temp file)`);
      console.log(`  verify-email <uid-or-email>                 Mark email verified (EMULATOR ONLY)`);
      console.log(`  send-verification-link <uid-or-email>       Generate verification link (→ private temp file)`);
      console.log(`  grant <uid-or-email> [--confirm]            Grant admin: true and create active authorisation record`);
      console.log(`  revoke <uid-or-email> [--confirm]           Deactivate authorisation record, revoke claim, and revoke refresh tokens`);
      console.log(``);
      console.log(`Authentication (no JSON key file required):`);
      console.log(`  Emulator:      set FIREBASE_AUTH_EMULATOR_HOST`);
      console.log(`  Workstation:   gcloud auth application-default login (ADC user creds)`);
      console.log(`                 then IMPERSONATE_SERVICE_ACCOUNT=firebase-adminsdk-fbsvc@unlockshop.iam.gserviceaccount.com`);
      console.log(`  GCP-hosted:    attached service-account metadata (automatic)`);
      break;
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err.message || err);
  process.exit(1);
});
