/* Sortable.reminders: reminder schedule and outbox (hard rule 7). Owner: Deadlines.
   Everything here is worked out from Sortable.store.deadlines() and never stored.
   - invoices: 7 and 1 days before the due date
   - credentials and compliance items: 60, 30 and 7 days before
   Nothing is sent on or after the due date. */
(function () {
  "use strict";

  var S = (window.Sortable = window.Sortable || {});

  var OFFSETS = {
    invoice: [7, 1],
    credential: [60, 30, 7],
    compliance: [60, 30, 7]
  };

  // The fixed schedule for one deadline, earliest first: [{ sendOn, offsetDays }].
  // It ignores today and closedOn; outbox() decides what was sent and what is next.
  function schedule(deadline) {
    if (!deadline || !deadline.dueOn) return [];
    var offsets = OFFSETS[deadline.kind] || [];
    var out = [];
    offsets.forEach(function (n) {
      if (n <= 0) return; // never on or after the due date
      var sendOn = S.util.addDays(deadline.dueOn, -n);
      if (sendOn < deadline.dueOn) out.push({ sendOn: sendOn, offsetDays: n });
    });
    return out.sort(function (a, b) { return a.sendOn < b.sendOn ? -1 : a.sendOn > b.sendOn ? 1 : 0; });
  }

  function row(d, r) {
    return { deadlineId: d.id, title: d.title, sendOn: r.sendOn, offsetDays: r.offsetDays };
  }

  // { sent, next }
  // sent: every reminder with sendOn <= today (and <= closedOn when closed), newest first.
  // next: the earliest reminder after today for each open item, soonest first.
  // Returns every row; the Dashboard applies its own 20-row limit.
  function outbox() {
    var today = S.util.today();
    var sent = [];
    var next = [];
    S.store.deadlines().forEach(function (d) {
      var closed = d.closedOn || null;
      var upcoming = null;
      schedule(d).forEach(function (r) {
        if (r.sendOn <= today) {
          if (!closed || r.sendOn <= closed) sent.push(row(d, r));
        } else if (!closed && !upcoming) {
          upcoming = r;
        }
      });
      if (upcoming) next.push(row(d, upcoming));
    });
    function tie(a, b) {
      if (a.offsetDays !== b.offsetDays) return a.offsetDays - b.offsetDays;
      return a.deadlineId < b.deadlineId ? -1 : a.deadlineId > b.deadlineId ? 1 : 0;
    }
    sent.sort(function (a, b) {
      if (a.sendOn !== b.sendOn) return a.sendOn < b.sendOn ? 1 : -1;
      return tie(a, b);
    });
    next.sort(function (a, b) {
      if (a.sendOn !== b.sendOn) return a.sendOn < b.sendOn ? -1 : 1;
      return tie(a, b);
    });
    return { sent: sent, next: next };
  }

  S.reminders = { schedule: schedule, outbox: outbox };
})();
