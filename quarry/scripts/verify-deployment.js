#!/usr/bin/env node
/**
 * Deployment verification script for Seraphim.
 * Run after deploy to verify critical endpoints and config.
 * Usage: node scripts/verify-deployment.js [APP_BASE_URL]
 */
const baseUrl = process.argv[2] || process.env.VITE_APP_BASE_URL || process.env.VITE_BASE44_APP_BASE_URL || '';

async function check(url, label) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const ok = res.ok || res.status === 401; // 401 = auth required, app is up
    console.log(ok ? `✓ ${label}` : `✗ ${label} (${res.status})`);
    return ok;
  } catch (err) {
    console.log(`✗ ${label}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Seraphim - Deployment Verification\n');

  if (!process.env.VITE_BASE44_APP_ID && !process.env.VITE_APP_ID) {
    console.log('⚠ App ID not set (optional for URL checks)');
  }

  if (!baseUrl) {
    console.log('Usage: node scripts/verify-deployment.js <APP_BASE_URL>');
    console.log('   or: VITE_APP_BASE_URL=https://... node scripts/verify-deployment.js');
    process.exit(1);
  }

  const root = baseUrl.replace(/\/$/, '');
  const results = await Promise.all([
    check(`${root}/`, 'App root'),
    check(`${root}/api/apps/public`, 'Public API'),
  ]);

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
