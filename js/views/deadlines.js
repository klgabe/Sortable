// Sortable.views.deadlines: deadline list and month calendar. Owner: Deadlines.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  // The month the calendar shows, as { y, m } (m is 1–12). Lives in memory only:
  // it survives store-triggered re-renders and resets on reload.
  var shownMonth = null;

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var ACTIONS = {
    invoice: { label: "Mark as paid", fn: "markPaid" },
    credential: { label: "Mark as renewed", fn: "markRenewed" },
    compliance: { label: "Resolve", fn: "resolveCompliance" }
  };
  var DONE_LABEL = { invoice: "Paid", credential: "Renewed", compliance: "Resolved" };

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  // Kind label, amount and link for one deadline, from its document or compliance item.
  function details(d, complianceById) {
    var u = Sortable.util;
    var info = { kind: "", amount: null, href: null };
    if (d.kind === "compliance") {
      var c = complianceById[d.refId];
      info.kind = "Compliance" + (c && c.category ? " · " + c.category : "");
      return info;
    }
    var doc = Sortable.store.document(d.refId);
    info.href = "#/doc/" + encodeURIComponent(d.refId);
    if (d.kind === "invoice") {
      info.kind = "Invoice";
      if (doc && doc.invoice && doc.invoice.amountCents != null) info.amount = u.formatMoney(doc.invoice.amountCents);
    } else {
      info.kind = doc ? u.typeLabel(doc.type) : "Credential";
    }
    return info;
  }

  // Badge class and text. Status is always shown as words, never color alone.
  function badge(d) {
    if (d.status === "done") return { cls: "badge-ok", text: DONE_LABEL[d.kind] };
    if (d.status === "overdue") return { cls: "badge-overdue", text: d.kind === "credential" ? "Expired" : "Overdue" };
    if (d.kind === "invoice") return d.soon ? { cls: "badge-soon", text: "Unpaid, due soon" } : { cls: "", text: "Unpaid" };
    if (d.kind === "credential") return d.soon ? { cls: "badge-soon", text: "Expiring soon" } : { cls: "", text: "Upcoming" };
    return d.soon ? { cls: "badge-soon", text: "Due soon" } : { cls: "", text: "Upcoming" };
  }

  function dateWord(d) {
    if (d.status === "done") return "Closed " + Sortable.util.formatDate(d.closedOn) + " · was due";
    if (d.kind === "credential") return d.status === "overdue" ? "Expired" : "Expires";
    return "Due";
  }

  function rowHtml(d, complianceById) {
    var u = Sortable.util, esc = u.esc;
    var info = details(d, complianceById);
    var b = badge(d);
    var title = info.href
      ? '<a class="dl-title" href="' + esc(info.href) + '">' + esc(d.title) + "</a>"
      : '<span class="dl-title">' + esc(d.title) + "</span>";
    var meta = '<span>' + esc(info.kind) + "</span>" +
      '<span>' + esc(dateWord(d)) + " " + esc(u.formatDate(d.dueOn)) + "</span>" +
      (info.amount ? '<span class="dl-amount">' + esc(info.amount) + "</span>" : "");
    var action = d.status === "done" ? "" :
      '<button type="button" class="btn" data-deadline="' + esc(d.id) + '" data-kind="' + esc(d.kind) + '">' +
      esc(ACTIONS[d.kind].label) + "</button>";
    return '<li class="dl-row' + (d.status === "overdue" ? " is-overdue" : "") + '">' +
      '<div class="dl-main">' + title +
      '<div class="dl-meta muted">' + meta + "</div></div>" +
      '<div class="dl-side"><span class="badge ' + b.cls + '">' + esc(b.text) + "</span>" + action + "</div>" +
      "</li>";
  }

  function listSection(heading, items, complianceById, emptyText) {
    var esc = Sortable.util.esc;
    var body = items.length
      ? '<ul class="dl-list">' + items.map(function (d) { return rowHtml(d, complianceById); }).join("") + "</ul>"
      : '<p class="empty">' + esc(emptyText) + "</p>";
    return '<section class="dl-section">' +
      "<h2>" + esc(heading) + ' <span class="muted dl-count">(' + items.length + ")</span></h2>" + body + "</section>";
  }

  function renderList(all, complianceById) {
    var overdue = all.filter(function (d) { return d.status === "overdue"; });
    var upcoming = all.filter(function (d) { return d.status === "upcoming"; });
    var done = all.filter(function (d) { return d.status === "done"; })
      .sort(function (a, b) { return a.closedOn < b.closedOn ? 1 : a.closedOn > b.closedOn ? -1 : 0; });

    var html = listSection("Overdue", overdue, complianceById, "Nothing overdue.") +
      listSection("Upcoming", upcoming, complianceById, "Nothing coming up.");
    html += '<details class="dl-done"><summary>Done <span class="muted">(' + done.length + ")</span></summary>" +
      (done.length
        ? '<ul class="dl-list">' + done.map(function (d) { return rowHtml(d, complianceById); }).join("") + "</ul>"
        : '<p class="empty">Nothing closed yet.</p>') +
      "</details>";
    return html;
  }

  function renderCalendar(all, complianceById) {
    var u = Sortable.util, esc = u.esc;
    var today = u.today();
    if (!shownMonth) shownMonth = { y: +today.slice(0, 4), m: +today.slice(5, 7) };
    var y = shownMonth.y, m = shownMonth.m;
    var prefix = y + "-" + pad2(m) + "-";

    var open = all.filter(function (d) { return d.status !== "done" && d.dueOn.indexOf(prefix) === 0; });
    var byDay = {};
    open.forEach(function (d) { (byDay[d.dueOn] = byDay[d.dueOn] || []).push(d); });

    var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    var daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var monthLabel = MONTH_NAMES[m - 1] + " " + y;

    var html = '<div class="cal" role="grid" aria-label="' + esc(monthLabel) + '">' +
      '<div class="cal-head">' +
      '<button type="button" class="btn" data-month="-1" aria-label="Previous month">‹</button>' +
      '<h2 aria-live="polite">' + esc(monthLabel) + "</h2>" +
      '<button type="button" class="btn" data-month="1" aria-label="Next month">›</button>' +
      "</div>";
    DOW.forEach(function (w) { html += '<div class="cal-dow" aria-hidden="true">' + w.charAt(0) + '<span class="dl-dow-rest">' + w.slice(1) + "</span></div>"; });

    var cells = Math.ceil((first + daysInMonth) / 7) * 7;
    for (var i = 0; i < cells; i++) {
      var day = i - first + 1;
      if (day < 1 || day > daysInMonth) { html += '<div class="cal-day is-blank"></div>'; continue; }
      var date = prefix + pad2(day);
      var items = byDay[date] || [];
      var worst = items.some(function (d) { return d.status === "overdue"; }) ? "is-overdue"
        : items.some(function (d) { return d.soon; }) ? "is-soon" : "";
      html += '<div class="cal-day' + (date === today ? " is-today" : "") + '">' +
        '<span class="dl-daynum">' + day + "</span>";
      items.forEach(function (d) {
        var info = details(d, complianceById);
        var cls = "cal-item" + (d.status === "overdue" ? " is-overdue" : d.soon ? " is-soon" : "");
        var label = esc(d.title) + " (" + esc(badge(d).text) + ")";
        html += info.href
          ? '<a class="' + cls + '" href="' + esc(info.href) + '" title="' + label + '">' + esc(d.title) + "</a>"
          : '<span class="' + cls + '" title="' + label + '">' + esc(d.title) + "</span>";
      });
      if (items.length) {
        html += '<span class="dl-dot ' + worst + '" aria-label="' + items.length + (items.length === 1 ? " deadline" : " deadlines") + '">' +
          items.length + "</span>";
      }
      html += "</div>";
    }
    html += "</div>";

    // Agenda for the month: the readable list on phones, hidden on wider screens.
    html += '<section class="dl-agenda"><h2>' + esc(monthLabel) + " deadlines</h2>" +
      (open.length
        ? '<ul class="dl-list">' + open.map(function (d) { return rowHtml(d, complianceById); }).join("") + "</ul>"
        : '<p class="empty">No open deadlines this month.</p>') +
      "</section>";
    if (!open.length) html += '<p class="muted dl-none">No open deadlines this month.</p>';
    return html;
  }

  Sortable.views.deadlines = {
    render: function (root, params) {
      var isCal = params.segments[1] === "calendar";
      root.className = "page screen-deadlines";

      var all = Sortable.store.deadlines();
      var complianceById = {};
      Sortable.store.compliance().forEach(function (c) { complianceById[c.id] = c; });

      root.innerHTML =
        '<div class="dl-top"><h1 class="page-title">Deadlines</h1>' +
        '<nav class="dl-toggle" aria-label="View">' +
        '<a class="btn' + (isCal ? "" : " btn-primary") + '" href="#/deadlines"' + (isCal ? "" : ' aria-current="page"') + ">List</a>" +
        '<a class="btn' + (isCal ? " btn-primary" : "") + '" href="#/deadlines/calendar"' + (isCal ? ' aria-current="page"' : "") + ">Calendar</a>" +
        "</nav></div>" +
        (isCal ? renderCalendar(all, complianceById) : renderList(all, complianceById));

      var buttons = root.querySelectorAll("button[data-deadline]");
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.addEventListener("click", function () {
          var fn = ACTIONS[btn.getAttribute("data-kind")].fn;
          Sortable.store[fn](btn.getAttribute("data-deadline"));
        });
      });

      var arrows = root.querySelectorAll("button[data-month]");
      Array.prototype.forEach.call(arrows, function (btn) {
        btn.addEventListener("click", function () {
          var m = shownMonth.m + Number(btn.getAttribute("data-month"));
          shownMonth = { y: shownMonth.y + Math.floor((m - 1) / 12), m: ((m - 1) % 12 + 12) % 12 + 1 };
          Sortable.views.deadlines.render(root, params);
        });
      });
    }
  };
})();
