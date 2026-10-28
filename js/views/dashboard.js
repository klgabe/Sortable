// Sortable.views.dashboard: the home screen. Owner: Deadlines.
// Five read-only panels: Overdue, Due in the next 30 days (invoices and compliance),
// Expiring credentials (next 60 days), Review queue count, and the Reminder outbox.
// No action buttons here: actions live on Deadlines.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  var DUE_WINDOW = 30;      // invoices and compliance
  var CRED_WINDOW = 60;     // credentials
  var SENT_LIMIT = 20;
  var NEXT_LIMIT = 5;

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  // Where a deadline row links: documents to their detail, compliance to Deadlines.
  function hrefFor(kind, refId) {
    if (kind === "compliance") return "#/deadlines";
    return "#/doc/" + encodeURIComponent(refId);
  }

  function kindFromId(deadlineId) {
    var i = String(deadlineId).indexOf(":");
    return i >= 0 ? deadlineId.slice(0, i) : "";
  }

  function badgeFor(d) {
    if (d.status === "overdue") return { cls: "badge-overdue", text: "Overdue" };
    if (d.kind === "invoice") return { cls: d.soon ? "badge-soon" : "", text: d.soon ? "Due soon" : "Unpaid" };
    if (d.kind === "credential") return { cls: d.soon ? "badge-soon" : "", text: d.soon ? "Expiring soon" : "Upcoming" };
    return { cls: d.soon ? "badge-soon" : "", text: d.soon ? "Due soon" : "Upcoming" };
  }

  function whenText(d, today) {
    var u = Sortable.util;
    var n = u.daysBetween(today, d.dueOn);
    var verb = d.kind === "credential" ? "Expires" : "Due";
    if (n < 0) return plural(-n, "day") + " overdue";
    if (n === 0) return verb + " today";
    if (n === 1) return verb + " tomorrow";
    return verb + " in " + n + " days";
  }

  function kindLabel(d, doc, cmp) {
    if (d.kind === "compliance") return cmp && cmp.category ? "Compliance · " + cmp.category : "Compliance";
    return doc ? Sortable.util.typeLabel(doc.type) : d.kind === "invoice" ? "Invoice" : "Credential";
  }

  function deadlineRow(d, today, lookup) {
    var u = Sortable.util, esc = u.esc;
    var doc = d.kind === "compliance" ? null : lookup.doc(d.refId);
    var cmp = d.kind === "compliance" ? lookup.cmp(d.refId) : null;
    var b = badgeFor(d);
    var amount = doc && doc.invoice && doc.invoice.amountCents != null
      ? '<span class="dash-amount">' + esc(u.formatMoney(doc.invoice.amountCents)) + "</span>"
      : "";
    return (
      '<li class="dash-row' + (d.status === "overdue" ? " is-overdue" : "") + '">' +
        '<div class="dash-main">' +
          '<a class="dash-title" href="' + esc(hrefFor(d.kind, d.refId)) + '">' + esc(d.title) + "</a>" +
          '<span class="muted">' + esc(kindLabel(d, doc, cmp)) + " · " + esc(whenText(d, today)) + "</span>" +
        "</div>" +
        '<div class="dash-meta">' +
          '<span class="badge ' + b.cls + '">' + esc(b.text) + "</span>" +
          '<span class="dash-date">' + esc(u.formatDate(d.dueOn)) + "</span>" +
          amount +
        "</div>" +
      "</li>"
    );
  }

  function listOrEmpty(rows, emptyText, today, lookup) {
    if (!rows.length) return '<p class="empty">' + Sortable.util.esc(emptyText) + "</p>";
    return '<ul class="dash-list">' + rows.map(function (d) { return deadlineRow(d, today, lookup); }).join("") + "</ul>";
  }

  function panel(cls, title, count, body) {
    var esc = Sortable.util.esc;
    return (
      '<section class="card dash-panel ' + cls + '">' +
        '<div class="dash-head"><h2>' + esc(title) + "</h2>" +
        (count != null ? '<span class="dash-count">' + esc(String(count)) + "</span>" : "") +
        "</div>" + body +
      "</section>"
    );
  }

  function reminderLabel(r) {
    var kind = kindFromId(r.deadlineId);
    return r.offsetDays + "-day " + (kind === "invoice" ? "reminder" : "alert");
  }

  function outboxRow(r, sent) {
    var u = Sortable.util, esc = u.esc;
    var kind = kindFromId(r.deadlineId);
    var refId = String(r.deadlineId).slice(kind.length + 1);
    return (
      '<li class="outbox-row">' +
        '<div class="dash-main">' +
          '<a class="dash-title" href="' + esc(hrefFor(kind, refId)) + '">' + esc(r.title) + "</a>" +
          '<span class="muted">' + esc(reminderLabel(r)) + "</span>" +
        "</div>" +
        '<div class="dash-meta">' +
          '<span class="badge ' + (sent ? "badge-ok" : "") + '">' + (sent ? "Sent" : "Scheduled") + "</span>" +
          '<span class="dash-date">' + esc(u.formatDate(r.sendOn)) + "</span>" +
        "</div>" +
      "</li>"
    );
  }

  function outboxBody(box) {
    var esc = Sortable.util.esc;
    var sent = box.sent.slice(0, SENT_LIMIT);
    var next = box.next.slice(0, NEXT_LIMIT);
    var sentHtml = sent.length
      ? '<ul class="outbox">' + sent.map(function (r) { return outboxRow(r, true); }).join("") + "</ul>"
      : '<p class="empty">No reminders sent yet.</p>';
    var nextHtml = next.length
      ? '<ul class="outbox">' + next.map(function (r) { return outboxRow(r, false); }).join("") + "</ul>"
      : '<p class="empty">Nothing scheduled.</p>';
    var more = box.sent.length > SENT_LIMIT
      ? '<p class="muted dash-note">Showing the newest ' + SENT_LIMIT + " of " + box.sent.length + ".</p>"
      : "";
    return (
      '<p class="muted dash-note">Practice reminders are shown here. No real email is sent.</p>' +
      '<div class="dash-outbox">' +
        '<div class="dash-outbox-col"><h3>Sent</h3>' + sentHtml + more + "</div>" +
        '<div class="dash-outbox-col"><h3>Next up</h3>' + nextHtml + "</div>" +
      "</div>" +
      (box.next.length > NEXT_LIMIT
        ? '<p class="muted dash-note">' + esc(plural(box.next.length - NEXT_LIMIT, "more reminder")) + " scheduled later.</p>"
        : "")
    );
  }

  Sortable.views.dashboard = {
    render: function (root) {
      var u = Sortable.util, store = Sortable.store, esc = u.esc;
      var today = u.today();
      root.className = "page screen-dashboard";

      var docCache = {}, cmpById = {};
      store.compliance().forEach(function (c) { cmpById[c.id] = c; });
      var lookup = {
        doc: function (id) {
          if (!(id in docCache)) docCache[id] = store.document(id);
          return docCache[id];
        },
        cmp: function (id) { return cmpById[id] || null; }
      };

      var all = store.deadlines(); // sorted by date
      var overdue = all.filter(function (d) { return d.status === "overdue"; });
      var upcoming = all.filter(function (d) { return d.status === "upcoming"; });
      var dueSoon = upcoming.filter(function (d) {
        return (d.kind === "invoice" || d.kind === "compliance") && u.daysBetween(today, d.dueOn) <= DUE_WINDOW;
      });
      var creds = upcoming.filter(function (d) {
        return d.kind === "credential" && u.daysBetween(today, d.dueOn) <= CRED_WINDOW;
      });
      var reviewCount = store.reviewQueue().length;
      var box = Sortable.reminders.outbox();

      var reviewBody = reviewCount
        ? '<div class="dash-review">' +
            '<p><strong class="dash-big">' + esc(String(reviewCount)) + "</strong> " +
            esc(reviewCount === 1 ? "document needs" : "documents need") + " a quick check before filing.</p>" +
            '<a class="btn-link" href="#/inbox">Open the Inbox</a>' +
          "</div>"
        : '<p class="empty">Nothing waiting for review. <a href="#/inbox">Go to the Inbox</a></p>';

      root.innerHTML =
        '<h1 class="page-title">Dashboard</h1>' +
        '<p class="muted">Today is ' + esc(u.formatDate(today)) + ".</p>" +
        '<div class="dash-grid">' +
          panel("dash-overdue", "Overdue", overdue.length,
            listOrEmpty(overdue, "Nothing is overdue.", today, lookup)) +
          panel("dash-due", "Due in the next 30 days", dueSoon.length,
            '<p class="muted dash-note">Invoices and compliance items.</p>' +
            listOrEmpty(dueSoon, "Nothing due in the next 30 days.", today, lookup)) +
          panel("dash-creds", "Expiring credentials", creds.length,
            '<p class="muted dash-note">Licenses, certifications and trainings expiring in the next 60 days.</p>' +
            listOrEmpty(creds, "No credentials expire in the next 60 days.", today, lookup)) +
          panel("dash-reviewq", "Review queue", null, reviewBody) +
          panel("dash-outbox-panel", "Reminder outbox", null, outboxBody(box)) +
        "</div>";
    }
  };
})();
