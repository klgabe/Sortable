// Sortable.views.inbox: Simulate incoming, drop zone, review queue, Fix and the picker. Owner: Intake.
// Also exports Sortable.views.inbox.picker(doc, onSave), which the Library reuses for Move.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  var FOLDERS = ["Invoices", "Licenses", "HR", "Vendors", "Compliance"];
  var FOLDER_FOR_TYPE = {
    invoice: "Invoices", license: "Licenses", certification: "Licenses", training: "Licenses",
    hr_form: "HR", contract: "Vendors", other: "Vendors", compliance: "Compliance"
  };
  var CREDENTIAL_TYPES = ["license", "certification", "training"];
  var EMPLOYEE_FOLDERS = { Licenses: true, HR: true };
  var VENDOR_FOLDERS = { Invoices: true, Vendors: true };

  // View state that must survive the re-render after every store write.
  var fixOpen = null;     // id of the review row whose Fix panel is open
  var pickerOpen = null;  // id of the review row whose "Something else…" picker is open
  var notices = [];       // [{ kind: "filed" | "review" | "info", doc, text }]
  var current = null;     // { root, params } of the last render

  // ---------- helpers ----------

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function rerender() {
    if (current) render(current.root, current.params);
  }

  function partyName(r) {
    var S = Sortable.store;
    var e = r.employeeId && S.employee(r.employeeId);
    if (e) return e.name;
    var v = r.vendorId && S.vendor(r.vendorId);
    if (v) return v.name;
    return "Practice";
  }

  // "Folder – Employee or Vendor" (hard rule 2).
  function resultLabel(r) {
    var folder = r.folder || FOLDER_FOR_TYPE[r.type];
    return folder + " – " + partyName(r);
  }

  // A review document carries the AI's suggestion in its type / employeeId / vendorId.
  // A no-match document has type "other", nobody linked and no alternatives.
  function suggestionFor(doc) {
    if (doc.type === "other" && !doc.employeeId && !doc.vendorId && !(doc.alternatives || []).length) return null;
    return { type: doc.type, folder: FOLDER_FOR_TYPE[doc.type], employeeId: doc.employeeId, vendorId: doc.vendorId };
  }

  function confidenceBadge(c) {
    var pct = Math.round((Number(c) || 0) * 100) + "%";
    var cls = c >= 0.85 ? "badge badge-ok" : c >= 0.6 ? "badge badge-soon" : "badge badge-overdue";
    var word = c >= 0.85 ? "High" : c >= 0.6 ? "Unsure" : "Low";
    return el("span", cls, word + " · " + pct);
  }

  function channelLabel(doc) {
    if (doc.channel === "upload") return "Uploaded";
    if (doc.channel === "fax") return "Fax from " + doc.sender;
    return "Email from " + doc.sender;
  }

  function noticeFor(doc) {
    if (!doc) return { kind: "info", text: "Nothing left to simulate." };
    if (doc.status === "filed") return { kind: "filed", doc: doc };
    return { kind: "review", doc: doc };
  }

  // ---------- actions ----------

  function simulate() {
    var doc = Sortable.store.nextIncoming();
    // nextIncoming notifies before we get here; set state and draw again.
    notices = [noticeFor(doc)];
    rerender();
  }

  function receiveFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    var out = [];
    files.forEach(function (file) {
      // Never read file contents: only file.name (MVP rule 7).
      var doc = Sortable.store.receive({ channel: "upload", sender: "upload", filename: file.name, text: "", fields: {} });
      out.push(noticeFor(doc));
    });
    notices = out;
    rerender();
  }

  function fileWith(id, result) {
    fixOpen = null;
    pickerOpen = null;
    var doc = Sortable.store.correct(id, result);
    notices = doc ? [noticeFor(doc)] : [];
    rerender();
  }

  function approve(id) {
    fixOpen = null;
    pickerOpen = null;
    var doc = Sortable.store.approve(id);
    notices = doc ? [noticeFor(doc)] : [{ kind: "info", text: "There is no suggestion to approve. Use Fix to choose a folder." }];
    rerender();
  }

  // ---------- picker (shared with Library Move) ----------

  function option(value, label, selected) {
    var o = el("option", null, label);
    o.value = value;
    if (selected) o.selected = true;
    return o;
  }

  function labelled(text, control) {
    var l = el("label");
    l.appendChild(document.createTextNode(text));
    l.appendChild(control);
    return l;
  }

  // picker(doc, onSave[, onCancel]) → a <form class="picker"> element.
  // onSave receives { type, folder, employeeId, vendorId }.
  function picker(doc, onSave, onCancel) {
    doc = doc || {};
    var S = Sortable.store;
    var form = el("form", "picker");
    form.setAttribute("aria-label", "Choose where this document goes");

    var startFolder = doc.folder || (doc.status === "review" && !suggestionFor(doc) ? "" : FOLDER_FOR_TYPE[doc.type]) || "";

    var folderSel = el("select");
    folderSel.name = "folder";
    folderSel.appendChild(option("", "Choose a folder…", !startFolder));
    FOLDERS.forEach(function (f) { folderSel.appendChild(option(f, f, f === startFolder)); });

    var typeSel = el("select");
    typeSel.name = "type";
    CREDENTIAL_TYPES.forEach(function (t) {
      typeSel.appendChild(option(t, Sortable.util.typeLabel(t), t === doc.type));
    });

    var empSel = el("select");
    empSel.name = "employeeId";
    empSel.appendChild(option("", "Choose an employee…", !doc.employeeId));
    S.employees().slice().sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; })
      .forEach(function (e) { empSel.appendChild(option(e.id, e.name, e.id === doc.employeeId)); });

    var venSel = el("select");
    venSel.name = "vendorId";
    venSel.appendChild(option("", "Choose a vendor…", !doc.vendorId));
    S.vendors().slice().sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; })
      .forEach(function (v) { venSel.appendChild(option(v.id, v.name, v.id === doc.vendorId)); });

    var typeLabel = labelled("Type", typeSel);
    var empLabel = labelled("Employee", empSel);
    var venLabel = labelled("Vendor", venSel);

    var save = el("button", "btn btn-primary", "Save");
    save.type = "submit";

    form.appendChild(labelled("Folder", folderSel));
    form.appendChild(typeLabel);
    form.appendChild(empLabel);
    form.appendChild(venLabel);
    form.appendChild(save);

    if (typeof onCancel === "function") {
      var cancel = el("button", "btn-link", "Cancel");
      cancel.type = "button";
      cancel.addEventListener("click", function () { onCancel(); });
      form.appendChild(cancel);
    }

    function sync() {
      var f = folderSel.value;
      typeLabel.hidden = f !== "Licenses";
      empLabel.hidden = !EMPLOYEE_FOLDERS[f];
      venLabel.hidden = !VENDOR_FOLDERS[f];
      var ok = !!f &&
        (!EMPLOYEE_FOLDERS[f] || !!empSel.value) &&
        (!VENDOR_FOLDERS[f] || !!venSel.value);
      save.disabled = !ok;
    }

    function resultFromForm() {
      var f = folderSel.value;
      var type;
      if (f === "Licenses") type = typeSel.value;
      else if (f === "Invoices") type = "invoice";
      else if (f === "HR") type = "hr_form";
      else if (f === "Compliance") type = "compliance";
      else type = (doc.type === "contract" || doc.type === "other") ? doc.type : "contract";
      return {
        type: type,
        folder: f,
        employeeId: EMPLOYEE_FOLDERS[f] ? empSel.value || null : null,
        vendorId: VENDOR_FOLDERS[f] ? venSel.value || null : null
      };
    }

    folderSel.addEventListener("change", sync);
    empSel.addEventListener("change", sync);
    venSel.addEventListener("change", sync);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sync();
      if (save.disabled) return;
      if (typeof onSave === "function") onSave(resultFromForm());
    });

    sync();
    return form;
  }

  // ---------- render ----------

  function renderNotices(page) {
    if (!notices.length) return;
    var box = el("div", "card inbox-notice");
    box.setAttribute("role", "status");
    var list = el("ul", "inbox-notice-list");
    notices.forEach(function (n) {
      var li = el("li", "inbox-notice-row");
      if (n.kind === "filed") {
        li.appendChild(el("span", "badge badge-ok", "Filed"));
        var a = el("a", null, n.doc.name);
        a.href = "#/doc/" + encodeURIComponent(n.doc.id);
        li.appendChild(a);
        li.appendChild(el("span", "muted", "in " + n.doc.folder));
      } else if (n.kind === "review") {
        li.appendChild(el("span", "badge badge-review", "Needs review"));
        li.appendChild(el("span", null, n.doc.filename));
        li.appendChild(el("span", "muted", "is waiting below"));
      } else {
        li.appendChild(el("span", "muted", n.text));
      }
      list.appendChild(li);
    });
    box.appendChild(list);
    var dismiss = el("button", "btn-link inbox-notice-dismiss", "Dismiss");
    dismiss.type = "button";
    dismiss.addEventListener("click", function () { notices = []; rerender(); });
    box.appendChild(dismiss);
    page.appendChild(box);
  }

  function renderIntake(page) {
    var card = el("section", "card inbox-intake");
    var head = el("div", "inbox-intake-head");
    var txt = el("div");
    txt.appendChild(el("h2", null, "New documents"));
    var left = Sortable.store.incomingCount();
    txt.appendChild(el("p", "muted", left
      ? left + " waiting to arrive by email or fax."
      : "No more emails or faxes waiting."));
    head.appendChild(txt);

    var sim = el("button", "btn btn-primary inbox-simulate", "Simulate incoming");
    sim.type = "button";
    sim.disabled = left === 0;
    sim.addEventListener("click", simulate);
    head.appendChild(sim);
    card.appendChild(head);

    var zone = el("div", "dropzone");
    zone.appendChild(el("strong", null, "Drop files here"));
    zone.appendChild(el("span", null, "or"));
    var input = el("input", "inbox-file-input");
    input.type = "file";
    input.multiple = true;
    input.id = "inbox-file-input";
    var pick = el("label", "btn inbox-choose", "Choose files");
    pick.htmlFor = input.id;
    zone.appendChild(input);
    zone.appendChild(pick);
    input.addEventListener("change", function () { receiveFiles(input.files); });

    zone.addEventListener("dragenter", function (e) { e.preventDefault(); zone.classList.add("is-over"); });
    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      zone.classList.add("is-over");
    });
    zone.addEventListener("dragleave", function (e) {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove("is-over");
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("is-over");
      if (e.dataTransfer) receiveFiles(e.dataTransfer.files);
    });
    card.appendChild(zone);
    page.appendChild(card);
  }

  function renderRow(doc) {
    var li = el("li", "inbox-row");
    li.setAttribute("data-doc-id", doc.id);

    var info = el("div", "inbox-row-info");
    info.appendChild(el("strong", "inbox-filename", doc.filename));
    info.appendChild(el("span", "muted inbox-source", channelLabel(doc) + " · " + Sortable.util.formatDate(doc.receivedOn)));

    var sugg = suggestionFor(doc);
    var guess = el("div", "inbox-guess");
    if (sugg) {
      var named = el("span", "inbox-guess-name");
      named.textContent = Sortable.ai.nameFor({ type: sugg.type, employeeId: sugg.employeeId, vendorId: sugg.vendorId, docDate: doc.docDate });
      guess.appendChild(el("span", "muted", "Suggested:"));
      guess.appendChild(named);
      guess.appendChild(el("span", "muted", "in " + sugg.folder));
    } else {
      guess.appendChild(el("span", "muted", "No suggestion. Choose where it goes with Fix."));
    }
    info.appendChild(guess);
    var conf = el("div", "inbox-confidence");
    conf.appendChild(el("span", "muted", "Confidence"));
    conf.appendChild(confidenceBadge(doc.confidence));
    info.appendChild(conf);
    li.appendChild(info);

    var actions = el("div", "row-actions inbox-row-actions");
    var ok = el("button", "btn btn-primary", "Approve");
    ok.type = "button";
    if (!sugg) {
      ok.disabled = true;
      ok.title = "No suggestion to approve";
    }
    ok.addEventListener("click", function () { approve(doc.id); });
    var fix = el("button", "btn", "Fix");
    fix.type = "button";
    fix.setAttribute("aria-expanded", fixOpen === doc.id ? "true" : "false");
    fix.addEventListener("click", function () {
      fixOpen = fixOpen === doc.id ? null : doc.id;
      pickerOpen = null;
      rerender();
    });
    actions.appendChild(ok);
    actions.appendChild(fix);
    li.appendChild(actions);

    if (fixOpen === doc.id) {
      var panel = el("div", "inbox-fix");
      var alts = (doc.alternatives || []).slice(0, 3);
      if (alts.length) panel.appendChild(el("p", "muted", "File it in:"));
      var row = el("div", "alt-buttons");
      alts.forEach(function (r) {
        var b = el("button", "btn", resultLabel(r));
        b.type = "button";
        b.addEventListener("click", function () { fileWith(doc.id, r); });
        row.appendChild(b);
      });
      var other = el("button", "btn-link", "Something else…");
      other.type = "button";
      other.addEventListener("click", function () {
        pickerOpen = pickerOpen === doc.id ? null : doc.id;
        rerender();
      });
      row.appendChild(other);
      panel.appendChild(row);
      if (pickerOpen === doc.id) {
        panel.appendChild(picker(doc, function (result) { fileWith(doc.id, result); }, function () {
          pickerOpen = null;
          rerender();
        }));
      }
      li.appendChild(panel);
    }
    return li;
  }

  function renderQueue(page) {
    var queue = Sortable.store.reviewQueue();
    var section = el("section", "card inbox-queue");
    var head = el("div", "inbox-queue-head");
    head.appendChild(el("h2", null, "Needs review"));
    head.appendChild(el("span", "badge" + (queue.length ? " badge-review" : ""), String(queue.length)));
    section.appendChild(head);

    if (!queue.length) {
      section.appendChild(el("p", "empty", "All caught up. Nothing needs review."));
    } else {
      section.appendChild(el("p", "muted", "Sortable wasn't sure where these go. Approve the suggestion or fix it."));
      var list = el("ul", "inbox-list");
      queue.forEach(function (doc) { list.appendChild(renderRow(doc)); });
      section.appendChild(list);
    }
    page.appendChild(section);
  }

  function render(root, params) {
    current = { root: root, params: params };
    // Drop open panels for documents that are no longer in review.
    var ids = Sortable.store.reviewQueue().map(function (d) { return d.id; });
    if (fixOpen && ids.indexOf(fixOpen) < 0) fixOpen = null;
    if (pickerOpen && ids.indexOf(pickerOpen) < 0) pickerOpen = null;

    root.className = "page screen-inbox";
    root.innerHTML = "";
    root.appendChild(el("h1", "page-title", "Inbox"));
    renderNotices(root);
    renderIntake(root);
    renderQueue(root);
  }

  Sortable.views.inbox = { render: render, picker: picker };
})();
