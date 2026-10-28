// Sortable.views.library: folder tiles, folder list, search results and document detail.
// Owner: Library. Routes: #/library, #/library/:folder, #/search?q=, #/doc/:id.
// Filters live in the hash query (type, emp, ven, from, to) so they survive re-renders.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  // Hard rule 4: exactly five folders, in this order.
  var FOLDERS = [
    { name: "Invoices", types: ["invoice"], link: "vendor", blurb: "Bills from vendors" },
    { name: "Licenses", types: ["license", "certification", "training"], link: "employee", blurb: "Licenses, certifications and trainings" },
    { name: "HR", types: ["hr_form"], link: "employee", blurb: "Staff forms" },
    { name: "Vendors", types: ["contract", "other"], link: "vendor", blurb: "Contracts and other vendor papers" },
    { name: "Compliance", types: ["compliance"], link: null, blurb: "OSHA, HIPAA and inspections" }
  ];
  var ALL_TYPES = ["invoice", "license", "certification", "training", "hr_form", "contract", "compliance", "other"];
  var CREDENTIAL = { license: true, certification: true, training: true };

  function U() { return Sortable.util; }
  function store() { return Sortable.store; }
  function esc(s) { return Sortable.util.esc(s); }

  function folderByName(name) {
    var n = String(name || "").toLowerCase();
    for (var i = 0; i < FOLDERS.length; i++) if (FOLDERS[i].name.toLowerCase() === n) return FOLDERS[i];
    return null;
  }

  function lookups() {
    var emp = {}, ven = {};
    store().employees().forEach(function (e) { emp[e.id] = e; });
    store().vendors().forEach(function (v) { ven[v.id] = v; });
    return { emp: emp, ven: ven };
  }

  // ---------- Status badge ----------

  // Returns { cls, label } for a document's status badge (always a text label).
  function statusOf(doc) {
    var u = U();
    if (doc.status === "review") return { cls: "badge-review", label: "In review" };
    if (doc.type === "invoice" && doc.invoice) {
      if (!doc.invoice.dueDate) return { cls: "", label: "Due date missing" };
      var s = store().invoiceStatus(doc);
      if (s === "paid") return { cls: "badge-ok", label: "Paid" };
      if (s === "overdue") return { cls: "badge-overdue", label: "Overdue" };
      var d = u.daysBetween(u.today(), doc.invoice.dueDate);
      return { cls: d <= 7 ? "badge-soon" : "", label: "Unpaid" };
    }
    if (CREDENTIAL[doc.type]) {
      if (doc.renewedOn) return { cls: "badge-ok", label: "Renewed" };
      if (!doc.expiresOn) return { cls: "", label: "No expiry date" };
      if (doc.expiresOn < u.today()) return { cls: "badge-overdue", label: "Expired" };
      if (u.daysBetween(u.today(), doc.expiresOn) <= 60) return { cls: "badge-soon", label: "Expires soon" };
      return { cls: "badge-ok", label: "Valid" };
    }
    return { cls: "", label: "Filed" };
  }

  function badgeHtml(doc) {
    var s = statusOf(doc);
    return '<span class="badge' + (s.cls ? " " + s.cls : "") + '">' + esc(s.label) + "</span>";
  }

  function whoOf(doc, lk) {
    if (doc.employeeId && lk.emp[doc.employeeId]) return lk.emp[doc.employeeId].name;
    if (doc.vendorId && lk.ven[doc.vendorId]) return lk.ven[doc.vendorId].name;
    return "Practice";
  }

  // ---------- Filters ----------

  function readFilters(query) {
    return {
      type: query.type || "",
      employeeId: query.emp || "",
      vendorId: query.ven || "",
      from: /^\d{4}-\d{2}-\d{2}$/.test(query.from || "") ? query.from : "",
      to: /^\d{4}-\d{2}-\d{2}$/.test(query.to || "") ? query.to : ""
    };
  }

  function buildHash(base, q, f) {
    var parts = [];
    if (q != null) parts.push("q=" + encodeURIComponent(q));
    if (f.type) parts.push("type=" + encodeURIComponent(f.type));
    if (f.employeeId) parts.push("emp=" + encodeURIComponent(f.employeeId));
    if (f.vendorId) parts.push("ven=" + encodeURIComponent(f.vendorId));
    if (f.from) parts.push("from=" + f.from);
    if (f.to) parts.push("to=" + f.to);
    return base + (parts.length ? "?" + parts.join("&") : "");
  }

  function options(list, selected, allLabel) {
    var html = '<option value="">' + esc(allLabel) + "</option>";
    list.forEach(function (o) {
      html += '<option value="' + esc(o.value) + '"' + (o.value === selected ? " selected" : "") + ">" + esc(o.label) + "</option>";
    });
    return html;
  }

  // show: { type: [types] | null, employee: bool, vendor: bool }
  function filtersHtml(f, show, lk, pool) {
    var html = '<form class="filters" aria-label="Filter documents">';
    if (show.types && show.types.length > 1) {
      html += '<label>Type<select name="type">' +
        options(show.types.map(function (t) { return { value: t, label: U().typeLabel(t) }; }), f.type, "All types") +
        "</select></label>";
    }
    if (show.employee) {
      var emps = uniqueIds(pool, "employeeId", f.employeeId).map(function (id) {
        return { value: id, label: lk.emp[id] ? lk.emp[id].name : id };
      }).sort(byLabel);
      html += '<label>Employee<select name="emp">' + options(emps, f.employeeId, "All employees") + "</select></label>";
    }
    if (show.vendor) {
      var vens = uniqueIds(pool, "vendorId", f.vendorId).map(function (id) {
        return { value: id, label: lk.ven[id] ? lk.ven[id].name : id };
      }).sort(byLabel);
      html += '<label>Vendor<select name="ven">' + options(vens, f.vendorId, "All vendors") + "</select></label>";
    }
    html += '<label>From<input type="date" name="from" value="' + esc(f.from) + '"></label>';
    html += '<label>To<input type="date" name="to" value="' + esc(f.to) + '"></label>';
    if (f.type || f.employeeId || f.vendorId || f.from || f.to) {
      html += '<button type="button" class="btn-link" data-clear>Clear filters</button>';
    }
    return html + "</form>";
  }

  function byLabel(a, b) { return a.label < b.label ? -1 : a.label > b.label ? 1 : 0; }

  function uniqueIds(docs, key, keep) {
    var seen = {}, out = [];
    docs.forEach(function (d) { if (d[key] && !seen[d[key]]) { seen[d[key]] = 1; out.push(d[key]); } });
    if (keep && !seen[keep]) out.push(keep);
    return out;
  }

  function wireFilters(root, base, q) {
    var form = root.querySelector(".filters");
    if (!form) return;
    function apply(clear) {
      var f = clear ? {} : {
        type: form.type ? form.type.value : "",
        employeeId: form.emp ? form.emp.value : "",
        vendorId: form.ven ? form.ven.value : "",
        from: form.from.value,
        to: form.to.value
      };
      location.replace(buildHash(base, q, f));
    }
    form.addEventListener("change", function () { apply(false); });
    form.addEventListener("submit", function (e) { e.preventDefault(); apply(false); });
    var clear = form.querySelector("[data-clear]");
    if (clear) clear.addEventListener("click", function () { apply(true); });
  }

  // ---------- Document list ----------

  function listHtml(docs, lk, emptyText) {
    if (!docs.length) return '<p class="empty">' + esc(emptyText) + "</p>";
    var rows = docs.map(function (d) {
      return "<tr>" +
        '<td class="lib-name"><a href="#/doc/' + encodeURIComponent(d.id) + '">' + esc(d.name) + "</a></td>" +
        '<td class="lib-meta" data-label="Type">' + esc(U().typeLabel(d.type)) + "</td>" +
        '<td class="lib-meta" data-label="For">' + esc(whoOf(d, lk)) + "</td>" +
        '<td class="lib-meta" data-label="Date">' + esc(U().formatDate(d.docDate)) + "</td>" +
        '<td class="lib-status">' + badgeHtml(d) + "</td>" +
        "</tr>";
    }).join("");
    return '<div class="card lib-list"><table class="table">' +
      "<thead><tr><th>Name</th><th>Type</th><th>For</th><th>Date</th><th>Status</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>";
  }

  function countLine(n) { return '<p class="muted lib-count">' + n + (n === 1 ? " document" : " documents") + "</p>"; }

  function notFound(root, title, text) {
    root.innerHTML = '<div class="lib-head"><a class="btn-link" href="#/library">‹ Library</a>' +
      '<h1 class="page-title">' + esc(title) + "</h1></div>" +
      '<p class="empty">' + esc(text) + "</p>";
  }

  // ---------- Screens ----------

  function renderFolders(root) {
    var filed = store().documents({ status: "filed" });
    var tiles = FOLDERS.map(function (f) {
      var n = filed.filter(function (d) { return d.folder === f.name; }).length;
      return '<a class="tile" href="#/library/' + encodeURIComponent(f.name) + '">' +
        "<strong>" + esc(f.name) + "</strong>" +
        '<span class="lib-tile-count">' + n + (n === 1 ? " document" : " documents") + "</span>" +
        '<span class="muted">' + esc(f.blurb) + "</span></a>";
    }).join("");
    root.innerHTML = '<h1 class="page-title">Library</h1>' +
      '<div class="lib-tiles">' + tiles + "</div>";
  }

  function renderFolder(root, params) {
    var folder = folderByName(params.segments[1]);
    if (!folder) return notFound(root, "Not found", "There is no folder called “" + params.segments[1] + "”.");
    var lk = lookups();
    var f = readFilters(params.query);
    if (folder.types.indexOf(f.type) < 0) f.type = "";
    if (folder.link !== "employee") f.employeeId = "";
    if (folder.link !== "vendor") f.vendorId = "";

    var pool = store().documents({ status: "filed", folder: folder.name });
    var docs = Sortable.search.run("", f).filter(function (d) { return d.folder === folder.name; });
    var base = "#/library/" + encodeURIComponent(folder.name);

    root.innerHTML =
      '<div class="lib-head"><a class="btn-link" href="#/library">‹ Library</a>' +
      '<h1 class="page-title">' + esc(folder.name) + "</h1></div>" +
      filtersHtml(f, { types: folder.types, employee: folder.link === "employee", vendor: folder.link === "vendor" }, lk, pool) +
      countLine(docs.length) +
      listHtml(docs, lk, pool.length ? "No documents match these filters." : "No documents in this folder yet.");
    wireFilters(root, base, null);
  }

  function renderSearch(root, params) {
    var q = String(params.query.q || "").trim();
    var lk = lookups();
    var f = readFilters(params.query);
    if (ALL_TYPES.indexOf(f.type) < 0) f.type = "";
    var pool = store().documents({ status: "filed" });

    var head = '<h1 class="page-title">' + (q ? "Results for “" + esc(q) + "”" : "Search") + "</h1>";
    if (!q) {
      root.innerHTML = head + '<p class="empty">Type a vendor, person, document type or month in the search box above, then press Enter.</p>';
      return;
    }
    var docs = Sortable.search.run(q, f);
    root.innerHTML = head +
      filtersHtml(f, { types: ALL_TYPES, employee: true, vendor: true }, lk, pool) +
      countLine(docs.length) +
      listHtml(docs, lk, "Nothing filed matches “" + q + "”. Documents still in review are in the Inbox.");
    wireFilters(root, "#/search", q);
  }

  function field(label, valueHtml) {
    if (valueHtml == null || valueHtml === "") return "";
    return "<div><dt>" + esc(label) + "</dt><dd>" + valueHtml + "</dd></div>";
  }

  var CHANNEL = { email: "Email", fax: "Fax", upload: "Upload" };

  function renderDoc(root, params) {
    var id = params.segments[1];
    var doc = id ? store().document(id) : null;
    if (!doc) return notFound(root, "Not found", "We couldn't find that document.");
    var u = U(), lk = lookups();
    var folder = doc.folder ? folderByName(doc.folder) : null;

    var emp = doc.employeeId && lk.emp[doc.employeeId];
    var ven = doc.vendorId && lk.ven[doc.vendorId];
    var fields =
      field("Type", esc(u.typeLabel(doc.type))) +
      field("Folder", folder ? '<a href="#/library/' + encodeURIComponent(folder.name) + '">' + esc(folder.name) + "</a>" : "Not filed yet") +
      field("Employee", emp ? '<a href="#/employees/' + encodeURIComponent(emp.id) + '">' + esc(emp.name) + "</a>" : "") +
      field("Vendor", ven ? esc(ven.name) : "") +
      field("Document date", esc(u.formatDate(doc.docDate)));
    if (doc.invoice) {
      fields +=
        field("Amount", doc.invoice.amountCents != null ? esc(u.formatMoney(doc.invoice.amountCents)) : "Not known") +
        field("Due date", doc.invoice.dueDate ? esc(u.formatDate(doc.invoice.dueDate)) : "Due date missing") +
        field("Paid on", doc.invoice.paidOn ? esc(u.formatDate(doc.invoice.paidOn)) : "");
    }
    if (CREDENTIAL[doc.type]) {
      fields +=
        field("Expires on", doc.expiresOn ? esc(u.formatDate(doc.expiresOn)) : "Not known") +
        field("Renewed on", doc.renewedOn ? esc(u.formatDate(doc.renewedOn)) : "");
    }
    fields +=
      field("Received", esc(u.formatDate(doc.receivedOn)) + " by " + esc(CHANNEL[doc.channel] || doc.channel || "") +
        (doc.sender && doc.sender !== "upload" ? ' <span class="muted">(' + esc(doc.sender) + ")</span>" : "")) +
      field("Original file", esc(doc.filename));

    // One main action, plus Move.
    var actions = "";
    if (doc.status === "review") {
      actions = '<a class="btn btn-primary" href="#/inbox">Review in Inbox</a>';
    } else {
      if (doc.invoice && !doc.invoice.paidOn) actions += '<button type="button" class="btn btn-primary" data-act="paid">Mark as paid</button>';
      if (CREDENTIAL[doc.type] && !doc.renewedOn) actions += '<button type="button" class="btn btn-primary" data-act="renewed">Mark as renewed</button>';
      actions += '<button type="button" class="btn" data-act="move">Move</button>';
    }

    var back = folder ? '<a class="btn-link" href="#/library/' + encodeURIComponent(folder.name) + '">‹ ' + esc(folder.name) + "</a>"
      : '<a class="btn-link" href="#/library">‹ Library</a>';

    root.innerHTML =
      '<div class="lib-head">' + back +
      '<h1 class="page-title">' + esc(doc.name) + "</h1>" +
      '<div class="lib-doc-status">' + badgeHtml(doc) + "</div></div>" +
      '<div class="row-actions lib-actions">' + actions + "</div>" +
      '<div class="lib-move" hidden></div>' +
      '<div class="lib-doc">' +
      '<section class="card"><h2>Details</h2><dl class="lib-fields">' + fields + "</dl></section>" +
      '<section class="card"><h2>Preview</h2>' +
      '<figure class="lib-preview" aria-label="Document preview">' +
      '<figcaption class="muted">' + esc(doc.filename) + "</figcaption>" +
      "<p>" + esc(doc.text || "No text was read from this document.") + "</p>" +
      '<p class="muted lib-preview-note">Preview only. The prototype has no real file.</p>' +
      "</figure></section></div>";

    var moveBox = root.querySelector(".lib-move");
    var btns = root.querySelectorAll("[data-act]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (e) {
        var act = e.currentTarget.getAttribute("data-act");
        if (act === "paid") store().markPaid(doc.id);
        else if (act === "renewed") store().markRenewed(doc.id);
        else if (act === "move") openMove(moveBox, doc);
      });
    }
  }

  // Move reuses the Inbox picker, looked up only at click time.
  function openMove(box, doc) {
    var inbox = Sortable.views.inbox;
    box.hidden = false;
    if (!inbox || typeof inbox.picker !== "function") {
      box.innerHTML = '<p class="empty">Move isn’t available yet.</p>';
      return;
    }
    box.innerHTML = "";
    try {
      var el = inbox.picker(doc, function (result) {
        if (result) store().correct(doc.id, result);
      }, function () { box.innerHTML = ""; box.hidden = true; });
      if (el && el.nodeType === 1) box.appendChild(el);
    } catch (err) {
      if (window.console) console.error(err);
      box.innerHTML = '<p class="empty">Move isn’t available yet.</p>';
    }
  }

  Sortable.views.library = {
    render: function (root, params) {
      root.className = "page screen-library";
      var first = params.segments[0];
      if (first === "doc") return renderDoc(root, params);
      if (first === "search") return renderSearch(root, params);
      if (params.segments.length > 1) return renderFolder(root, params);
      return renderFolders(root);
    }
  };
})();
