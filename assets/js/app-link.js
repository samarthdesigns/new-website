/*
  Application link attribution for Umami.
  A visitor who arrives through samarthnayyar.com/r/<slug> carries a
  first-party cookie `sn_app` ({s: slug, c: company, r: role}) for 30 days.
  - Every pageview they make is tagged utm_source=<company>,
    utm_medium=job-application, utm_campaign=<slug> (Umami "before-send" hook),
    so Umami attributes it to that application instead of "Direct".
  - On the visit right after the click (`sn_new` cookie), one pageview for
    /r/<slug> and one `application-open` event are recorded.
  - The session is identified as <slug> so all its pages group together.
  Must load before the Umami script, which needs data-before-send="snAppLink".
*/
(function () {
  function readCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  var app = null;
  try { app = JSON.parse(readCookie("sn_app") || "null"); } catch (e) { app = null; }
  if (!app || !app.s) { window.snAppLink = function (t, p) { return p; }; return; }

  var fresh = readCookie("sn_new") === "1";
  if (fresh) document.cookie = "sn_new=; Path=/; Max-Age=0; SameSite=Lax";

  function tag(url) {
    try {
      var u = new URL(url, location.origin);
      u.searchParams.set("utm_source", app.c || app.s.split("-")[0]);
      u.searchParams.set("utm_medium", "job-application");
      u.searchParams.set("utm_campaign", app.s);
      return /^https?:/.test(url) ? u.href : u.pathname + u.search + u.hash;
    } catch (e) { return url; }
  }

  window.snAppLink = function (type, payload) {
    if (type === "event" && payload && payload.url) payload.url = tag(payload.url);
    return payload;
  };

  function whenUmami(fn, tries) {
    if (window.umami && window.umami.track) return fn(window.umami);
    if ((tries || 0) > 50) return;
    setTimeout(function () { whenUmami(fn, (tries || 0) + 1); }, 100);
  }

  whenUmami(function (umami) {
    var data = { application: app.s, company: app.c || "", role: app.r || "" };
    if (!sessionStorage.getItem("sn_ident")) {
      sessionStorage.setItem("sn_ident", "1");
      umami.identify(app.s, data);
    }
    if (fresh) {
      umami.track(function (p) {
        p.url = "/r/" + app.s;          // tagged with utm by snAppLink
        p.title = "App link: " + app.s;
        return p;
      });
      umami.track("application-open", data);
    }
  });
})();
