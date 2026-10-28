import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const PROJECT_ID = 'unlockshop-rules-test';
let testEnv;

const validProductData = {
  slug: 'canva-pro-annual',
  name: 'Canva Pro — Annual',
  brandName: 'Canva',
  category: 'Design & Creativity',
  tagline: 'Professional design for everyone',
  description: 'Access premium Canva Pro templates, brand kits, and AI tools.',
  status: 'published',
  isAvailable: true,
  demoPriceMinor: 8999,
  currency: 'GBP',
  activationType: 'instant_invite',
  supportTerms: '30-day replacement guarantee',
  logoUsageStatus: 'pending',
  features: ['Unlimited templates', '100 GB storage'],
  variants: [
    {
      id: '12mo',
      name: '12 Months (Annual)',
      durationMonths: 12,
      priceMinor: 8999,
      currency: 'GBP',
      isAvailable: true,
      isDefault: true,
    },
  ],
};

const validSupplierData = {
  productId: 'canva-pro-annual',
  supplierName: 'Official Digital Distributor Corp',
  supplierContact: 'licensing@distributor.example',
  costMinor: 4500,
  currency: 'GBP',
  targetMarginPercent: 50,
  accountManagementNotes: 'Procured via wholesale partner allocation.',
  logoPermissionSource: 'Direct distribution tier agreement #2026-UK',
  logoPermissionNotes: 'Commercial resale permitted under nominative trademark policies.',
  lastReviewedDate: '2026-10-27',
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
    // Pre-populate test products directly using admin/system context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('products').doc('canva-published').set({
        ...validProductData,
        status: 'published',
      });
      await db.collection('products').doc('canva-draft').set({
        ...validProductData,
        status: 'draft',
      });
      await db.collection('products').doc('canva-unpublished').set({
        ...validProductData,
        status: 'unpublished',
      });
      await db.collection('categories').doc('design-creativity').set({
        name: 'Design & Creativity',
        description: 'Creative subscription tools',
        displayOrder: 1,
      });
      await db.collection('products_internal').doc('canva-published').set(validSupplierData);
      // Pre-populate active admin authorization record for admin_user_456
      await db.collection('admin_users').doc('admin_user_456').set({
        active: true,
        email: 'admin@unlockpremium.shop',
      });
    });
  }
});

// =============================================================================
// Test Suites
// =============================================================================

test('1. Anonymous / Public Visitor Access Rules', async (t) => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  await t.test('CAN read published products', async () => {
    const docRef = unauthDb.collection('products').doc('canva-published');
    await assertSucceeds(docRef.get());
  });

  await t.test('CANNOT read draft products', async () => {
    const docRef = unauthDb.collection('products').doc('canva-draft');
    await assertFails(docRef.get());
  });

  await t.test('CANNOT read unpublished products', async () => {
    const docRef = unauthDb.collection('products').doc('canva-unpublished');
    await assertFails(docRef.get());
  });

  await t.test('CANNOT create, update, or delete products', async () => {
    const docRef = unauthDb.collection('products').doc('new-product');
    await assertFails(docRef.set(validProductData));
    await assertFails(unauthDb.collection('products').doc('canva-published').delete());
  });

  await t.test('CAN read categories taxonomy', async () => {
    const catRef = unauthDb.collection('categories').doc('design-creativity');
    await assertSucceeds(catRef.get());
  });

  await t.test('CANNOT modify categories', async () => {
    const catRef = unauthDb.collection('categories').doc('design-creativity');
    await assertFails(catRef.update({ name: 'Hacked Category' }));
  });

  await t.test('CRITICAL: CANNOT read confidential supplier data (products_internal)', async () => {
    const internalRef = unauthDb.collection('products_internal').doc('canva-published');
    await assertFails(internalRef.get());
  });

  await t.test('CANNOT write to confidential supplier data', async () => {
    const internalRef = unauthDb.collection('products_internal').doc('canva-published');
    await assertFails(internalRef.set(validSupplierData));
  });

  await t.test('CANNOT access unspecified collections (default-deny)', async () => {
    const unspecRef = unauthDb.collection('secret_admin_data').doc('leak');
    await assertFails(unspecRef.get());
    await assertFails(unspecRef.set({ leaked: true }));
  });
});

test('2. Ordinary Authenticated User Access Rules (Without Admin Claim)', async (t) => {
  const userDb = testEnv
    .authenticatedContext('ordinary_user_123', {
      email: 'user@example.com',
      email_verified: true,
      // NOTE: No admin claim!
    })
    .firestore();

  await t.test('CAN read published products', async () => {
    const docRef = userDb.collection('products').doc('canva-published');
    await assertSucceeds(docRef.get());
  });

  await t.test('CANNOT read draft products', async () => {
    const docRef = userDb.collection('products').doc('canva-draft');
    await assertFails(docRef.get());
  });

  await t.test('CANNOT create, update, or delete products', async () => {
    const docRef = userDb.collection('products').doc('user-product');
    await assertFails(docRef.set(validProductData));
  });

  await t.test('CRITICAL: CANNOT read confidential supplier data', async () => {
    const internalRef = userDb.collection('products_internal').doc('canva-published');
    await assertFails(internalRef.get());
  });

  await t.test('CANNOT modify categories', async () => {
    const catRef = userDb.collection('categories').doc('design-creativity');
    await assertFails(catRef.delete());
  });
});

test('3. Administrator Access Rules (With Verified admin: true Claim)', async (t) => {
  const adminDb = testEnv
    .authenticatedContext('admin_user_456', {
      email: 'admin@unlockpremium.shop',
      email_verified: true,
      admin: true, // Verified Custom Claim
    })
    .firestore();

  await t.test('CAN read published, draft, and unpublished products', async () => {
    await assertSucceeds(adminDb.collection('products').doc('canva-published').get());
    await assertSucceeds(adminDb.collection('products').doc('canva-draft').get());
    await assertSucceeds(adminDb.collection('products').doc('canva-unpublished').get());
  });

  await t.test('CAN create new products with valid schema', async () => {
    const newDoc = adminDb.collection('products').doc('spotify-new');
    await assertSucceeds(
      newDoc.set({
        ...validProductData,
        slug: 'spotify-premium-annual',
        name: 'Spotify Premium — Annual',
        brandName: 'Spotify',
      })
    );
  });

  await t.test('CANNOT create products with invalid schema (e.g. negative price)', async () => {
    const invalidDoc = adminDb.collection('products').doc('invalid-product');
    await assertFails(
      invalidDoc.set({
        ...validProductData,
        demoPriceMinor: -500, // Invalid: must be >= 0
      })
    );
  });

  await t.test('CANNOT create products with invalid status', async () => {
    const invalidStatusDoc = adminDb.collection('products').doc('invalid-status');
    await assertFails(
      invalidStatusDoc.set({
        ...validProductData,
        status: 'archived_invalid', // Not in ['draft', 'published', 'unpublished']
      })
    );
  });

  await t.test('CAN update existing products with valid data', async () => {
    const docRef = adminDb.collection('products').doc('canva-published');
    await assertSucceeds(
      docRef.update({
        demoPriceMinor: 9999,
        tagline: 'Updated tagline for Canva',
      })
    );
  });

  await t.test('CANNOT update existing products with invalid schema (e.g. negative price)', async () => {
    const docRef = adminDb.collection('products').doc('canva-published');
    await assertFails(
      docRef.update({
        demoPriceMinor: -100, // Invalid: must be >= 0
      })
    );
  });

  await t.test('CANNOT update existing products with invalid status', async () => {
    const docRef = adminDb.collection('products').doc('canva-published');
    await assertFails(
      docRef.update({
        status: 'invalid_status_enum',
      })
    );
  });

  await t.test('CONFIDENTIAL DATA LEAK PREVENTION: CANNOT inject costMinor or supplierName into public product doc on create', async () => {
    const leakDoc = adminDb.collection('products').doc('leaked-product');
    await assertFails(
      leakDoc.set({
        ...validProductData,
        costMinor: 2500, // FORBIDDEN in public collection
      })
    );
    await assertFails(
      leakDoc.set({
        ...validProductData,
        supplierName: 'Confidential Supplier Ltd', // FORBIDDEN in public collection
      })
    );
  });

  await t.test('CONFIDENTIAL DATA LEAK PREVENTION: CANNOT inject costMinor or supplierName into public product doc on update', async () => {
    const docRef = adminDb.collection('products').doc('canva-published');
    await assertFails(
      docRef.update({
        costMinor: 2500, // FORBIDDEN in public collection
      })
    );
    await assertFails(
      docRef.update({
        supplierName: 'Confidential Supplier Ltd', // FORBIDDEN in public collection
      })
    );
  });

  await t.test('CAN delete products', async () => {
    const docRef = adminDb.collection('products').doc('canva-unpublished');
    await assertSucceeds(docRef.delete());
  });

  await t.test('CONFIDENTIAL: CAN read and write to products_internal', async () => {
    const internalRef = adminDb.collection('products_internal').doc('canva-published');
    await assertSucceeds(internalRef.get());
    await assertSucceeds(
      internalRef.update({
        costMinor: 4200,
        accountManagementNotes: 'Negotiated lower partner allocation price.',
      })
    );
  });

  await t.test('CAN manage categories', async () => {
    const catRef = adminDb.collection('categories').doc('ai-tools');
    await assertSucceeds(
      catRef.set({
        name: 'AI Tools',
        description: 'Cutting edge AI platforms',
        displayOrder: 2,
      })
    );
  });
});

test('4. Public Query Restrictions (List & Filtering Rules)', async (t) => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  await t.test('Public query CAN list products when filtered by status == "published"', async () => {
    const query = unauthDb.collection('products').where('status', '==', 'published');
    await assertSucceeds(query.get());
  });

  await t.test('Public query CANNOT list unfiltered products (attempts to read drafts)', async () => {
    const unfilteredQuery = unauthDb.collection('products');
    await assertFails(unfilteredQuery.get());
  });

  await t.test('Public query CANNOT query for draft products', async () => {
    const draftQuery = unauthDb.collection('products').where('status', '==', 'draft');
    await assertFails(draftQuery.get());
  });
});

test('5. Administrative Claim Type Safety (Strict boolean true Required)', async (t) => {
  await t.test('User with string claim admin: "true" CANNOT write or read internal data', async () => {
    const fakeAdminDb = testEnv
      .authenticatedContext('impostor_string_claim', {
        email: 'impostor@example.com',
        admin: 'true', // String instead of boolean!
      })
      .firestore();

    await assertFails(fakeAdminDb.collection('products').doc('canva-published').update({ demoPriceMinor: 1000 }));
    await assertFails(fakeAdminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(fakeAdminDb.collection('products').doc('canva-draft').get());
  });

  await t.test('User with numeric claim admin: 1 CANNOT write or read internal data', async () => {
    const fakeAdminDb = testEnv
      .authenticatedContext('impostor_numeric_claim', {
        email: 'impostor2@example.com',
        admin: 1, // Number instead of boolean!
      })
      .firestore();

    await assertFails(fakeAdminDb.collection('products').doc('canva-published').update({ demoPriceMinor: 1000 }));
    await assertFails(fakeAdminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(fakeAdminDb.collection('products').doc('canva-draft').get());
  });

  await t.test('User with boolean claim admin: false CANNOT write or read internal data', async () => {
    const falseAdminDb = testEnv
      .authenticatedContext('false_admin_claim', {
        email: 'falseadmin@example.com',
        admin: false, // Boolean false
      })
      .firestore();

    await assertFails(falseAdminDb.collection('products').doc('canva-published').update({ demoPriceMinor: 1000 }));
    await assertFails(falseAdminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(falseAdminDb.collection('products').doc('canva-draft').get());
  });

  await t.test('User with admin: true but email_verified: false CANNOT write or read internal data', async () => {
    const unverifiedAdminDb = testEnv
      .authenticatedContext('unverified_admin_claim', {
        email: 'unverified@example.com',
        email_verified: false, // Email NOT verified!
        admin: true,
      })
      .firestore();

    await assertFails(unverifiedAdminDb.collection('products').doc('canva-published').update({ demoPriceMinor: 1000 }));
    await assertFails(unverifiedAdminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(unverifiedAdminDb.collection('products').doc('canva-draft').get());
  });
});

test('6. Immediate Authorization Revocation via /admin_users/{uid}', async (t) => {
  const adminDb = testEnv
    .authenticatedContext('admin_user_456', {
      email: 'admin@unlockpremium.shop',
      email_verified: true,
      admin: true,
    })
    .firestore();

  const unauthDb = testEnv.unauthenticatedContext().firestore();

  await t.test('Admin with active record CAN access protected internal data', async () => {
    await assertSucceeds(adminDb.collection('products_internal').doc('canva-published').get());
    await assertSucceeds(adminDb.collection('products').doc('canva-draft').get());
  });

  await t.test('Deactivating authorization record (active: false) DENIES access immediately', async () => {
    // Simulate server-side emergency deactivation
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('admin_users').doc('admin_user_456').update({
        active: false,
      });
    });

    // Request from client with still-valid admin: true token is REJECTED immediately!
    await assertFails(adminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(adminDb.collection('products').doc('canva-draft').get());
    await assertFails(adminDb.collection('products').doc('canva-published').update({ demoPriceMinor: 1234 }));
  });

  await t.test('Deleting authorization record DENIES access immediately', async () => {
    // Delete the record completely
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('admin_users').doc('admin_user_456').delete();
    });

    // Request is REJECTED immediately!
    await assertFails(adminDb.collection('products_internal').doc('canva-published').get());
    await assertFails(adminDb.collection('products').doc('canva-draft').get());
  });

  await t.test('Client CANNOT read /admin_users collection (even with admin claim)', async () => {
    await assertFails(adminDb.collection('admin_users').doc('admin_user_456').get());
    await assertFails(unauthDb.collection('admin_users').doc('admin_user_456').get());
  });

  await t.test('Client CANNOT write or modify /admin_users records (even with admin claim)', async () => {
    await assertFails(
      adminDb.collection('admin_users').doc('admin_user_456').set({
        active: true,
        hacked: true,
      })
    );
    await assertFails(
      unauthDb.collection('admin_users').doc('admin_user_456').set({
        active: true,
      })
    );
  });
});


