const http = require('http');
const assert = require('assert');
const { createServer } = require('./server.cjs');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 PAPABVTIFY SUITE: ACCOUNT ISOLATION & ROOM SYNC');
  console.log('====================================================\n');

  // Start test server on dynamic/test port 5299
  const server = createServer();
  const PORT = 5299;
  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', resolve);
    server.on('error', reject);
  });
  console.log(`[Test Server] Running on http://127.0.0.1:${PORT}`);

  const baseUrl = `http://127.0.0.1:${PORT}`;

  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqHeaders = { 'Content-Type': 'application/json', ...headers };
      const req = http.request(url, { method, headers: reqHeaders }, (res) => {
        let resBody = '';
        res.on('data', chunk => { resBody += chunk; });
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(resBody); } catch (_) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawText: resBody
          });
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    // ---------------------------------------------------------------
    // TEST 1: API Catch-all & Non-HTML Check
    // ---------------------------------------------------------------
    console.log('\n[TEST 1] Verifying API 404 Catch-All & Non-HTML behavior...');
    const catchAllRes = await request('GET', '/api/unmatched/test_route_404');
    assert.strictEqual(catchAllRes.status, 404, 'Catch-all must return 404');
    assert.ok(catchAllRes.headers['content-type'].includes('application/json'), 'Catch-all must be JSON');
    assert.ok(!catchAllRes.rawText.includes('<!DOCTYPE'), 'Must NEVER return HTML for /api/* routes');
    console.log('  ✅ PASSED: /api/* routes return clean JSON 404, zero HTML leakage.');

    // ---------------------------------------------------------------
    // TEST 2: Account A Registration & Data Isolation
    // ---------------------------------------------------------------
    console.log('\n[TEST 2] Registering User A & Syncing Private Data...');
    const userAUsername = 'user_alpha_' + Date.now();
    const regARes = await request('POST', '/api/auth/register', {
      username: userAUsername,
      displayName: 'User Alpha',
      email: `${userAUsername}@papabvtify.test`,
      password: 'password123'
    });
    assert.strictEqual(regARes.status, 200, 'User A registration must succeed');
    assert.ok(regARes.body.token, 'User A must receive session token');
    const tokenA = regARes.body.token;
    const userA = regARes.body.user;

    // User A syncs private playlists and favorites
    const syncARes = await request('POST', '/api/user/sync', {
      favorites: ['song_alpha_01', 'song_alpha_02'],
      playlists: [
        { id: 'pl_alpha_rock', title: 'Alpha Rock Hits', songCount: 2, songIds: ['song_alpha_01', 'song_alpha_02'] }
      ],
      recentlyPlayed: [{ id: 'song_alpha_01', title: 'Alpha Anthem', artist: 'Artist A', duration: 200 }],
      stats: {
        totalListeningSeconds: 3600,
        totalSongsPlayed: 12,
        songPlayCounts: { 'song_alpha_01': { count: 8 } },
        artistPlayCounts: { 'Artist A': { count: 8 } },
        dailyListeningSeconds: {},
        history: []
      }
    }, { 'Authorization': `Bearer ${tokenA}` });
    assert.strictEqual(syncARes.status, 200, 'User A sync must succeed');

    // Fetch User A data back
    const dataARes = await request('GET', '/api/user/data', null, { 'Authorization': `Bearer ${tokenA}` });
    assert.strictEqual(dataARes.status, 200);
    assert.deepStrictEqual(dataARes.body.data.favorites, ['song_alpha_01', 'song_alpha_02']);
    assert.strictEqual(dataARes.body.data.playlists[0].title, 'Alpha Rock Hits');
    console.log('  ✅ PASSED: User A private data saved and retrieved with authenticated identity.');

    // ---------------------------------------------------------------
    // TEST 3: Account B Registration & Zero Data Bleed
    // ---------------------------------------------------------------
    console.log('\n[TEST 3] Registering User B & Verifying Zero Contamination from User A...');
    const userBUsername = 'user_beta_' + Date.now();
    const regBRes = await request('POST', '/api/auth/register', {
      username: userBUsername,
      displayName: 'User Beta',
      email: `${userBUsername}@papabvtify.test`,
      password: 'password456'
    });
    assert.strictEqual(regBRes.status, 200);
    const tokenB = regBRes.body.token;

    // Check User B initial data - MUST BE COMPLETELY CLEAN
    const dataBRes = await request('GET', '/api/user/data', null, { 'Authorization': `Bearer ${tokenB}` });
    assert.strictEqual(dataBRes.status, 200);
    assert.deepStrictEqual(dataBRes.body.data.favorites, [], 'User B favorites must start empty');
    assert.deepStrictEqual(dataBRes.body.data.playlists, [], 'User B playlists must start empty');
    assert.strictEqual(dataBRes.body.data.stats.totalListeningSeconds, 0, 'User B stats must start at 0');
    console.log('  ✅ PASSED: User B has zero contamination from User A.');

    // User B adds their own private playlist
    const createPlBRes = await request('POST', '/api/user/playlists', {
      title: 'Beta Jazz Classics',
      description: 'Private Jazz'
    }, { 'Authorization': `Bearer ${tokenB}` });
    assert.strictEqual(createPlBRes.status, 200);
    const plBId = createPlBRes.body.playlist.id;

    // ---------------------------------------------------------------
    // TEST 4: IDOR Prevention & Cross-Account Isolation
    // ---------------------------------------------------------------
    console.log('\n[TEST 4] Testing IDOR & Cross-Account Security Boundaries...');
    // User B attempts to delete User A's playlist 'pl_alpha_rock'
    const idorDeleteRes = await request('DELETE', `/api/user/playlists?id=pl_alpha_rock`, null, {
      'Authorization': `Bearer ${tokenB}`
    });
    assert.strictEqual(idorDeleteRes.status, 200);

    // Verify User A still has their playlist completely intact
    const verifyAData = await request('GET', '/api/user/data', null, { 'Authorization': `Bearer ${tokenA}` });
    assert.strictEqual(verifyAData.body.data.playlists.length, 1);
    assert.strictEqual(verifyAData.body.data.playlists[0].id, 'pl_alpha_rock', 'User A playlist was not deleted by User B');

    // Unauthenticated request must be blocked
    const unauthRes = await request('GET', '/api/user/data');
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated access must be rejected');
    console.log('  ✅ PASSED: IDOR attacks prevented; authorization strictly bounded by server session.');

    // ---------------------------------------------------------------
    // TEST 5: Listening Room (Create, Join, Request, Host Approval, Sync, Leave, End)
    // ---------------------------------------------------------------
    console.log('\n[TEST 5] Testing Full Listening Room (Dengar Bersama) Lifecycle...');
    // 1. Host creates room
    const createRoomRes = await request('POST', '/api/rooms/create', {
      name: 'Studio Test Alpha',
      hostName: 'Host Alpha',
      initialSong: { id: 'song_lead', title: 'Lead Track', artist: 'Band A', duration: 180, thumbnail: 'http://img' },
      allowGuestControl: false
    });
    assert.strictEqual(createRoomRes.status, 200, 'Room creation must succeed');
    assert.ok(createRoomRes.body.room, 'Room object returned');
    const roomCode = createRoomRes.body.room.code;
    const hostParticipantId = createRoomRes.body.participantId;
    console.log(`  Room created successfully with Code: ${roomCode}`);

    // 2. Listener joins room
    const joinRes = await request('POST', '/api/rooms/join', {
      code: roomCode,
      name: 'Listener Beta'
    });
    assert.strictEqual(joinRes.status, 200, 'Room join must succeed');
    const listenerParticipantId = joinRes.body.participantId;
    assert.strictEqual(joinRes.body.isHost, false, 'Listener must not be host');

    // 3. Listener submits song request
    const songReqRes = await request('POST', '/api/rooms/request/create', {
      code: roomCode,
      song: { id: 'song_req_01', title: 'Requested Track', artist: 'Indie Artist', duration: 210, thumbnail: 'http://img' },
      requesterId: listenerParticipantId,
      requesterName: 'Listener Beta'
    });
    assert.strictEqual(songReqRes.status, 200, 'Song request creation must succeed');
    const requestId = songReqRes.body.request.id;

    // 4. Unauthorized non-host tries to approve request (Must Fail with 403)
    const rogueApproveRes = await request('POST', '/api/rooms/request/respond', {
      code: roomCode,
      requestId,
      action: 'accept',
      participantId: listenerParticipantId // Rogue listener trying to act as host
    });
    assert.strictEqual(rogueApproveRes.status, 403, 'Non-host must be rejected with 403 Forbidden');

    // 5. Genuine Host approves request
    const genuineApproveRes = await request('POST', '/api/rooms/request/respond', {
      code: roomCode,
      requestId,
      action: 'accept',
      participantId: hostParticipantId
    });
    assert.strictEqual(genuineApproveRes.status, 200, 'Host approval must succeed');
    assert.strictEqual(genuineApproveRes.body.queue.length, 2, 'Song must be added to room queue');

    // 6. Chat and Reaction
    const chatRes = await request('POST', '/api/rooms/chat', {
      code: roomCode,
      participantId: listenerParticipantId,
      participantName: 'Listener Beta',
      text: 'Halo semua, lagunya asik!'
    });
    assert.strictEqual(chatRes.status, 200);

    const reactRes = await request('POST', '/api/rooms/reaction', {
      code: roomCode,
      participantName: 'Listener Beta',
      emoji: '🔥'
    });
    assert.strictEqual(reactRes.status, 200);

    // 7. Host ends room
    const endRoomRes = await request('POST', '/api/rooms/end', {
      code: roomCode,
      participantId: hostParticipantId
    });
    assert.strictEqual(endRoomRes.status, 200, 'Host can end room');

    // Verify room is deleted
    const getRoomRes = await request('GET', `/api/rooms/get?code=${roomCode}`);
    assert.strictEqual(getRoomRes.status, 404, 'Ended room must be removed');
    console.log('  ✅ PASSED: Listening Room creation, authorization, requests, reactions, and termination verified.');

    // ---------------------------------------------------------------
    // TEST 6: Google Authentication Endpoint
    // ---------------------------------------------------------------
    console.log('\n[TEST 6] Testing Google Authentication & Status Endpoint...');
    const googleStatusRes = await request('GET', '/api/auth/google/status');
    assert.strictEqual(googleStatusRes.status, 200);

    const googleDirectRes = await request('POST', '/api/auth/google', {
      email: 'test_google_user@gmail.com',
      displayName: 'Google Test User',
      avatar: 'data:image/svg+xml;utf8,<svg></svg>'
    });
    assert.strictEqual(googleDirectRes.status, 200);
    assert.ok(googleDirectRes.body.token, 'Must return session token');
    assert.strictEqual(googleDirectRes.body.user.email, 'test_google_user@gmail.com');
    console.log('  ✅ PASSED: Google authentication endpoint works seamlessly.');

    console.log('\n====================================================');
    console.log('🎉 ALL 6 COMPREHENSIVE SUITE TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
