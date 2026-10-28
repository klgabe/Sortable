/* Sortable.store: the only code that changes state.
   Owner: Data. Deep-copies window.MOCK on init(), so the seed is never changed.
   Calls Sortable.util and Sortable.ai at runtime only (they may load later). */
(function () {
  "use strict";

  var S = (window.Sortable = window.Sortable || {});

  var FOLDER_FOR_TYPE = {
    invoice: "Invoices", license: "Licenses", certification: "Licenses", training: "Licenses",
    hr_form: "HR", contract: "Vendors", other: "Vendors", compliance: "Compliance"
  };
  var CREDENTIAL = { license: true, certification: true, training: true };
  var SOON_DAYS = { invoice: 7, credential: 60, compliance: 60 };

  var state = null;       // deep copy of MOCK
  var learned = [];       // learned rules, newest first
  var incomingPos = 0;    // index of the next MOCK.incoming item
  var extracted = {};     // doc id -> { amountCents, dueDate, expiresOn } kept while a type may change
  var suggested = {};     // doc id -> classify result for review documents
  var listeners = [];

  function copy(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function today() { return S.util.today(); }
  function isCredential(type) { return !!CREDENTIAL[type]; }

  function ensure() { if (!state) init(); }

  function init() {
    state = copy(window.MOCK);
    learned = [];
    incomingPos = 0;
    extracted = {};
    suggested = {};
    state.documents.forEach(function (d) {
      extracted[d.id] = {
        amountCents: d.invoice ? d.invoice.amountCents : null,
        dueDate: d.invoice ? d.invoice.dueDate : null,
        expiresOn: d.expiresOn || null
      };
    });
  }

  function notify() {
    listeners.slice().forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error(e); }
    });
  }

  function findIn(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  // Accepts "doc-012" or a deadline id such as "invoice:doc-012".
  function bareId(id) {
    id = String(id == null ? "" : id);
    var i = id.indexOf(":");
    return i >= 0 ? id.slice(i + 1) : id;
  }
  function rawDoc(id) { ensure(); return findIn(state.documents, bareId(id)); }

  // ---------- Reads ----------

  function practice() { ensure(); return copy(state.practice); }
  function employees() { ensure(); return copy(state.employees); }
  function employee(id) { ensure(); return copy(findIn(state.employees, id)); }
  function vendors() { ensure(); return copy(state.vendors); }
  function vendor(id) { ensure(); return copy(findIn(state.vendors, id)); }

  function byNewest(a, b) {
    if (a.docDate !== b.docDate) return a.docDate < b.docDate ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  }

  function documents(filter) {
    ensure();
    var f = filter || {};
    return copy(state.documents.filter(function (d) {
      if (f.status && d.status !== f.status) return false;
      if (f.folder && d.folder !== f.folder) return false;
      if (f.employeeId && d.employeeId !== f.employeeId) return false;
      if (f.vendorId && d.vendorId !== f.vendorId) return false;
      if (f.type && d.type !== f.type) return false;
      return true;
    }).sort(byNewest));
  }
  function document(id) { return copy(rawDoc(id)); }

  function reviewQueue() {
    ensure();
    return copy(state.documents.filter(function (d) { return d.status === "review"; })
      .sort(function (a, b) {
        if (a.receivedOn !== b.receivedOn) return a.receivedOn < b.receivedOn ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      }));
  }

  function compliance() {
    ensure();
    return copy(state.compliance.slice().sort(function (a, b) { return a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0; }));
  }

  function rules() { ensure(); return copy(learned.concat(state.filingRules)); }

  // Not in the CLAUDE.md API list: the Inbox needs it to disable "Simulate incoming".
  function incomingCount() { ensure(); return Math.max(0, state.incoming.length - incomingPos); }

  function invoiceStatus(doc) {
    if (!doc || !doc.invoice) return null;
    if (doc.invoice.paidOn) return "paid";
    if (doc.invoice.dueDate && doc.invoice.dueDate < today()) return "overdue";
    return "unpaid";
  }

  function deadlineStatus(dueOn, closedOn) {
    if (closedOn) return "done";
    return dueOn < today() ? "overdue" : "upcoming";
  }

  function makeDeadline(kind, refId, title, dueOn, closedOn, employeeId, vendorId) {
    var status = deadlineStatus(dueOn, closedOn);
    var soon = status === "upcoming" && S.util.daysBetween(today(), dueOn) <= SOON_DAYS[kind];
    return {
      id: kind + ":" + refId, kind: kind, title: title, dueOn: dueOn, status: status, soon: soon,
      refId: refId, employeeId: employeeId || null, vendorId: vendorId || null, closedOn: closedOn || null
    };
  }

  // Only filed documents create deadlines. An invoice with no dueDate creates none.
  function deadlines() {
    ensure();
    var out = [];
    state.documents.forEach(function (d) {
      if (d.status !== "filed") return;
      if (d.type === "invoice" && d.invoice && d.invoice.dueDate) {
        out.push(makeDeadline("invoice", d.id, d.name, d.invoice.dueDate, d.invoice.paidOn, d.employeeId, d.vendorId));
      } else if (isCredential(d.type) && d.expiresOn) {
        out.push(makeDeadline("credential", d.id, d.name, d.expiresOn, d.renewedOn, d.employeeId, d.vendorId));
      }
    });
    state.compliance.forEach(function (c) {
      out.push(makeDeadline("compliance", c.id, c.title, c.dueOn, c.resolvedOn, null, null));
    });
    return out.sort(function (a, b) {
      if (a.dueOn !== b.dueOn) return a.dueOn < b.dueOn ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
  }

  // ---------- Internal helpers for writes ----------

  // Sets type-specific fields (invoice / expiresOn / renewedOn) to match doc.type.
  function shapeFields(d) {
    var x = extracted[d.id] || {};
    if (d.type === "invoice") {
      if (!d.invoice) d.invoice = { amountCents: x.amountCents == null ? null : x.amountCents, dueDate: x.dueDate || null, paidOn: null };
    } else {
      if (d.invoice) { x.amountCents = d.invoice.amountCents; x.dueDate = d.invoice.dueDate; }
      d.invoice = null;
    }
    if (isCredential(d.type)) {
      if (!d.expiresOn) d.expiresOn = x.expiresOn || null;
      if (d.renewedOn === undefined) d.renewedOn = null;
    } else {
      if (d.expiresOn) x.expiresOn = d.expiresOn;
      d.expiresOn = null;
      d.renewedOn = null;
    }
    extracted[d.id] = x;
  }

  // Hard rule 8 (automatic): a newer filed credential renews older open ones.
  function applyRenewal(d) {
    if (d.status !== "filed" || !isCredential(d.type) || !d.employeeId || !d.expiresOn) return;
    state.documents.forEach(function (o) {
      if (o.id === d.id || o.status !== "filed" || o.type !== d.type) return;
      if (o.employeeId !== d.employeeId || o.renewedOn || !o.expiresOn) return;
      if (o.expiresOn < d.expiresOn) o.renewedOn = today();
    });
  }

  function fileAs(d, result) {
    var folder = result.folder || FOLDER_FOR_TYPE[result.type];
    d.type = result.type;
    d.folder = folder;
    d.employeeId = (folder === "Licenses" || folder === "HR") ? result.employeeId || null : null;
    d.vendorId = (folder === "Invoices" || folder === "Vendors") ? result.vendorId || null : null;
    d.status = "filed";
    d.alternatives = [];
    shapeFields(d);
    d.name = S.ai.nameFor(copy(d));
    delete suggested[d.id];
    applyRenewal(d);
  }

  function dateFromFilename(name) {
    var m = /(\d{4})-(\d{2})-(\d{2})/.exec(name || "") || /(\d{4})(\d{2})(\d{2})/.exec(name || "");
    if (!m) return null;
    var y = +m[1], mo = +m[2], da = +m[3];
    if (y < 1900 || mo < 1 || mo > 12 || da < 1 || da > 31) return null;
    return m[1] + "-" + m[2] + "-" + m[3];
  }

  // ---------- Writes ----------

  function receive(input) {
    ensure();
    var inp = copy(input) || {};
    inp.fields = inp.fields || {};
    var c = S.ai.classify(inp, rules()) || {};
    var result = c.result || { type: "other", folder: null, employeeId: null, vendorId: null };
    var f = c.fields || {};
    var confidence = typeof c.confidence === "number" ? c.confidence : 0.40;

    var d = {
      id: S.util.nextId("doc", state.documents),
      filename: inp.filename,
      name: inp.filename,
      type: result.type || "other",
      folder: null,
      status: "review",
      confidence: confidence,
      alternatives: (c.alternatives || []).slice(0, 3),
      matchKey: S.ai.matchKey(inp),
      channel: inp.channel,
      sender: inp.sender,
      receivedOn: today(),
      docDate: f.docDate || inp.fields.docDate || dateFromFilename(inp.filename) || today(),
      employeeId: result.employeeId || null,
      vendorId: result.vendorId || null,
      text: inp.text || "",
      invoice: null,
      expiresOn: null,
      renewedOn: null
    };
    extracted[d.id] = {
      amountCents: f.amountCents != null ? f.amountCents : inp.fields.amountCents != null ? inp.fields.amountCents : null,
      dueDate: f.dueDate || inp.fields.dueDate || null,
      expiresOn: f.expiresOn || inp.fields.expiresOn || null
    };
    state.documents.push(d);

    if (confidence >= 0.85 && result.folder) {
      fileAs(d, result);
    } else {
      suggested[d.id] = copy(result);
      shapeFields(d);
    }
    notify();
    return copy(d);
  }

  function nextIncoming() {
    ensure();
    if (incomingPos >= state.incoming.length) { notify(); return null; }
    var item = state.incoming[incomingPos];
    incomingPos += 1;
    return receive({ channel: item.channel, sender: item.sender, filename: item.filename, text: item.text, fields: item.fields });
  }

  // Files a review document as suggested. Returns null (and changes nothing) when
  // there is no suggestion to approve (a no-match document: use Fix instead).
  function approve(id) {
    var d = rawDoc(id);
    if (!d || d.status !== "review") { notify(); return null; }
    var r = suggested[d.id] || { type: d.type, folder: FOLDER_FOR_TYPE[d.type], employeeId: d.employeeId, vendorId: d.vendorId };
    if (!r.folder) { notify(); return null; }
    fileAs(d, r);
    notify();
    return copy(d);
  }

  function correct(id, result) {
    var d = rawDoc(id);
    if (!d || !result) { notify(); return null; }
    var rule = S.ai.ruleFromCorrection(copy(d), copy(result));
    if (rule) {
      var all = learned.concat(state.filingRules);
      if (!rule.id || findIn(all, rule.id)) rule.id = S.util.nextId("rule", all);
      learned.unshift(rule);
    }
    fileAs(d, result);
    notify();
    return copy(d);
  }

  function markPaid(id) {
    var d = rawDoc(id);
    if (d && d.invoice && !d.invoice.paidOn) d.invoice.paidOn = today();
    notify();
    return copy(d);
  }

  function markRenewed(id) {
    var d = rawDoc(id);
    if (d && isCredential(d.type) && !d.renewedOn) d.renewedOn = today();
    notify();
    return copy(d);
  }

  function resolveCompliance(id) {
    ensure();
    var c = findIn(state.compliance, bareId(id));
    if (c && !c.resolvedOn) c.resolvedOn = today();
    notify();
    return copy(c);
  }

  function subscribe(fn) {
    if (typeof fn === "function") listeners.push(fn);
    return function unsubscribe() {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  S.store = {
    init: init,
    practice: practice,
    employees: employees, employee: employee,
    vendors: vendors, vendor: vendor,
    documents: documents, document: document,
    reviewQueue: reviewQueue,
    compliance: compliance,
    rules: rules,
    incomingCount: incomingCount,
    invoiceStatus: invoiceStatus,
    deadlines: deadlines,
    receive: receive,
    nextIncoming: nextIncoming,
    approve: approve,
    correct: correct,
    markPaid: markPaid,
    markRenewed: markRenewed,
    resolveCompliance: resolveCompliance,
    subscribe: subscribe
  };
})();
