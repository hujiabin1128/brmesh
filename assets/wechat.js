/* ===========================================================
   BRmesh — WeChat in-app browser helper
   -----------------------------------------------------------
   WeChat's built-in browser (X5 / WKWebView) blocks direct
   navigation to apps.apple.com and play.google.com. There is
   no way to bypass it from a plain static page, so instead we
   detect WeChat and show a guide telling the user to open the
   page in a real browser.

   No dependencies. Drop this file into every page.
   =========================================================== */

(function () {
  'use strict';

  var ua = navigator.userAgent || '';

  /* --- environment detection --- */
  // MicroMessenger = WeChat. Exclude wxwork (WeCom) which allows normal links.
  var isWeChat = /MicroMessenger/i.test(ua) && !/wxwork/i.test(ua);
  if (!isWeChat) return;

  var isIOS = /iPhone|iPad|iPod|iOS/i.test(ua);
  var isAndroid = /Android/i.test(ua);

  /* --- build the overlay --- */
  var overlay = document.createElement('div');
  overlay.className = 'wx-mask';
  overlay.setAttribute('role', 'dialog');
  overlay.innerHTML =
    '<div class="wx-arrow">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
        '<circle cx="5" cy="12" r="2.2" fill="currentColor"/>' +
        '<circle cx="12" cy="12" r="2.2" fill="currentColor"/>' +
        '<circle cx="19" cy="12" r="2.2" fill="currentColor"/>' +
      '</svg>' +
      '<span>Tap <b>&middot;&middot;&middot;</b> in the top-right corner</span>' +
    '</div>' +
    '<div class="wx-box">' +
      '<h3>Open in your browser to download</h3>' +
      '<p>WeChat blocks links to the App Store and Google Play.<br>' +
      'Tap <b>&middot;&middot;&middot;</b> at the top right, then choose ' +
      '<b>' + (isIOS ? 'Open in Safari' : 'Open in Browser') + '</b>.</p>' +
      '<button type="button" class="wx-copy" id="wxCopyBtn">Copy link</button>' +
      '<p class="wx-hint" id="wxCopyHint" hidden>Link copied &mdash; paste it into your browser.</p>' +
      '<button type="button" class="wx-close" id="wxCloseBtn">Got it</button>' +
    '</div>';

  document.body.appendChild(overlay);

  function openMask()  { overlay.classList.add('is-open'); }
  function closeMask() { overlay.classList.remove('is-open'); }

  document.getElementById('wxCloseBtn').addEventListener('click', closeMask);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeMask();
  });

  document.getElementById('wxCopyBtn').addEventListener('click', function () {
    var url = location.href.split('#')[0];
    var hint = document.getElementById('wxCopyHint');
    var done = function () { hint.hidden = false; };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
      document.body.removeChild(ta);
    }
  });

  /* --- intercept store links --- */
  var STORE_RE = /(apps\.apple\.com|itunes\.apple\.com|play\.google\.com)/i;

  // We deliberately do NOT try window.open() first: when WeChat blocks the
  // link it often navigates the current tab to a "已停止访问该网页" error page,
  // which loses the user. Showing the guide immediately is more reliable.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (!STORE_RE.test(a.getAttribute('href') || '')) return;

    e.preventDefault();
    openMask();
  }, false);

  /* --- persistent hint bar on the download page --- */
  if (/(^|\/)download\.html$/.test(location.pathname)) {
    var bar = document.createElement('div');
    bar.className = 'wx-bar';
    bar.innerHTML =
      '<span>WeChat can\'t open store links. Tap <b>&middot;&middot;&middot;</b> → ' +
      (isIOS ? '<b>Open in Safari</b>' : '<b>Open in Browser</b>') + '.</span>' +
      '<button type="button" id="wxBarBtn">How?</button>';
    document.body.appendChild(bar);
    document.getElementById('wxBarBtn').addEventListener('click', openMask);
  }
})();
