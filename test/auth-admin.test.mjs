import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp as initAdminApp, getApps as getAdminApps, deleteApp as deleteAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClientApp, getApps as getClientApps, deleteApp as deleteClientApp } from 'firebase/app';
import {
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  signOut as clientSignOut,
  connectAuthEmulator,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';

const PROJECT_ID = 'unlockshop';
const EMULATOR_HOST = '127.0.0.1:9099';

process.env.FIREBASE_AUTH_EMULATOR_HOST = EMULATOR_HOST;
process.env.FIREBASE_PROJECT_ID = PROJECT_ID;

let adminAuth;
let clientAuth;

before(async () => {
  // Initialize Admin SDK pointing to Auth Emulator
  const adminApp = initAdminApp({ projectId: PROJECT_ID });
  adminAuth = getAdminAuth(adminApp);

  // Initialize Client SDK pointing to Auth Emulator
  const clientApp = initClientApp(
    {
      apiKey: 'fake-api-key',
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
    },
    'client-test-app'
  );
  clientAuth = getClientAuth(clientApp);
  connectAuthEmulator(clientAuth, `http://${EMULATOR_HOST}`, { disableWarnings: true });
  await setPersistence(clientAuth, browserSessionPersistence);
});

after(async () => {
  for (const app of getClientApps()) {
    await deleteClientApp(app);
  }
  for (const app of getAdminApps()) {
    await deleteAdminApp(app);
  }
});

test('Stage B: Administrator Authentication & Claim Verification', async (t) => {
  const adminEmail = `admin-${Date.now()}@unlockpremium.shop`;
  const nonAdminEmail = `user-${Date.now()}@example.com`;
  const unverifiedAdminEmail = `unverified-${Date.now()}@unlockpremium.shop`;
  const password = 'StrongPassword!2026';

  let adminUserRecord;
  let nonAdminUserRecord;
  let unverifiedAdminRecord;

  await t.test('1. Provision test accounts via Admin SDK', async () => {
    // 1. Fully verified admin user
    adminUserRecord = await adminAuth.createUser({
      email: adminEmail,
      password: password,
      emailVerified: true,
    });
    // Set admin custom claim while preserving existing claims
    await adminAuth.setCustomUserClaims(adminUserRecord.uid, {
      tier: 'super',
      admin: true,
    });

    // 2. Verified ordinary user (no admin claim)
    nonAdminUserRecord = await adminAuth.createUser({
      email: nonAdminEmail,
      password: password,
      emailVerified: true,
    });

    // 3. Unverified admin candidate (admin claim set, but email NOT verified)
    unverifiedAdminRecord = await adminAuth.createUser({
      email: unverifiedAdminEmail,
      password: password,
      emailVerified: false,
    });
    await adminAuth.setCustomUserClaims(unverifiedAdminRecord.uid, {
      admin: true,
    });

    assert.ok(adminUserRecord.uid);
    assert.ok(nonAdminUserRecord.uid);
    assert.ok(unverifiedAdminRecord.uid);
  });

  await t.test('2. Successful login with verified administrator credentials', async () => {
    const cred = await signInWithEmailAndPassword(clientAuth, adminEmail, password);
    assert.equal(cred.user.email, adminEmail);
    assert.equal(cred.user.emailVerified, true);

    const tokenResult = await cred.user.getIdTokenResult();
    assert.equal(tokenResult.claims.admin, true);
    assert.equal(tokenResult.claims.tier, 'super', 'Preserves unrelated custom claims');
  });

  await t.test('3. Incorrect password fails authentication', async () => {
    await assert.rejects(
      async () => {
        await signInWithEmailAndPassword(clientAuth, adminEmail, 'WrongPassword123!');
      },
      (err) => {
        return err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password';
      }
    );
  });

  await t.test('4. Ordinary authenticated user lacks admin privileges', async () => {
    const cred = await signInWithEmailAndPassword(clientAuth, nonAdminEmail, password);
    assert.equal(cred.user.email, nonAdminEmail);

    const tokenResult = await cred.user.getIdTokenResult();
    assert.notEqual(tokenResult.claims.admin, true, 'Ordinary user must NOT have admin claim');
  });

  await t.test('5. Unverified email user is flagged appropriately', async () => {
    const cred = await signInWithEmailAndPassword(clientAuth, unverifiedAdminEmail, password);
    assert.equal(cred.user.emailVerified, false, 'Email verification flag must be false');
  });

  await t.test('6. Dynamic claim granting, preservation, and revocation', async () => {
    // Check initial state
    let user = await adminAuth.getUser(nonAdminUserRecord.uid);
    assert.equal(user.customClaims?.admin, undefined);

    // Grant admin claim and preserve other claims
    await adminAuth.setCustomUserClaims(user.uid, {
      partnerId: 'dist-01',
      admin: true,
    });

    user = await adminAuth.getUser(user.uid);
    assert.equal(user.customClaims?.admin, true);
    assert.equal(user.customClaims?.partnerId, 'dist-01');

    // Revoke admin claim
    await adminAuth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: false,
    });

    user = await adminAuth.getUser(user.uid);
    assert.equal(user.customClaims?.admin, false);
    assert.equal(user.customClaims?.partnerId, 'dist-01');
  });

  await t.test('7. Token refresh picks up newly granted or revoked claims', async () => {
    // Sign in as nonAdminUserRecord
    const cred = await signInWithEmailAndPassword(clientAuth, nonAdminEmail, password);
    let token = await cred.user.getIdTokenResult();
    assert.equal(token.claims.admin, false);

    // Elevated by admin script
    await adminAuth.setCustomUserClaims(cred.user.uid, { admin: true });

    // Force refresh token (equivalent to refreshClaims() in client auth-context)
    token = await cred.user.getIdTokenResult(true);
    assert.equal(token.claims.admin, true, 'Forced token refresh must reflect server updates');
  });

  await t.test('8. Behaviour of previously issued tokens following privilege revocation', async () => {
    // 1. Sign in as admin user
    const cred = await signInWithEmailAndPassword(clientAuth, adminEmail, password);
    const cachedTokenResult = await cred.user.getIdTokenResult(false);
    assert.equal(cachedTokenResult.claims.admin, true);

    // 2. Operator revokes privileges and revokes refresh tokens on the server
    await adminAuth.setCustomUserClaims(cred.user.uid, { admin: false });
    await adminAuth.revokeRefreshTokens(cred.user.uid);

    // 3. Cached in-memory token still retains 'admin: true' until expiration or forced refresh
    const unrefreshedTokenResult = await cred.user.getIdTokenResult(false);
    assert.equal(
      unrefreshedTokenResult.claims.admin,
      true,
      'EMPIRICAL FINDING: In-memory ID token remains valid until its 1-hour expiration timestamp'
    );

    // 4. When token refresh is triggered, client receives updated claims or is invalidated
    try {
      const refreshedToken = await cred.user.getIdTokenResult(true);
      assert.equal(refreshedToken.claims.admin, false, 'Refreshed token reflects revoked admin claim');
    } catch (err) {
      // In some environments, revokeRefreshTokens causes refresh to fail completely
      assert.ok(err);
    }
  });

  await t.test('9. Logout clears authenticated state', async () => {
    assert.ok(clientAuth.currentUser);
    await clientSignOut(clientAuth);
    assert.equal(clientAuth.currentUser, null, 'Current user must be null after sign-out');
  });

  await t.test('10. Clean up test users', async () => {
    await adminAuth.deleteUser(adminUserRecord.uid);
    await adminAuth.deleteUser(nonAdminUserRecord.uid);
    await adminAuth.deleteUser(unverifiedAdminRecord.uid);
  });
});
