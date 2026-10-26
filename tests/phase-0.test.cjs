const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = file => readFileSync(path.join(root, file), 'utf8');
function storage() {
  const data = new Map();
  return {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key)};
}
function setup(files, extra = {}) {
  const context = vm.createContext({URL, console, localStorage: storage(), sessionStorage: storage(), location: {href: 'http://localhost:8080/', origin: 'http://localhost:8080'}, ...extra});
  context.window = context;
  // Any unintended real network request fails this offline suite.
  context.fetch = () => {throw new Error('Network forbidden in offline tests');};
  for (const file of files) vm.runInContext(source(file), context, {filename: file});
  return context;
}

test('staging guard blocks foreign URLs before any request and rejects redirects', async () => {
  const c = setup(['config.js']);
  let calls = 0;
  c.fetch = async (_url, options) => {calls++; assert.equal(options.redirect, 'error'); return {ok: true};};
  const guard = c.CineWaveStaging;
  for (const value of ['https://example.invalid/auth/v1', 'http://zayssiouqexwdicudalc.supabase.co', 'https://zayssiouqexwdicudalc.supabase.co.evil.invalid', 'https://user:pass@zayssiouqexwdicudalc.supabase.co']) {
    assert.throws(() => guard.fetch(value), /only the staging/);
  }
  assert.equal(calls, 0);
  await guard.fetch(c.CINEWAVE_CONFIG.url + '/rest/v1/movies', {redirect: 'follow'});
  assert.equal(calls, 1);
  assert.ok(Object.isFrozen(c.CINEWAVE_CONFIG));
});

test('catalog maps multilingual metadata, genres and safe artwork without changing data', () => {
  const c = setup(['catalog.js']);
  const row = {id: 7, title_en: ' Film ', title_hy: 'Ֆիլմ', release_date: '2020-01-01', genre_names: ['Science Fiction', 'Գիտաֆանտաստիկ'], genre_ids: [878], poster_path: '/poster.jpg', media_type: 'tv'};
  const before = JSON.stringify(row);
  const movie = c.mapCatalogMovie(row);
  assert.equal(movie.id, 'catalog:7');
  assert.equal(movie.kind, 'TV Show');
  assert.equal(movie.year, 2020);
  assert.equal(Array.from(movie.genres).join(','), 'Sci-Fi');
  assert.equal(c.localizedMovie(movie, 'hy').title, 'Ֆիլմ');
  assert.equal(c.localizedMovie(movie, 'ru').title, 'Film');
  assert.equal(movie.img, 'https://image.tmdb.org/t/p/w500/poster.jpg');
  assert.equal(JSON.stringify(row), before);
  for (const value of [null, '', 'undefined', 'javascript:alert(1)', 'https://user:pass@example.invalid/a.jpg']) assert.equal(c.posterURL(value), 'assets/poster-fallback.svg');
  assert.equal(c.backdropURL(null), null);
  assert.match(source('assets/poster-fallback.svg'), /viewBox="0 0 500 750"/);
  assert.equal(c.escapeHTML('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

for (const page of ['storefront', 'admin']) {
  test(`auth ${page}: PKCE, tab session isolation, guarded SDK transport and local logout`, async () => {
    let options, signedOut;
    const client = {auth: {signOut: async value => {signedOut = value; return {error: null};}}};
    const c = setup(['config.js', 'auth-client.js'], {
      document: {body: {classList: {contains: () => page === 'storefront'}}},
      supabase: {createClient: (url, key, opts) => {assert.equal(url, 'https://zayssiouqexwdicudalc.supabase.co'); options = opts; return client;}}
    });
    assert.equal(options.auth.flowType, 'pkce');
    assert.equal(options.auth.detectSessionInUrl, page === 'storefront');
    assert.equal(c.CineWaveAuth.client, client);
    assert.throws(() => options.global.fetch('https://example.invalid'), /only the staging/);
    const store = options.auth.storage;
    for (const suffix of ['', '-code-verifier', '-user']) store.setItem('cinewave:session' + suffix, 'test');
    assert.equal(c.sessionStorage.getItem('cinewave:session'), 'test');
    assert.equal(c.localStorage.getItem('cinewave:session'), null);
    assert.equal(c.localStorage.getItem('cinewave:session-code-verifier'), 'test');
    assert.equal((await c.CineWaveAuth.signOut()).failed, false);
    assert.equal(signedOut.scope, 'local');
    for (const suffix of ['', '-code-verifier', '-user']) assert.equal(store.getItem('cinewave:session' + suffix), null);
  });
}

test('auth clears local session even if logout fails or browser storage is unavailable', async () => {
  const unavailable = {getItem() {throw Error();}, setItem() {throw Error();}, removeItem() {throw Error();}};
  let cStorage;
  const c = setup(['config.js', 'auth-client.js'], {
    document: {body: {classList: {contains: () => false}}}, localStorage: unavailable, sessionStorage: unavailable,
    supabase: {createClient: (_url, _key, opts) => {cStorage = opts.auth.storage; return {auth: {signOut: async () => {throw Error('offline');}}};}}
  });
  cStorage.setItem('cinewave:session', 'test');
  assert.equal(cStorage.getItem('cinewave:session'), 'test');
  assert.equal((await c.CineWaveAuth.signOut()).failed, true);
  assert.equal(cStorage.getItem('cinewave:session'), null);
});

for (const file of ['model.js', 'admin/model.js']) {
  test(`${file}: admin validates payloads, renditions, uploads and verification`, () => {
    const model = setup([file]).CineWaveAdminModel;
    const row = model.payload({title_en: ' Film ', genres: 'Drama, Drama', watch_url: 'https://media.invalid/film.mp4'}, []);
    assert.equal(row.title_en, 'Film');
    assert.equal(Array.from(row.genre_names).join(','), 'Drama');
    assert.equal(model.ready(row), false);
    assert.throws(() => model.payload({}, []), /English title/);
    assert.throws(() => model.payload({title_en: 'Film', watch_url: 'http://media.invalid/film.mp4'}, []), /HTTPS/);
    assert.throws(() => model.renditions([{height: 720, url: 'https://media.invalid/a.mp4'}, {height: 720, url: 'https://media.invalid/b.mp4'}]), /distinct/);
    assert.throws(() => model.asset({type: 'image/svg+xml', size: 100}), /not accepted/);
    assert.throws(() => model.asset({type: 'image/png', size: 8388609}), /8 MB/);
    assert.equal(model.asset({type: 'image/webp', size: 100}), 'webp');
  });
}

test('playback needs matching rights evidence and rejects unsafe media sources', () => {
  const c = setup(['catalog.js', 'availability.js', 'player.js']);
  const movie = {video: 'https://media.invalid/film.mp4', titles: {en: 'Film'}, year: 2020};
  assert.equal(c.approvedPlayback(movie), false);
  movie.approval = {watch_url: movie.video, license_verified: true, playback_verified: true, commercial_reuse_verified: true, license_source: 'https://rights.invalid/proof', license_terms_source: 'https://rights.invalid/terms'};
  assert.equal(c.approvedPlayback(movie), true);
  movie.approval.watch_url = 'https://media.invalid/other.mp4';
  assert.equal(c.approvedPlayback(movie), false);
  const player = c.CineWavePlayer;
  for (const value of ['javascript:alert(1)', 'http://media.invalid/a.mp4', 'https://user:pass@media.invalid/a.mp4', '']) assert.equal(player.sourceURL(value), null);
  assert.equal(player.sourceURL('/fixture.mp4'), 'http://localhost:8080/fixture.mp4');
  assert.equal(player.sourceURL('https://media.invalid/a.m3u8'), 'https://media.invalid/a.m3u8');
  assert.equal(player.timeLabel(3661), '1:01:01');
  c.localStorage.setItem('cinewave:playback:film', JSON.stringify({time: 25, duration: 100}));
  assert.equal(player.progressFor('film'), 25);
  c.localStorage.setItem('cinewave:playback:film', 'broken');
  assert.equal(player.progressFor('film'), 0);
});

test('static checks reject foreign repository, foreign backend and privileged keys', () => {
  const {validateRemote, validateSource} = require('../scripts/check-staging.cjs');
  validateRemote('https://github.com/aanun1740-netizen/CineWave-Test-.git');
  assert.throws(() => validateRemote('https://github.com/example/other.git'), /Non-staging/);
  assert.throws(() => validateSource('https://' + 'foreignproject' + '.supabase' + '.co', 'fixture'), /Forbidden backend/);
  assert.throws(() => validateSource('sb_' + 'secret_' + 'fixture', 'fixture'), /Privileged credential/);
});

test('changed backend configuration cannot create an auth client', () => {
  const c = setup(['config.js'], {supabase: {createClient() {assert.fail('SDK must not be created');}}});
  c.CINEWAVE_CONFIG = {url: 'https://example.invalid', key: 'fixture'};
  assert.throws(() => vm.runInContext(source('auth-client.js'), c), /only the staging/);
});
