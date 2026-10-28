// Sortable.views.employees: staff list and one employee's folder. Owner: People.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  var CREDENTIAL = { license: true, certification: true, training: true };
  var FLAG_DAYS = 60;

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // Open credential deadlines that are overdue or due within 60 days, grouped by employee.
  function flagsByEmployee() {
    var u = Sortable.util;
    var today = u.today();
    var out = {};
    Sortable.store.deadlines().forEach(function (d) {
      if (d.kind !== "credential" || d.status === "done" || !d.employeeId) return;
      var flagged = d.status === "overdue" || u.daysBetween(today, d.dueOn) <= FLAG_DAYS;
      if (!flagged) return;
      var f = out[d.employeeId] || (out[d.employeeId] = { count: 0, overdue: 0 });
      f.count += 1;
      if (d.status === "overdue") f.overdue += 1;
    });
    return out;
  }

  function flagBadge(f) {
    var esc = Sortable.util.esc;
    if (!f || !f.count) return "";
    var cls = f.overdue ? "badge-overdue" : "badge-soon";
    var label = f.overdue
      ? plural(f.count, "credential", "credentials") + (f.overdue === f.count ? " overdue" : " overdue or expiring")
      : plural(f.count, "credential", "credentials") + " expiring";
    return '<span class="badge ' + cls + '">' + esc(label) + "</span>";
  }

  function renderList(root) {
    var esc = Sortable.util.esc;
    var flags = flagsByEmployee();
    var staff = Sortable.store.employees().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    var flaggedCount = staff.filter(function (e) { return flags[e.id]; }).length;

    var rows = staff.map(function (e) {
      return (
        '<li class="emp-row" data-name="' + esc(e.name.toLowerCase()) + '">' +
        '<a class="emp-link" href="#/employees/' + encodeURIComponent(e.id) + '">' +
        '<span class="emp-who"><span class="emp-name">' + esc(e.name) + "</span>" +
        '<span class="emp-role muted">' + esc(e.role) + "</span></span>" +
        flagBadge(flags[e.id]) +
        "</a></li>"
      );
    }).join("");

    root.innerHTML =
      '<h1 class="page-title">Employees</h1>' +
      '<p class="muted">' + esc(plural(staff.length, "person", "people")) + " on staff. " +
      esc(plural(flaggedCount, "person has", "people have")) +
      " credentials overdue or expiring in the next " + FLAG_DAYS + " days.</p>" +
      '<div class="filters"><label>Find by name' +
      '<input type="search" class="emp-filter" placeholder="Type a name" autocomplete="off"></label></div>' +
      '<div class="card emp-card"><ul class="emp-list">' + rows + "</ul>" +
      '<p class="empty emp-none" hidden>No one matches that name.</p></div>';

    var input = root.querySelector(".emp-filter");
    var items = root.querySelectorAll(".emp-row");
    var none = root.querySelector(".emp-none");
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      for (var i = 0; i < items.length; i++) {
        var match = !q || items[i].getAttribute("data-name").indexOf(q) >= 0;
        items[i].hidden = !match;
        if (match) shown += 1;
      }
      none.hidden = shown > 0;
    });
  }

  function credentialBadge(dl) {
    var u = Sortable.util;
    if (!dl) return '<span class="badge">No expiry date</span>';
    if (dl.status === "done") return '<span class="badge badge-ok">Renewed</span>';
    if (dl.status === "overdue") return '<span class="badge badge-overdue">Expired</span>';
    var days = u.daysBetween(u.today(), dl.dueOn);
    if (days <= FLAG_DAYS) {
      return '<span class="badge badge-soon">' + u.esc(days === 0 ? "Expires today" : "Expires in " + plural(days, "day", "days")) + "</span>";
    }
    return '<span class="badge">Current</span>';
  }

  function renderDetail(root, id) {
    var u = Sortable.util;
    var esc = u.esc;
    var store = Sortable.store;
    var emp = store.employee(id);

    if (!emp) {
      root.innerHTML =
        '<a class="emp-back" href="#/employees">&lsaquo; All staff</a>' +
        '<h1 class="page-title">Employees</h1>' +
        '<p class="empty">Not found. There is no employee with that ID.</p>';
      return;
    }

    var docs = store.documents({ status: "filed", employeeId: emp.id });
    var byRef = {};
    store.deadlines().forEach(function (d) { if (d.kind === "credential") byRef[d.refId] = d; });

    var creds = docs.filter(function (d) { return CREDENTIAL[d.type]; });
    var others = docs.filter(function (d) { return !CREDENTIAL[d.type]; }); // already newest first

    // Open credentials first, soonest expiry first; renewed ones after.
    creds.sort(function (a, b) {
      var ra = a.renewedOn ? 1 : 0, rb = b.renewedOn ? 1 : 0;
      if (ra !== rb) return ra - rb;
      var ea = a.expiresOn || "9999", eb = b.expiresOn || "9999";
      if (ea !== eb) return ea < eb ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });

    var credRows = creds.map(function (d) {
      return (
        '<li class="emp-doc">' +
        '<a class="emp-doc-name" href="#/doc/' + encodeURIComponent(d.id) + '">' + esc(d.name) + "</a>" +
        '<span class="emp-doc-meta muted">' +
        (d.expiresOn ? "Expires " + esc(u.formatDate(d.expiresOn)) : "No expiry date") +
        (d.renewedOn ? " · Renewed " + esc(u.formatDate(d.renewedOn)) : "") +
        "</span>" +
        credentialBadge(byRef[d.id]) +
        "</li>"
      );
    }).join("");

    var otherRows = others.map(function (d) {
      return (
        '<li class="emp-doc">' +
        '<a class="emp-doc-name" href="#/doc/' + encodeURIComponent(d.id) + '">' + esc(d.name) + "</a>" +
        '<span class="emp-doc-meta muted">' + esc(u.typeLabel(d.type)) + " · " + esc(u.formatDate(d.docDate)) + "</span>" +
        "</li>"
      );
    }).join("");

    root.innerHTML =
      '<a class="emp-back" href="#/employees">&lsaquo; All staff</a>' +
      '<div class="emp-head">' +
      '<h1 class="page-title">' + esc(emp.name) + "</h1>" +
      '<p class="muted">' + esc(emp.role) + " · Started " + esc(u.formatDate(emp.startDate)) + "</p>" +
      "</div>" +
      '<section class="card emp-card"><h2>Credentials</h2>' +
      (credRows
        ? '<ul class="emp-docs">' + credRows + "</ul>"
        : '<p class="empty">No licenses, certifications or trainings on file.</p>') +
      "</section>" +
      '<section class="card emp-card"><h2>Other documents</h2>' +
      (otherRows
        ? '<ul class="emp-docs">' + otherRows + "</ul>"
        : '<p class="empty">No other documents on file.</p>') +
      "</section>";
  }

  Sortable.views.employees = {
    render: function (root, params) {
      root.className = "page screen-employees";
      var id = params && params.segments ? params.segments[1] : null;
      if (id) renderDetail(root, id);
      else renderList(root);
    }
  };
})();
