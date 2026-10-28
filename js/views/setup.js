// Sortable.views.setup: read-only Setup page (R11). Owner: Intake.
// Shows the practice details, the forwarding email and the e-fax number,
// each with a Copy button. No editable settings, no logins, no pricing.
(function () {
  var Sortable = (window.Sortable = window.Sortable || {});
  Sortable.views = Sortable.views || {};

  function channelCard(id, title, help, value, label) {
    var esc = Sortable.util.esc;
    return (
      '<section class="card setup-channel" aria-labelledby="' + id + '-title">' +
      '<h2 id="' + id + '-title">' + esc(title) + '</h2>' +
      '<p class="muted">' + esc(help) + '</p>' +
      '<div class="setup-copy">' +
      '<input type="text" id="' + id + '" class="setup-value" readonly value="' + esc(value) + '" aria-label="' + esc(label) + '">' +
      '<button type="button" class="btn btn-primary" data-copy="' + id + '">Copy</button>' +
      '</div>' +
      '<p class="setup-feedback" id="' + id + '-status" role="status" aria-live="polite"></p>' +
      '</section>'
    );
  }

  // Fallback when the Clipboard API is missing or refused (common on file://).
  function selectFallback(input, status) {
    input.focus();
    input.select();
    try { input.setSelectionRange(0, input.value.length); } catch (e) { /* ignore */ }
    var ok = false;
    try { ok = document.execCommand && document.execCommand("copy"); } catch (e) { ok = false; }
    status.textContent = ok ? "Copied" : "Select and copy";
  }

  function onCopy(e) {
    var btn = e.currentTarget;
    var id = btn.getAttribute("data-copy");
    var input = btn.parentNode.querySelector("#" + id);
    var status = btn.parentNode.parentNode.querySelector("#" + id + "-status");
    if (!input || !status) return;
    status.textContent = "";

    var clip = navigator.clipboard;
    if (clip && typeof clip.writeText === "function") {
      var p;
      try { p = clip.writeText(input.value); } catch (err) { p = null; }
      if (p && typeof p.then === "function") {
        p.then(function () { status.textContent = "Copied"; },
               function () { selectFallback(input, status); });
        return;
      }
    }
    selectFallback(input, status);
  }

  Sortable.views.setup = {
    render: function (root) {
      var esc = Sortable.util.esc;
      var p = Sortable.store.practice() || {};
      root.className = "page screen-setup";

      root.innerHTML =
        '<h1 class="page-title">Setup</h1>' +

        '<section class="card setup-practice" aria-labelledby="setup-practice-title">' +
        '<h2 id="setup-practice-title">Your practice</h2>' +
        '<dl class="setup-details">' +
        '<div><dt>Name</dt><dd>' + esc(p.name || "") + '</dd></div>' +
        '<div><dt>Specialty</dt><dd>' + esc(p.specialty || "") + '</dd></div>' +
        '<div><dt>Staff</dt><dd>' + esc(String(p.staffCount != null ? p.staffCount : "")) + ' people</dd></div>' +
        '</dl>' +
        '</section>' +

        '<div class="setup-channels">' +
        channelCard(
          "setup-email",
          "Forwarding email",
          "Forward any bill, license or form to this address and Sortable files it.",
          p.forwardEmail || "",
          "Forwarding email address"
        ) +
        channelCard(
          "setup-fax",
          "E-fax number",
          "Point your fax line here. Every fax that arrives is filed the same way.",
          p.faxNumber || "",
          "E-fax number"
        ) +
        '</div>' +

        '<p class="muted setup-uploads">Have scanned files? Drag them into the <a href="#/inbox">Inbox</a>.</p>';

      var buttons = root.querySelectorAll("[data-copy]");
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", onCopy);
      }
    }
  };
})();
