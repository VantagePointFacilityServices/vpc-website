// Vantage Point Cleaning — UTM and landing-page capture.
// Ad links land on any page; the visitor may browse on before submitting the
// form. This stores utm_* tags and the landing page in sessionStorage
// (first-touch wins within a session unless a new campaign link arrives).
// Exposes window.vpcUtm.read() -> { utm_source?, ..., landing_page? }.
// Storage can be blocked (private mode): nothing here ever throws.
(function (global) {
  var KEY = 'vpc_utm';
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var MAX = 200;

  function fromUrl(loc) {
    var out = {};
    var p;
    try { p = new URLSearchParams(loc.search || ''); } catch (e) { return out; }
    PARAMS.forEach(function (n) {
      var v = (p.get(n) || '').trim();
      if (v) out[n] = v.slice(0, MAX);
    });
    return out;
  }

  function store(win) {
    try { return win.sessionStorage; } catch (e) { return null; }
  }

  function load(s) {
    try {
      var parsed = JSON.parse(s.getItem(KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) { return {}; }
  }

  function capture(win) {
    try {
      var loc = win.location;
      var utms = fromUrl(loc);
      var s = store(win);
      var existing = s ? load(s) : {};
      var hasNew = Object.keys(utms).length > 0;
      if (!hasNew && existing.landing_page) return;
      utms.landing_page = ((loc.pathname || '/') + '').slice(0, MAX);
      if (s) s.setItem(KEY, JSON.stringify(utms));
    } catch (e) { /* storage blocked */ }
  }

  function read(win) {
    try {
      var s = store(win);
      var saved = s ? load(s) : {};
      var cur = fromUrl(win.location);
      return Object.keys(cur).length ? Object.assign({ landing_page: saved.landing_page }, cur) : saved;
    } catch (e) { return {}; }
  }

  var api = { KEY: KEY, capture: capture, read: function () { return read(global); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) { global.vpcUtm = api; capture(global); }
})(typeof window !== 'undefined' ? window : undefined);
