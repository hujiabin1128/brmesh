/* ===========================================================
   BRmesh — WeChat in-app browser guide
   -----------------------------------------------------------
   WeChat's built-in browser blocks links to apps.apple.com and
   play.google.com, so store badges silently do nothing there.
   This script does NOT intercept clicks anymore. Instead:

     if the page is opened inside WeChat
       -> show a guide telling the user to open it in a real browser
       -> copy the current URL to the clipboard automatically

   Outside WeChat this file does nothing at all (returns before
   touching the DOM or registering any listener).

   No dependencies. Included on every page before </body>.
   =========================================================== */

(function () {
  'use strict';

  var ua = navigator.userAgent || '';

  /* ---------------- environment detection ---------------- */
  // WeChat marks itself with MicroMessenger and/or WeChat in the UA.
  // wxwork (WeCom) is excluded — it opens external links normally.
  var isWeChat = /micromessenger|wechat/i.test(ua) && !/wxwork/i.test(ua);
  if (!isWeChat) return;

  var isIOS = /iphone|ipad|ipod|ios/i.test(ua);
  var openLabel = isIOS ? 'Open in Safari' : 'Open in Browser';

  /* ---------------- build the overlay ---------------- */
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
      '<span>Tap <b>&middot;&middot;&middot;</b> top-right</span>' +
    '</div>' +
    '<div class="wx-box">' +
      '<h3>Open this page in your browser</h3>' +
      '<p>WeChat blocks App Store and Google Play links.<br>' +
      'Tap <b>&middot;&middot;&middot;</b> at the top right, then choose ' +
      '<b>' + openLabel + '</b>.</p>' +
      '<div class="wx-urlwrap">' +
        '<input class="wx-url" id="wxUrl" type="text" readonly>' +
      '</div>' +
      '<p class="wx-hint" id="wxHint">Copying link&hellip;</p>' +
      '<button type="button" class="wx-copy" id="wxCopyBtn">Copy link again</button>' +
      '<button type="button" class="wx-close" id="wxCloseBtn">Got it</button>' +
    '</div>';

  document.body.appendChild(overlay);

  var urlInput = overlay.querySelector('#wxUrl');
  var hint     = overlay.querySelector('#wxHint');
  var pageUrl  = location.href.split('#')[0];

  urlInput.value = pageUrl;

  var lastCopied = false;

  function openMask()  { overlay.classList.add('is-open'); }
  function closeMask() { overlay.classList.remove('is-open'); }

  // On iOS the clipboard usually refuses a programmatic copy until the
  // user actually taps something. The close button is that tap, so we
  // copy there and let the user see the confirmation before closing.
  function dismiss() {
    if (lastCopied) { closeMask(); return; }
    if (copyText(pageUrl)) markCopied();
    setTimeout(closeMask, 700);
  }

  overlay.querySelector('#wxCloseBtn').addEventListener('click', dismiss);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) dismiss();
  });

  /* ---------------- copy helper ---------------- */
  // Returns true when the copy actually succeeded.
  function copyText(text) {
    // 1) modern async clipboard API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        // We cannot await here reliably on old WebViews; treat as attempted.
        if (!/iphone|ipad/i.test(ua)) return true;
      }
    } catch (err) { /* fall through */ }

    // 2) legacy execCommand path (works on most Android X5 builds)
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return true;
    } catch (err) { /* fall through */ }

    return false;
  }

  function markCopied() {
    lastCopied = true;
    hint.className = 'wx-hint is-ok';
    hint.innerHTML = 'Link copied &mdash; paste it into Safari / Chrome.';
  }

  function markManual() {
    hint.className = 'wx-hint is-manual';
    hint.innerHTML = 'Long-press the link above, then tap <b>Copy</b>.';
    // pre-select it so a long-press offers "Copy" right away
    try { urlInput.focus(); urlInput.select(); } catch (err) { /* ignore */ }
  }

  /* ---------------- auto-copy on load ---------------- */
  // Try immediately; if it fails (iOS often requires a user gesture),
  // retry once on the first real touch, then fall back to manual.
  if (copyText(pageUrl)) {
    markCopied();
  } else {
    markManual();
    var retry = function () {
      if (copyText(pageUrl)) markCopied();
      document.removeEventListener('touchend', retry);
      document.removeEventListener('click', retry);
    };
    document.addEventListener('touchend', retry, { once: true });
    document.addEventListener('click', retry, { once: true });
  }

  overlay.querySelector('#wxCopyBtn').addEventListener('click', function () {
    if (copyText(pageUrl)) markCopied(); else markManual();
  });

  /* ---------------- persistent hint bar ---------------- */
  var bar = document.createElement('div');
  bar.className = 'wx-bar';
  bar.innerHTML =
    '<span>Open in browser to download &mdash; tap <b>&middot;&middot;&middot;</b> ' +
    'then <b>' + openLabel + '</b></span>' +
    '<button type="button" id="wxBarBtn">How?</button>';
  document.body.appendChild(bar);
  bar.querySelector('#wxBarBtn').addEventListener('click', openMask);

  /* ---------------- show the guide on load ---------------- */
  openMask();

  // NOTE: store links are intentionally left untouched. Some WeChat
  // builds do open them, and overriding the click made the badge look
  // broken in others.
})();
