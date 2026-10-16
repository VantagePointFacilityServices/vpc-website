// Vantage Point Cleaning — Stage 1 lead form submit (PRD D5).
// submitLead(form) POSTs the lead to the Worker and resolves { contact_id, quote_token }
// (step 2 chains the quote dialog onto this). Forms stay hidden while
// <body data-lead-forms="off"> and the .contact-cta box shows instead (PRD D4).
(function (global) {
  var ENDPOINT = 'https://worker.vantagepointcleaning.com.au/lead';
  // One shared place for the Turnstile site key. Empty until the VPC widget exists (issue 11).
  var TURNSTILE_SITEKEY = '';
  var FIELDS = ['first_name', 'last_name', 'email', 'phone', 'postcode', 'website_url', 'company', 'conversion_page'];

  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el && el.value ? String(el.value).trim() : '';
  }

  function buildBody(form, win) {
    var body = {};
    FIELDS.forEach(function (n) { body[n] = val(form, n); });
    if (!body.conversion_page) body.conversion_page = ((win && win.location && win.location.pathname) || '/');
    body['cf-turnstile-response'] = val(form, 'cf-turnstile-response');
    var utms = (win && win.vpcUtm && win.vpcUtm.read()) || {};
    Object.keys(utms).forEach(function (k) { if (/^utm_/.test(k) && utms[k]) body[k] = utms[k]; });
    return body;
  }

  function isCaught(form) {
    return !!(val(form, 'website_url') || val(form, 'company'));
  }

  function submitLead(form, deps) {
    deps = deps || {};
    var win = deps.win || global;
    var doFetch = deps.fetch || (win && win.fetch && win.fetch.bind(win));
    var body = buildBody(form, win);
    // Honeypot: look like success, send nothing.
    if (isCaught(form)) return Promise.resolve({ ok: true, caught: true });
    return doFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error('lead ' + res.status);
      return res.json();
    }).then(function (data) {
      return { contact_id: data.contact_id, quote_token: data.quote_token };
    });
  }

  function leadFormsOn(doc) {
    return !!(doc.body && doc.body.getAttribute('data-lead-forms') === 'on');
  }

  // Reveal lead forms and hide the contact box when the switch is on.
  function applySwitch(doc) {
    if (!leadFormsOn(doc)) return false;
    doc.querySelectorAll('form[data-lead-form]').forEach(function (f) {
      f.hidden = false;
      var cta = f.previousElementSibling;
      if (cta && cta.classList.contains('contact-cta')) cta.hidden = true;
    });
    return true;
  }

  function init(doc, deps) {
    deps = deps || {};
    var on = applySwitch(doc);
    doc.querySelectorAll('.assessment-form .turnstile-widget').forEach(function (el) {
      if (TURNSTILE_SITEKEY) el.setAttribute('data-sitekey', TURNSTILE_SITEKEY);
      var win = deps.win || global;
      if (!on || !el.getAttribute('data-sitekey') || !win.turnstile) return;
      win.turnstile.render(el, { sitekey: el.getAttribute('data-sitekey'), action: 'lead', appearance: 'interaction-only' });
    });
    doc.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = form.querySelector('.form-fields');
        var success = form.querySelector('.form-success');
        var err = form.querySelector('.form-error');
        if (err) err.hidden = true;
        submitLead(form, deps).then(function (result) {
          if (fields) fields.style.display = 'none';
          if (success) success.classList.add('show');
          form.dispatchEvent(new (deps.CustomEvent || global.CustomEvent)('lead:submitted', { bubbles: true, detail: result }));
        }, function () {
          // Keep every field; offer the email/phone fallback.
          if (err) err.hidden = false;
        });
      });
    });
  }

  var api = { ENDPOINT: ENDPOINT, TURNSTILE_SITEKEY: TURNSTILE_SITEKEY, buildBody: buildBody, submitLead: submitLead, applySwitch: applySwitch, init: init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) { global.vpcLead = api; global.submitLead = submitLead; }
})(typeof window !== 'undefined' ? window : undefined);
