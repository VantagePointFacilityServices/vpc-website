// Vantage Point Cleaning — Step 2 instant-quote dialog (PRD D7, D9, D11, D12).
// After a successful /lead (lead:submitted with a quote_token) a <dialog> opens,
// the visitor describes the home, and we POST /quote and render the outcome.
// <body data-booking="off|on"> (default off) picks the call-to-confirm vs T&Cs ending.
(function (global) {
  var ENDPOINT = 'https://worker.vantagepointcleaning.com.au/quote';
  // First Clean booking link (PRD D11). Empty until Stripe + calendar exist (issue 17).
  var BOOKING_LINK = '';
  var PACKAGES = { essential: 'Essential', signature: 'Signature', reserve: 'Reserve' };
  var INCLUSIONS = {
    essential: 'Kitchen, bathrooms, floors, dusting, surfaces, beds, bins, high-touch areas and dishes.',
    signature: 'Everything in Essential, plus a rotation that includes oven and fridge interiors.',
    reserve: 'Everything in Signature, plus ironing up to 30 minutes, a presentation finish and a replacement-cleaner guarantee.'
  };
  var TERMS_TEXT = 'I confirm the details above are accurate and understand that Vantage Point Cleaning’s Terms & Conditions apply if the property’s actual size or condition differs materially from what I’ve declared.';
  var MSG_PERSONAL = 'We’ll prepare your quote personally — Blake will be in touch within one business day.';
  var MSG_ERROR = 'Sorry, we couldn’t get your quote. Your answers are still here — please try again, or email hello@vantagepointcleaning.com.au or call 07 5651 2257.';
  var MSG_CALL = 'Blake will call to confirm your First Clean.';
  var BOOL_FIELDS = ['study', 'media_room', 'multi_level', 'outdoor_alfresco', 'pool_surrounds', 'garage_serviced'];
  var COUNT_EXTRAS = ['laundry_loads', 'linen_beds', 'ironing_blocks', 'reset_blocks'];
  var BOOL_EXTRAS = ['oven', 'fridge', 'cabinets', 'interior_glass'];
  var ESSENTIAL_ONLY = ['oven', 'fridge', 'linen_beds', 'interior_glass']; // PRD D14: in Signature/Reserve already

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function formatAUD(n) {
    var v = Number(n);
    var s = (v % 1 === 0) ? String(v) : v.toFixed(2);
    return '$' + s.replace(/\B(?=(\d{3})+(?!\d))/, ',') + ' incl. GST';
  }

  function field(form, name) { return form.querySelector('[name="' + name + '"]'); }
  function str(form, name) { var el = field(form, name); return el && el.value != null ? String(el.value).trim() : ''; }
  function num(form, name, def) { var n = parseInt(str(form, name), 10); return isNaN(n) ? def : n; }
  function chk(form, name) { var el = field(form, name); return !!(el && el.checked); }

  // PRD D7 body. Extras not offered for the chosen package are sent as false/0.
  function buildQuoteBody(form, token) {
    var pkg = str(form, 'package') || 'signature';
    var essential = pkg === 'essential';
    var extras = {};
    BOOL_EXTRAS.forEach(function (k) { extras[k] = (ESSENTIAL_ONLY.indexOf(k) < 0 || essential) && chk(form, k); });
    COUNT_EXTRAS.forEach(function (k) { extras[k] = (ESSENTIAL_ONLY.indexOf(k) < 0 || essential) ? num(form, k, 0) : 0; });
    var body = {
      quote_token: token,
      package: pkg,
      bedrooms: num(form, 'bedrooms', 3),
      bathrooms: num(form, 'bathrooms', 2),
      powder_rooms: num(form, 'powder_rooms', 0),
      living_areas: num(form, 'living_areas', 1),
      balconies_count: num(form, 'balconies_count', 0),
      walk_in_robes_count: num(form, 'walk_in_robes_count', 0),
      property_condition: str(form, 'property_condition') || 'low',
      preferred_frequency: str(form, 'preferred_frequency') || 'fortnightly',
      weekend: str(form, 'day_type') === 'weekend',
      extras: extras
    };
    BOOL_FIELDS.forEach(function (k) { body[k] = chk(form, k); });
    ['pets_on_site', 'parking_access_notes', 'special_requests'].forEach(function (k) {
      var v = str(form, k).slice(0, 500);
      if (v) body[k] = v;
    });
    return body;
  }

  function postQuote(body, deps) {
    var win = deps.win || global;
    var doFetch = deps.fetch || (win && win.fetch && win.fetch.bind(win));
    return doFetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (res) {
        if (!res.ok) throw new Error('quote ' + res.status);
        return res.json();
      });
  }

  function bookingOn(doc) { return !!(doc.body && doc.body.getAttribute('data-booking') === 'on'); }

  // Result -> { kind, html, canBook }. Pure, so it is easy to test.
  function renderOutcome(result, booking, suburb) {
    if (result && result.outcome === 'priced') {
      var h = '<p class="quote-price"><strong>' + esc(formatAUD(result.per_visit_price)) + '</strong> per visit</p>' +
        '<p>Your first visit: <strong>' + esc(formatAUD(result.first_visit_price)) + '</strong></p>';
      if (Number(result.extras_price) > 0) h += '<p>Includes extras: ' + esc(formatAUD(result.extras_price)) + ' per visit</p>';
      if (booking) {
        h += '<label class="quote-terms"><input type="checkbox" name="terms" data-terms> ' + esc(TERMS_TEXT) + '</label>' +
          '<a class="btn btn-primary" data-book href="' + esc(BOOKING_LINK || '#') + '" aria-disabled="true">Book your First Clean</a>';
      } else {
        h += '<p>' + MSG_CALL + '</p>';
      }
      return { kind: 'priced', html: h, canBook: booking };
    }
    if (result && result.outcome === 'personal_quote') return { kind: 'personal_quote', html: '<p>' + MSG_PERSONAL + '</p>', canBook: false };
    if (result && result.outcome === 'out_of_area') {
      var where = suburb ? esc(suburb) : 'your area';
      return { kind: 'out_of_area', html: '<p>We don’t clean in ' + where + ' yet. We’ve saved your details and will let you know when we do.</p>', canBook: false };
    }
    return { kind: 'error', html: '<p>' + MSG_ERROR + '</p>', canBook: false };
  }

  function sel(name, from, to, def, last) {
    var o = '';
    for (var i = from; i <= to; i++) {
      var label = (i === 0 && name === 'bedrooms') ? 'Studio' : (i === to && last ? i + '+' : String(i));
      o += '<option value="' + i + '"' + (i === def ? ' selected' : '') + '>' + label + '</option>';
    }
    return '<label>' + name.replace(/_/g, ' ') + '<select name="' + name + '">' + o + '</select></label>';
  }
  function check(name, label, only) {
    return '<label class="quote-check"' + (only ? ' data-extra-for="' + only + '"' : '') + '><input type="checkbox" name="' + name + '"> ' + label + '</label>';
  }
  function count(name, label, max, only) {
    var o = '';
    for (var i = 0; i <= max; i++) o += '<option value="' + i + '">' + i + '</option>';
    return '<label' + (only ? ' data-extra-for="' + only + '"' : '') + '>' + label + '<select name="' + name + '">' + o + '</select></label>';
  }

  function dialogHTML() {
    var pk = Object.keys(PACKAGES).map(function (k) {
      return '<label class="quote-pkg"><input type="radio" name="package" value="' + k + '"' + (k === 'signature' ? ' checked' : '') + '> ' + PACKAGES[k] + '</label>';
    }).join('');
    return '<form method="dialog" class="quote-form" data-quote-form>' +
      '<button type="button" class="quote-close" data-close aria-label="Close">&times;</button>' +
      '<h2 id="quote-title">Your instant quote</h2>' +
      '<p>Thanks — tell us about your home and we’ll price it.</p>' +
      '<div data-fields>' +
      '<fieldset><legend>Package</legend>' + pk + '<p data-inclusions>' + esc(INCLUSIONS.signature) + '</p></fieldset>' +
      sel('bedrooms', 0, 6, 3, true) + sel('bathrooms', 1, 5, 2, true) + sel('powder_rooms', 0, 3, 0) + sel('living_areas', 1, 6, 1) +
      '<fieldset><legend>Home features</legend>' +
      check('study', 'Study') + check('media_room', 'Media room') + check('multi_level', 'Multi-level') +
      check('outdoor_alfresco', 'Outdoor / alfresco') + check('pool_surrounds', 'Pool surrounds') + check('garage_serviced', 'Garage') +
      count('balconies_count', 'Balconies', 3) + count('walk_in_robes_count', 'Walk-in robes', 3) + '</fieldset>' +
      '<label>Condition<select name="property_condition"><option value="low">Well maintained</option><option value="medium" selected>Lived in</option><option value="high">Needs a heavy clean</option></select></label>' +
      '<label>Frequency<select name="preferred_frequency"><option value="weekly">Weekly</option><option value="fortnightly" selected>Fortnightly</option></select></label>' +
      '<label>Preferred days<select name="day_type"><option value="weekday" selected>Weekday</option><option value="weekend">Weekend</option></select></label>' +
      '<fieldset><legend>Extras (each visit)</legend>' +
      check('oven', 'Oven', 'essential') + check('fridge', 'Fridge', 'essential') + check('cabinets', 'Cabinets') + check('interior_glass', 'Interior glass', 'essential') +
      count('laundry_loads', 'Laundry loads', 3) + count('linen_beds', 'Linen changes (beds)', 6, 'essential') +
      count('ironing_blocks', 'Ironing blocks', 4) + count('reset_blocks', 'Reset blocks', 4) + '</fieldset>' +
      '<label>Pets on site<input type="text" name="pets_on_site" maxlength="500"></label>' +
      '<label>Parking / access notes (please don’t include alarm or door codes)<input type="text" name="parking_access_notes" maxlength="500"></label>' +
      '<label>Special requests (no codes)<textarea name="special_requests" maxlength="500"></textarea></label>' +
      '<button type="submit" class="btn btn-primary" data-submit>Get my quote</button>' +
      '</div>' +
      '<p class="form-error" role="alert" data-error hidden>' + MSG_ERROR + '</p>' +
      '<div class="quote-result" data-result role="status" aria-live="polite" tabindex="-1" hidden></div>' +
      '</form>';
  }

  // Hide extras the chosen package already includes.
  function syncPackage(dialog, pkg) {
    var inc = dialog.querySelector('[data-inclusions]');
    if (inc) inc.textContent = INCLUSIONS[pkg] || '';
    var nodes = dialog.querySelectorAll ? dialog.querySelectorAll('[data-extra-for]') : [];
    Array.prototype.forEach.call(nodes, function (n) { n.hidden = pkg !== n.getAttribute('data-extra-for'); });
  }

  // Wire a dialog element. Returns the controller; `suburb` comes from step 1 when known.
  function wire(dialog, token, deps, suburb) {
    var form = dialog.querySelector('[data-quote-form]');
    var err = dialog.querySelector('[data-error]');
    var out = dialog.querySelector('[data-result]');
    var fields = dialog.querySelector('[data-fields]');
    var opener = deps.opener || null;
    var busy = false;

    function close() {
      if (dialog.close) dialog.close();
      if (opener && opener.focus) opener.focus();
    }
    var closeBtn = dialog.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);
    // Escape fires 'cancel' on a native <dialog>; the browser closes it, we restore focus.
    dialog.addEventListener('cancel', function () { if (opener && opener.focus) opener.focus(); });

    dialog.addEventListener('change', function (e) {
      if (e && e.target && e.target.name === 'package') syncPackage(dialog, e.target.value);
    });
    syncPackage(dialog, 'signature');

    function onSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (busy) return Promise.resolve();
      busy = true;
      err.hidden = true;
      return postQuote(buildQuoteBody(form, token), deps).then(function (result) {
        busy = false;
        var r = renderOutcome(result, bookingOn(deps.doc), suburb);
        if (r.kind === 'error') { err.hidden = false; return r; }
        out.innerHTML = r.html;
        out.hidden = false;
        if (fields) fields.hidden = true;
        var terms = out.querySelector('[data-terms]');
        var book = out.querySelector('[data-book]');
        if (terms && book) {
          book.setAttribute('aria-disabled', 'true');
          terms.addEventListener('change', function () {
            book.setAttribute('aria-disabled', terms.checked ? 'false' : 'true');
          });
          book.addEventListener('click', function (ev) { if (book.getAttribute('aria-disabled') === 'true' && ev.preventDefault) ev.preventDefault(); });
        }
        if (out.focus) out.focus();
        return r;
      }, function () {
        // Keep every input; show the email/phone fallback.
        busy = false;
        err.hidden = false;
      });
    }
    form.addEventListener('submit', onSubmit);
    return { submit: onSubmit, close: close };
  }

  function openQuoteDialog(doc, token, deps) {
    deps = deps || {};
    deps.doc = doc;
    var dialog = doc.createElement('dialog');
    dialog.className = 'quote-dialog';
    dialog.setAttribute('aria-labelledby', 'quote-title');
    dialog.innerHTML = dialogHTML();
    doc.body.appendChild(dialog);
    deps.opener = deps.opener || doc.activeElement;
    var ctl = wire(dialog, token, deps, deps.suburb);
    dialog.addEventListener('close', function () { if (dialog.remove) dialog.remove(); });
    if (dialog.showModal) dialog.showModal();
    var first = dialog.querySelector('[name="package"]');
    if (first && first.focus) first.focus();
    return ctl;
  }

  // Open only for a real /lead success: needs a quote_token; honeypot results carry none.
  function handleLeadSubmitted(doc, detail, deps) {
    if (!detail || detail.caught || !detail.quote_token) return null;
    return openQuoteDialog(doc, detail.quote_token, deps);
  }

  function init(doc, deps) {
    doc.addEventListener('lead:submitted', function (e) { handleLeadSubmitted(doc, e.detail, deps); });
  }

  var api = {
    ENDPOINT: ENDPOINT, TERMS_TEXT: TERMS_TEXT, MSG_PERSONAL: MSG_PERSONAL, MSG_CALL: MSG_CALL,
    formatAUD: formatAUD, buildQuoteBody: buildQuoteBody, postQuote: postQuote, renderOutcome: renderOutcome,
    dialogHTML: dialogHTML, wire: wire, openQuoteDialog: openQuoteDialog, handleLeadSubmitted: handleLeadSubmitted, init: init
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.vpcQuote = api;
})(typeof window !== 'undefined' ? window : undefined);
