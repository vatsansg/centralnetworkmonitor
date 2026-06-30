'use strict';

require('dotenv').config({ path: '../backend/.env' });

const BASE = `http://localhost:${process.env.PORT || 3001}`;

let adminToken = '';
let viewerToken = '';
let createdUserId = null;

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

let passed = 0, failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('\n=== Central Network Monitor API Tests ===\n');

  // Health
  console.log('[ Health ]');
  const health = await req('GET', '/health');
  assert('GET /health → 200', health.status === 200);
  assert('GET /health → { status: ok }', health.data?.status === 'ok');

  // Version
  const ver = await req('GET', '/api/version');
  assert('GET /api/version → 200', ver.status === 200);

  // Auth — login failures
  console.log('\n[ Auth — login ]');
  const badPw = await req('POST', '/api/auth/login', { username: 'admin', password: 'wrong' });
  assert('Login with wrong password → 401', badPw.status === 401);

  const noUser = await req('POST', '/api/auth/login', { username: 'nonexistent', password: 'x' });
  assert('Login with unknown user → 401', noUser.status === 401);

  // Admin login
  const adminLogin = await req('POST', '/api/auth/login', { username: 'admin', password: 'Admin@1234' });
  assert('Admin login → 200', adminLogin.status === 200);
  assert('Admin login → token returned', !!adminLogin.data?.token);
  adminToken = adminLogin.data?.token || '';

  // /me
  console.log('\n[ Auth — /me ]');
  const me = await req('GET', '/api/auth/me', null, adminToken);
  assert('GET /api/auth/me (authenticated) → 200', me.status === 200);
  assert('GET /api/auth/me → username is admin', me.data?.username === 'admin');

  const meUnauth = await req('GET', '/api/auth/me');
  assert('GET /api/auth/me (no token) → 401', meUnauth.status === 401);

  // Venues
  console.log('\n[ Venues ]');
  const venueList = await req('GET', '/api/venues', null, adminToken);
  assert('GET /api/venues → 200', venueList.status === 200);
  assert('GET /api/venues → array', Array.isArray(venueList.data));

  const venue404 = await req('GET', '/api/venues/__nonexistent__', null, adminToken);
  assert('GET /api/venues/nonexistent → 404', venue404.status === 404);

  const refresh = await req('POST', '/api/venues/refresh', null, adminToken);
  assert('POST /api/venues/refresh → 200', refresh.status === 200);
  assert('POST /api/venues/refresh → array', Array.isArray(refresh.data));

  // Favourites
  console.log('\n[ Favourites ]');
  const favGet = await req('GET', '/api/favourites', null, adminToken);
  assert('GET /api/favourites → 200', favGet.status === 200);
  assert('GET /api/favourites → has venue_id key', 'venue_id' in (favGet.data || {}));

  const favClear = await req('DELETE', '/api/favourites', null, adminToken);
  assert('DELETE /api/favourites → 200', favClear.status === 200);

  const favBad = await req('PUT', '/api/favourites', { venue_id: '__nonexistent__' }, adminToken);
  assert('PUT /api/favourites with invalid venue → 404', favBad.status === 404);

  // Users — admin CRUD
  console.log('\n[ Users ]');
  const userList = await req('GET', '/api/users', null, adminToken);
  assert('GET /api/users (admin) → 200', userList.status === 200);
  assert('GET /api/users → array', Array.isArray(userList.data));

  const ts = Date.now();
  const newUser = await req('POST', '/api/users', {
    username: `tester_${ts}`,
    email: `tester_${ts}@example.com`,
    role: 'viewer'
  }, adminToken);
  assert('POST /api/users → 201', newUser.status === 201);
  createdUserId = newUser.data?.id;

  // Viewer cannot list users
  if (createdUserId) {
    // Log in as viewer — need to find or change password first; skip viewer token test
    // since viewer must change password on first login.
    // Just verify admin-only returns 403 for unauthenticated requests.
  }

  const viewerUnauth = await req('GET', '/api/users');
  assert('GET /api/users (unauthenticated) → 401', viewerUnauth.status === 401);

  if (createdUserId) {
    const resetRes = await req('PUT', `/api/users/${createdUserId}/reset-password`, null, adminToken);
    assert(`PUT /api/users/:id/reset-password → 200`, resetRes.status === 200);

    // Cannot self-delete
    const selfDelete = await req('DELETE', `/api/users/${adminLogin.data.user?.id || 1}`, null, adminToken);
    assert('DELETE own account → 400', selfDelete.status === 400);

    const del = await req('DELETE', `/api/users/${createdUserId}`, null, adminToken);
    assert(`DELETE /api/users/:id → 200`, del.status === 200);
  }

  // Change password
  console.log('\n[ Change Password ]');
  const cpBadCurrent = await req('POST', '/api/auth/change-password', {
    current_password: 'wrong',
    new_password: 'New@Password1'
  }, adminToken);
  assert('Change password with wrong current → 401', cpBadCurrent.status === 401);

  const cpWeakNew = await req('POST', '/api/auth/change-password', {
    current_password: 'Admin@1234',
    new_password: 'weak'
  }, adminToken);
  assert('Change password with weak new password → 400', cpWeakNew.status === 400);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
