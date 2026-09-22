(function () {
  var GA_ID = (window.MNEMO_GA_ID || "").trim();
  if (!GA_ID || GA_ID === "G-XXXXXXXXXX") {
    console.warn("[Mnemo Analytics] Укажи Measurement ID в analytics-config.js");
    window.mnemoTrack = function () {};
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
  document.head.appendChild(s);

  gtag("js", new Date());
  gtag("config", GA_ID, {
    send_page_view: true,
    anonymize_ip: true,
  });

  function track(name, params) {
    try {
      gtag("event", name, params || {});
    } catch (e) {}
  }
  window.mnemoTrack = track;

  // UTM / Instagram source into custom dimensions via event
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindClicks);
  } else {
    bindClicks();
  }

  // Scroll depth 25/50/75/100
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
  addEventListener("scroll", onScroll, { passive: true });
})();
