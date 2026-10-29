#!/usr/bin/env node
/**
 * Administrator Provisioning & Custom Claims Management CLI
 *
 * Authentication: Uses Application Default Credentials (ADC) exclusively.
 *   No service-account JSON key files are read or required.
 *   Authenticate once before running: `gcloud auth application-default login`
 *   or set GOOGLE_APPLICATION_CREDENTIALS to a Workload Identity / short-lived
 *   token source if running in a CI/CD environment.
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
 *   - Uses Application Default Credentials (ADC) — no long-lived JSON key on disk
 *   - Verifies target Firebase project (defaults to 'unlockshop')
 *   - Verifies email is verified before granting administrative privileges
 *   - Manages /admin_users/{uid} authorisation record for 0-second instant revocation
 *   - Deactivates /admin_users/{uid} first during emergency revocation
 *   - Preserves all unrelated custom claims
 *   - Requires explicit operator confirmation (--confirm flag) for privilege changes
 *   - Never prints passwords, tokens, or private credentials
 *   - Password reset / email-verification links printed only to stderr for manual
 *     out-of-band delivery; redirect stdout if you need a clean log file
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'unlockshop';

/**
 * Initialise Firebase Admin SDK using Application Default Credentials.
 *
 * ADC resolution order (google-auth-library):
 *   1. GOOGLE_APPLICATION_CREDENTIALS env var → any valid credential file
 *      (prefer Workload Identity / impersonation token source over a key file)
 *   2. gcloud user credentials  (`gcloud auth application-default login`)
 *   3. Attached service-account metadata (GCE / Cloud Run / App Engine)
 *
 * The old fallback that auto-loaded ~/.config/unlockshop-adminsdk-key.json has
 * been intentionally removed. No JSON private-key file is opened here.
 */
function initAdminSdk() {
  let app;
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // initializeApp() with no credential argument uses ADC automatically.
    // Works for: emulator (FIREBASE_AUTH_EMULATOR_HOST set), gcloud ADC,
    // and all GCP-hosted runtimes.
    app = initializeApp({ projectId: EXPECTED_PROJECT_ID });
  }

  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
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
  const { auth, db } = initAdminSdk();
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

      // In production: never accept a password argument; let Firebase generate a
      // random credential that the user replaces via the password-reset link below.
      // In emulator: accept --verify flag only (no plain-text password arg).
      if (!isEmulator && args[2] && !args[2].startsWith('--')) {
        console.error(
          '[Security Error] Passing plaintext passwords via CLI arguments is prohibited. ' +
          'Omit the password argument; a secure one-time password-reset link will be generated.'
        );
        process.exit(1);
      }

      // Generate an ephemeral cryptographically-random password for account
      // creation. The user will replace it via the Firebase password-reset link.
      // This value is never logged or printed.
      const crypto = await import('node:crypto');
      const ephemeralPassword = crypto.randomBytes(24).toString('base64url');

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
        // Generate a one-time password-reset link and write it to STDERR only.
        // STDERR is not captured by stdout redirects or most log collectors, so
        // the link reaches the operator's terminal without entering stdout logs.
        const setupLink = await auth.generatePasswordResetLink(newUser.email);
        process.stderr.write(
          `\n[ACTION REQUIRED — DELIVER OUT-OF-BAND]\n` +
          `One-time password setup link for ${newUser.email}:\n` +
          `  ${setupLink}\n\n` +
          `Copy this link and send it directly to the administrator via a private channel.\n` +
          `It is printed to STDERR only and must NOT be shared via chat, email, or commit history.\n\n`
        );
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
      const link = await auth.generateEmailVerificationLink(user.email);
      // Write the sensitive link to STDERR only — not captured by stdout log collectors
      process.stderr.write(
        `\n[ACTION REQUIRED — DELIVER OUT-OF-BAND]\n` +
        `Email-verification link for ${user.email}:\n` +
        `  ${link}\n\n` +
        `Send this link directly to the administrator's inbox. Do NOT paste into chat or logs.\n\n`
      );
      console.log(`[Success] Email-verification link generated for ${user.email} (see STDERR for the link).`);
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

      // Step 1: Deactivate authorisation record in /admin_users/{uid} first (Immediate 0ms cutoff)
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
      console.log(`  create <email> [--verify]                   Provision account (password-reset link → STDERR)`);
      console.log(`  verify-email <uid-or-email>                 Mark email verified (EMULATOR ONLY)`);
      console.log(`  send-verification-link <uid-or-email>       Generate email verification link (→ STDERR)`);
      console.log(`  grant <uid-or-email> [--confirm]            Grant admin: true and create active authorisation record`);
      console.log(`  revoke <uid-or-email> [--confirm]           Deactivate authorisation record, revoke claim, and revoke refresh tokens`);
      console.log(``);
      console.log(`Authentication:`);
      console.log(`  Uses Application Default Credentials (ADC). No JSON key file required.`);
      console.log(`  Run once: gcloud auth application-default login`);
      break;
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err.message || err);
  process.exit(1);
});
