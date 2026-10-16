document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Nav dropdown — disclosure pattern. Desktop hover/focus opening is handled
  // in CSS; this covers click, Escape and dismissal. Packages is a button that
  // toggles its menu; Locations is a real link with a separate chevron button
  // (as on vpfs-website) so touch devices can still open its menu.
  document.querySelectorAll('.has-dropdown').forEach(function (item) {
    var btn = item.querySelector('button.nav-dropdown-toggle, .nav-dropdown-chevron');
    if (!btn) return;

    function setOpen(isOpen) {
      item.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setOpen(!item.classList.contains('open'));
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && item.classList.contains('open')) {
        setOpen(false);
        btn.focus();
      }
    });

    // Click outside, and tabbing out of the group, both close it.
    document.addEventListener('click', function (e) {
      if (!item.contains(e.target)) setOpen(false);
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) setOpen(false);
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    q.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
      });
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Stage 1 lead forms: switch, Turnstile, submit (see lead.js)
  if (window.vpcLead) window.vpcLead.init(document);
  // Step 2 instant-quote dialog opens on a successful /lead (see quote.js)
  if (window.vpcQuote) window.vpcQuote.init(document);
});
