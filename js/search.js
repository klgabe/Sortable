/* Sortable.search: ranked search over filed documents (hard rule 9, R5).
   Owner: Library. Reads data only through Sortable.store. */
(function () {
  "use strict";

  var S = (window.Sortable = window.Sortable || {});

  function lower(s) { return String(s == null ? "" : s).toLowerCase(); }

  // Splits on whitespace (and commas), lowercased, empties dropped.
  function words(query) {
    return lower(query).split(/[\s,]+/).filter(function (w) { return w.length > 0; });
  }

  // Month name / 3-letter form matches the docDate month; a 4-digit year matches the docDate year.
  function matchesDate(word, docDate) {
    if (!docDate) return false;
    var m = S.util.monthIndex(word);
    if (m !== null && +String(docDate).slice(5, 7) === m) return true;
    if (/^\d{4}$/.test(word) && String(docDate).slice(0, 4) === word) return true;
    return false;
  }

  // Points for one word: 2 (name, employee or vendor), 1 (type label, text or date), 0 (no match).
  function score(word, f) {
    if (f.name.indexOf(word) >= 0 || f.employee.indexOf(word) >= 0 || f.vendor.indexOf(word) >= 0) return 2;
    if (f.type.indexOf(word) >= 0 || f.text.indexOf(word) >= 0 || matchesDate(word, f.docDate)) return 1;
    return 0;
  }

  // Newest docDate first; same date falls back to the higher id (matches store.documents).
  function byNewest(a, b) {
    if (a.docDate !== b.docDate) return a.docDate < b.docDate ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  }

  // run(query, { type, employeeId, vendorId, from, to }) -> filed documents, best first.
  // Every key is optional; from/to are inclusive "YYYY-MM-DD" bounds on docDate.
  function run(query, filters) {
    var f = filters || {};
    var docs = S.store.documents({
      status: "filed",
      type: f.type || undefined,
      employeeId: f.employeeId || undefined,
      vendorId: f.vendorId || undefined
    }).filter(function (d) {
      if (f.from && (!d.docDate || d.docDate < f.from)) return false;
      if (f.to && (!d.docDate || d.docDate > f.to)) return false;
      return true;
    });

    var ws = words(query);
    if (!ws.length) return docs.sort(byNewest);

    var empNames = {}, venNames = {};
    S.store.employees().forEach(function (e) { empNames[e.id] = lower(e.name); });
    S.store.vendors().forEach(function (v) { venNames[v.id] = lower(v.name); });

    var hits = [];
    docs.forEach(function (d) {
      var fields = {
        name: lower(d.name),
        type: lower(S.util.typeLabel(d.type)),
        employee: (d.employeeId && empNames[d.employeeId]) || "",
        vendor: (d.vendorId && venNames[d.vendorId]) || "",
        text: lower(d.text),
        docDate: d.docDate
      };
      var total = 0;
      for (var i = 0; i < ws.length; i++) {
        var p = score(ws[i], fields);
        if (!p) return; // every word must match
        total += p;
      }
      hits.push({ doc: d, score: total });
    });

    hits.sort(function (a, b) {
      if (a.score !== b.score) return b.score - a.score;
      return byNewest(a.doc, b.doc);
    });
    return hits.map(function (h) { return h.doc; });
  }

  S.search = { run: run };
})();
