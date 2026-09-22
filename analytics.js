(function () {
  var GA_ID = (window.MNEMO_GA_ID || "").trim();
  var STORAGE_KEY = "mnemo_consent_v2";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Consent Mode v2: deny by default BEFORE loading Google tags
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });

  // Optional region defaults (EEA / UK / CH often need stricter defaults)
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  function track(name, params) {
    try {
      if (typeof window.gtag === "function") gtag("event", name, params || {});
    } catch (e) {}
  }
  window.mnemoTrack = track;

  function readConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
      personalization_storage: state,
      functionality_storage: "granted",
      security_storage: "granted",
    });
  }

  function loadGa() {
    if (!GA_ID || GA_ID === "G-XXXXXXXXXX") {
      console.warn("[Mnemo Analytics] РЈРєР°Р¶Рё Measurement ID РІ analytics-config.js");
      return;
    }
    if (document.getElementById("mnemo-gtag")) return;

    var s = document.createElement("script");
    s.id = "mnemo-gtag";
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);

    gtag("js", new Date());
    gtag("config", GA_ID, {
      send_page_view: true,
      anonymize_ip: true,
    });
  }

  function bindClicks() {
    document.querySelectorAll("[data-ga]").forEach(function (el) {
      el.addEventListener("click", function () {
        var name = el.getAttribute("data-ga") || "click";
        track(name, {
          link_url: el.getAttribute("href") || "",
          link_text: (el.textContent || "").trim().slice(0, 80),
          utm_source: new URLSearchParams(location.search).get("utm_source") || "",
        });
      });
    });
  }

  var marks = { 25: false, 50: false, 75: false, 100: false };
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    var p = Math.round((scrollY / max) * 100);
    [25, 50, 75, 100].forEach(function (m) {
      if (!marks[m] && p >= m) {
        marks[m] = true;
        track("scroll_depth", { percent: m });
      }
    });
  }

  function trackCampaign() {
    try {
      var q = new URLSearchParams(location.search);
      var src = q.get("utm_source") || q.get("src") || "";
      if (src) {
        track("campaign_landing", {
          utm_source: src,
          utm_medium: q.get("utm_medium") || "",
          utm_campaign: q.get("utm_campaign") || "",
          utm_content: q.get("utm_content") || "",
          page_path: location.pathname,
        });
      }
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("mnemo-consent-css")) return;
    var css = document.createElement("style");
    css.id = "mnemo-consent-css";
    css.textContent =
      "#mnemo-consent{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;max-width:720px;margin:0 auto;background:#17304a;color:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(15,35,53,.35);padding:18px 18px 16px;font:15px/1.45 Manrope,system-ui,sans-serif}" +
      "#mnemo-consent h2{margin:0 0 8px;font:700 1.05rem/1.25 Manrope,system-ui,sans-serif}" +
      "#mnemo-consent p{margin:0 0 14px;color:#d5e0ea;font-size:.92rem}" +
      "#mnemo-consent a{color:#6fd3ce}" +
      "#mnemo-consent .actions{display:flex;gap:10px;flex-wrap:wrap}" +
      "#mnemo-consent button{border:0;border-radius:999px;padding:11px 16px;font:800 .88rem Manrope,system-ui,sans-serif;cursor:pointer}" +
      "#mnemo-consent .accept{background:#0aa7a5;color:#fff}" +
      "#mnemo-consent .reject{background:rgba(255,255,255,.12);color:#fff}" +
      "#mnemo-consent-reopen{position:fixed;z-index:99998;left:14px;bottom:14px;border:0;border-radius:999px;background:rgba(23,48,74,.92);color:#fff;padding:9px 12px;font:700 .75rem Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.25)}" +
      "@media(max-width:560px){#mnemo-consent{left:10px;right:10px;bottom:10px;padding:16px}#mnemo-consent .actions{flex-direction:column}#mnemo-consent button{width:100%}}";
    document.head.appendChild(css);
  }

  function removeBanner() {
    var el = document.getElementById("mnemo-consent");
    if (el) el.remove();
  }

  function showReopen() {
    if (document.getElementById("mnemo-consent-reopen")) return;
    var btn = document.createElement("button");
    btn.id = "mnemo-consent-reopen";
    btn.type = "button";
    btn.textContent = "Cookies";
    btn.addEventListener("click", function () {
      btn.remove();
      showBanner(true);
    });
    document.body.appendChild(btn);
  }

  function onChoice(granted) {
    saveConsent(granted ? "granted" : "denied");
    applyConsent(granted);
    removeBanner();
    showReopen();
    track("consent_update", { consent_state: granted ? "granted" : "denied" });
  }

  function showBanner(force) {
    if (!force && readConsent()) return;
    removeBanner();
    injectStyles();

    var box = document.createElement("div");
    box.id = "mnemo-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", "Р—Р°РїСЂРѕСЃ СЃРѕРіР»Р°СЃРёСЏ РЅР° РѕР±СЂР°Р±РѕС‚РєСѓ РґР°РЅРЅС‹С…");
    box.innerHTML =
      "<h2>РњС‹ РёСЃРїРѕР»СЊР·СѓРµРј cookies Рё Google Analytics</h2>" +
      "<p>РќСѓР¶РЅРѕ РІР°С€Рµ СЃРѕРіР»Р°СЃРёРµ, С‡С‚РѕР±С‹ РїРµСЂРµРґР°РІР°С‚СЊ РґР°РЅРЅС‹Рµ РІ Google РґР»СЏ Р°РЅР°Р»РёС‚РёРєРё Рё (РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё) РїРµСЂСЃРѕРЅР°Р»РёР·Р°С†РёРё. " +
      "Р’С‹ РјРѕР¶РµС‚Рµ РїСЂРёРЅСЏС‚СЊ РёР»Рё РѕС‚РєР»РѕРЅРёС‚СЊ. РџРѕРґСЂРѕР±РЅРµРµ вЂ” РІ " +
      '<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">РїРѕР»РёС‚РёРєРµ Google</a>.</p>' +
      '<div class="actions">' +
      '<button type="button" class="accept" data-consent="yes">РџСЂРёРЅСЏС‚СЊ</button>' +
      '<button type="button" class="reject" data-consent="no">РћС‚РєР»РѕРЅРёС‚СЊ</button>' +
      "</div>";

    document.body.appendChild(box);
    box.querySelector('[data-consent="yes"]').addEventListener("click", function () {
      onChoice(true);
    });
    box.querySelector('[data-consent="no"]').addEventListener("click", function () {
      onChoice(false);
    });
  }

  function initTrackingHelpers() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindClicks);
    } else {
      bindClicks();
    }
    addEventListener("scroll", onScroll, { passive: true });
    trackCampaign();
  }

  // Boot
  loadGa();
  initTrackingHelpers();

  var saved = readConsent();
  if (saved === "granted") {
    applyConsent(true);
    showReopen();
  } else if (saved === "denied") {
    applyConsent(false);
    showReopen();
  } else {
    // No choice yet вЂ” keep denied defaults and ask
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        showBanner(false);
      });
    } else {
      showBanner(false);
    }
  }
})();
