// Sortable.router: hash routing, fresh root per render, active tab, Inbox badge. Owner: Shell.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  // First path segment → view file name.
  var ROUTES = {
    dashboard: "dashboard",
    inbox: "inbox",
    library: "library",
    doc: "library",
    search: "library",
    deadlines: "deadlines",
    employees: "employees",
    setup: "setup"
  };
  // First path segment → highlighted header tab.
  var TABS = { doc: "library", search: "library" };

  var DEFAULT_HASH = "#/dashboard";
  var lastHash = null;

  function decode(s) {
    try {
      return decodeURIComponent(s.replace(/\+/g, " "));
    } catch (e) {
      return s;
    }
  }

  // "#/search?q=henry" → { segments: ["search"], query: { q: "henry" } }
  function parse(hash) {
    var h = String(hash || "").replace(/^#/, "");
    var qi = h.indexOf("?");
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var qs = qi >= 0 ? h.slice(qi + 1) : "";
    var segments = path.split("/").filter(Boolean).map(decode);
    var query = {};
    qs.split("&").forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf("=");
      var k = decode(eq >= 0 ? pair.slice(0, eq) : pair);
      query[k] = eq >= 0 ? decode(pair.slice(eq + 1)) : "";
    });
    return { segments: segments, query: query };
  }

  function updateHeader(first) {
    var active = TABS[first] || first;
    var tabs = document.querySelectorAll("[data-tab]");
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute("data-tab") === active;
      tabs[i].classList.toggle("is-active", on);
      if (on) tabs[i].setAttribute("aria-current", "page");
      else tabs[i].removeAttribute("aria-current");
    }

    var badge = document.getElementById("inbox-badge");
    if (badge) {
      var n = Sortable.store.reviewQueue().length;
      badge.textContent = String(n);
      badge.hidden = n === 0;
    }

    var box = document.getElementById("search-box");
    if (box && first === "search" && document.activeElement !== box) {
      box.value = parse(location.hash).query.q || "";
    }
  }

  function render() {
    var hash = location.hash;
    var params = parse(hash);
    var first = params.segments[0];

    if (!hash || hash === "#" || hash === "#/") {
      params = parse(DEFAULT_HASH);
      first = "dashboard";
    } else if (!ROUTES[first]) {
      location.replace(DEFAULT_HASH); // fires hashchange, which renders the dashboard
      return;
    }

    var main = document.getElementById("view");
    main.innerHTML = "";
    var root = document.createElement("div");
    main.appendChild(root);

    var view = Sortable.views[ROUTES[first]];
    try {
      if (!view) throw new Error("View not loaded: " + ROUTES[first]);
      view.render(root, params);
    } catch (err) {
      if (window.console) console.error(err);
      root.innerHTML = '<div class="page"><p class="empty">Something went wrong showing this page.</p></div>';
    }

    updateHeader(first);

    if (hash !== lastHash) {
      lastHash = hash;
      if (window.scrollTo) window.scrollTo(0, 0);
    }
  }

  function onSearchKey(e) {
    if (e.key !== "Enter") return;
    var q = e.target.value.trim();
    location.hash = "#/search?q=" + encodeURIComponent(q);
  }

  function start() {
    window.addEventListener("hashchange", render);
    Sortable.store.subscribe(render);
    var box = document.getElementById("search-box");
    if (box) box.addEventListener("keydown", onSearchKey);
    render();
  }

  Sortable.router = { start: start, render: render, parse: parse, routes: ROUTES };
})();
