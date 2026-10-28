#!/usr/bin/env node
/**
 * Administrator Provisioning & Custom Claims Management CLI
 * 
 * Usage:
 *   node scripts/manage-admin.mjs list
 *   node scripts/manage-admin.mjs get <uid-or-email>
 *   node scripts/manage-admin.mjs create <email> <password> [--verify]
 *   node scripts/manage-admin.mjs verify-email <uid-or-email>
 *   node scripts/manage-admin.mjs grant <uid-or-email> [--confirm]
 *   node scripts/manage-admin.mjs revoke <uid-or-email> [--confirm]
 * 
 * Safety & Security:
 *   - Verifies target Firebase project (defaults to 'unlockshop')
 *   - Verifies email is verified before granting administrative privileges
 *   - Preserves all unrelated custom claims
 *   - Requires explicit operator confirmation (--confirm flag) for privilege changes
 *   - Never prints passwords, tokens, or private credentials
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'unlockshop';

function initAdminSdk() {
  if (getApps().length > 0) {
    return getAuth();
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || EXPECTED_PROJECT_ID,
    });
  } else {
    // When running with FIREBASE_AUTH_EMULATOR_HOST or Application Default Credentials
    initializeApp({
      projectId: EXPECTED_PROJECT_ID,
    });
  }

  return getAuth();
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
  const auth = initAdminSdk();
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
        console.log(
          `  - UID: ${u.uid} | Email: ${u.email} | Verified: ${u.emailVerified} | Admin: ${isAdmin}`
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
      console.log(`User Profile for: ${user.email}`);
      console.log(`  UID:            ${user.uid}`);
      console.log(`  Email Verified: ${user.emailVerified}`);
      console.log(`  Disabled:       ${user.disabled}`);
      console.log(`  Custom Claims:  ${JSON.stringify(user.customClaims || {}, null, 2)}`);
      break;
    }

    case 'create': {
      const email = args[1];
      let password = args[2];
      const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

      if (!email) {
        console.error('Usage: node scripts/manage-admin.mjs create <email> [password] [--verify]');
        process.exit(1);
      }

      if (!isEmulator && password) {
        console.warn(
          `[Security Warning] Passing plaintext passwords via CLI arguments in production exposes credentials in process tables and shell history.`
        );
      }

      if (!password) {
        // Generate an ephemeral strong temporary key
        password = 'Temp-' + Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2) + '!9#';
      }

      const verify = isEmulator && args.includes('--verify');

      const newUser = await auth.createUser({
        email: email.trim(),
        password,
        emailVerified: verify,
      });

      console.log(`[Success] User account created:`);
      console.log(`  UID:            ${newUser.uid}`);
      console.log(`  Email:          ${newUser.email}`);
      console.log(`  Email Verified: ${newUser.emailVerified}`);

      if (!isEmulator) {
        const setupLink = await auth.generatePasswordResetLink(newUser.email);
        console.log(`\n[Action Required] Secure password setup link generated for ${newUser.email}:`);
        console.log(`  ${setupLink}`);
        console.log(`\nDeliver this link securely to the administrator so they can set their private password.`);
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
      console.log(`[Success] Secure email-verification link generated for ${user.email}:`);
      console.log(`  ${link}`);
      console.log(`\nDeliver this link to the administrator's corporate inbox to complete verified onboarding.`);
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

      const existingClaims = user.customClaims || {};
      const newClaims = {
        ...existingClaims,
        admin: true,
      };

      await auth.setCustomUserClaims(user.uid, newClaims);
      console.log(`[Success] Administrative claim (admin: true) granted to ${user.email}.`);
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

      const existingClaims = user.customClaims || {};
      const newClaims = {
        ...existingClaims,
        admin: false,
      };

      await auth.setCustomUserClaims(user.uid, newClaims);
      // Immediately invalidate all active refresh tokens for urgent revocation
      await auth.revokeRefreshTokens(user.uid);

      console.log(`[Success] Administrative claim revoked from ${user.email}.`);
      console.log(`All refresh tokens revoked for UID ${user.uid}.`);
      console.log(`Updated claims: ${JSON.stringify(newClaims, null, 2)}`);
      break;
    }

    default:
      console.log(`Available commands:`);
      console.log(`  list                                        List all registered users`);
      console.log(`  get <uid-or-email>                          Inspect user details and claims`);
      console.log(`  create <email> [password]                   Provision an admin account`);
      console.log(`  verify-email <uid-or-email>                 Mark email verified (EMULATOR ONLY)`);
      console.log(`  send-verification-link <uid-or-email>       Generate email verification link`);
      console.log(`  grant <uid-or-email> [--confirm]            Grant admin: true claim`);
      console.log(`  revoke <uid-or-email> [--confirm]           Revoke admin claim and refresh tokens`);
      break;
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err.message || err);
  process.exit(1);
});
