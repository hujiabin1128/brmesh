/* ===========================================================
   BRmesh — WeChat in-app browser guide
   -----------------------------------------------------------
   WeChat's built-in browser blocks links to apps.apple.com and
   play.google.com. This script does one thing only:

     if the page is opened inside WeChat
       -> show a guide telling the user to tap "..." (top right)
          and choose "Open in Browser"

   It does NOT copy anything and does NOT intercept any link.
   Outside WeChat it returns before touching the DOM.

   No dependencies. Included on every page before </body>.
   =========================================================== */

(function () {
  'use strict';

  var ua = navigator.userAgent || '';

  /* ---------------- environment detection ---------------- */
  // WeChat marks itself with MicroMessenger (and/or WeChat) in the UA.
  // wxwork (WeCom) is excluded — it opens external links normally.
  var isWeChat = /micromessenger|wechat/i.test(ua) && !/wxwork/i.test(ua);
  if (!isWeChat) return;

  // One wording for every platform. WeChat's menu item is named slightly
  // differently per OS, but "Open in Browser" reads clearly on both.
  var openLabel = 'Open in Browser';

  // keep the footer clear of the bottom bar
  document.body.classList.add('wx-env');

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
      '<span>Tap here</span>' +
    '</div>' +
    '<div class="wx-box">' +
      '<h3>Open in your browser</h3>' +
      '<p>WeChat can\'t open app store links.<br>' +
      'Tap <b>&middot;&middot;&middot;</b> at the top right, then choose ' +
      '<b>' + openLabel + '</b>.</p>' +
      '<button type="button" class="wx-close" id="wxCloseBtn">Got it</button>' +
    '</div>';

  document.body.appendChild(overlay);

  function openMask()  { overlay.classList.add('is-open'); }
  function closeMask() { overlay.classList.remove('is-open'); }

  overlay.querySelector('#wxCloseBtn').addEventListener('click', closeMask);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeMask();
  });

  /* ---------------- persistent bottom bar ---------------- */
  var bar = document.createElement('div');
  bar.className = 'wx-bar';
  bar.innerHTML =
    '<span>For the best experience, open this page in your browser ' +
    '&mdash; tap <b>&middot;&middot;&middot;</b> then <b>' + openLabel + '</b></span>' +
    '<button type="button" id="wxBarBtn">How?</button>';
  document.body.appendChild(bar);
  bar.querySelector('#wxBarBtn').addEventListener('click', openMask);

  /* ---------------- show the guide on load ---------------- */
  openMask();
})();
