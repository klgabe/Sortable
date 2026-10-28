# CLAUDE.md: Sortable MVP prototype

Sortable files every document that reaches an independent medical or dental practice and tracks the deadlines inside those documents. This repo holds a **clickable MVP prototype that runs on mock data only**. [PRD.md](PRD.md) is the source of truth for what the product does. This file covers how the prototype is built.

**If the PRD doesn't decide something, ask before building it. Don't guess.** Add each answer to "Decisions already made" below.

## MVP rules

1. **Opens by double-clicking `index.html`.** It runs from `file://` in current Chrome, Safari and Firefox, with no server, no build step and no installs.
2. **No framework, no libraries, no CDN.** Use plain HTML, CSS and JavaScript only. The app must work offline.
3. **Use classic `<script>` tags only.** ES modules (`type="module"`), `fetch`, XHR and `.json` files all fail on `file://`. Mock data is a `.js` file that sets a global. Every file attaches to the single namespace `window.Sortable`.
4. **Mock data only.** No network calls, no backend, no real AI, no API keys and no real email or fax. Anything "AI" does comes from scripted results in the mock data.
5. **State lives in memory and resets on reload.** Do not use localStorage, sessionStorage or cookies. On load the app deep-copies `MOCK`, so the seed is never changed.
6. **"Today" is fixed.** All business logic uses `Sortable.util.today()` (which returns `MOCK.today`), never `new Date()`, so deadlines and overdue states look the same in every demo.
7. **Never read file contents.** Drag-and-drop uses only `file.name`. Documents have no real file behind them, and the detail view shows a placeholder preview with the document's `text`.
8. **Only `js/store.js` changes state.** Views call the store functions listed in "Module APIs". Views never edit data directly.
9. **Escape every piece of data** that goes into `innerHTML` (use `Sortable.util.esc`).
10. **Only build what the PRD puts in scope** (R1–R12) plus the extras in "Decisions already made". Nothing else.
11. **Stay in your own files.** Each file has one owner (see File layout). If your work needs a change in someone else's file, ask that owner.
12. **Styles live in two places.**
    - **Shared:** tokens and the class kit live in `css/styles.css`, which belongs to Design.
    - **Per screen:** each screen owns `css/<screen>.css` for styles only that screen uses. Its `render` sets `root.className = "page screen-<name>"`, and every rule in its CSS file starts with `.screen-<name>`.
    - **Restrictions:** screen CSS uses the tokens (`var(--accent)` and so on), with no new colors and no fonts. No inline styles anywhere.
    - **Shared changes go to Design:** if something belongs in the shared kit, ask the Design owner.
13. **Works at phone width.** Every screen works at 375px wide with no sideways scrolling, as well as on a laptop. Tables stack or scroll inside their card, never the whole page.

## Hard product rules (from the PRD)

These rules hold no matter how the code changes.

1. **Nothing is filed silently when the AI is unsure.** A document with confidence below **0.85** goes to the review queue and never into a folder (R4).
2. **Approve or fix takes one click** from the review queue (R4).
   - **Approve** files the document as the AI suggested.
   - **Fix** shows the document's `alternatives` as buttons. There are up to 3, each labelled `Folder – Employee or Vendor`, and clicking one files the document there.
   - A **Something else…** link opens the full picker for anything else.
   - A filed document can be moved from its detail view with **Move**, which opens the same picker.
3. **Every filed document is named `Type – Employee or Vendor – YYYY-MM-DD`**, for example `Invoice – Henry Schein – 2026-03-12` (R3).
   - **Type** is the type label: Invoice, License, Certification, Training, HR form, Contract, Compliance, Document (for `other`).
   - **The middle slot** is the employee's name if there is one, otherwise the vendor's name, otherwise `Practice`.
   - **The date** is `docDate`.
   - A document in review shows its `filename` until it is filed.
4. **The library has exactly five folders**, in this order: Invoices, Licenses, HR, Vendors, Compliance. Each folder sets the document type and what it links to:

   | Folder | Types | Linked to |
   |---|---|---|
   | Invoices | `invoice` | a vendor |
   | Licenses | `license`, `certification`, `training` | an employee |
   | HR | `hr_form` | an employee |
   | Vendors | `contract`, `other` | a vendor |
   | Compliance | `compliance` | nothing |

5. **Every employee-linked document also shows in that employee's folder** (R9).
6. **Every deadline has a status of `upcoming`, `overdue` or `done`.** Status is worked out from the deadline date, the date it was closed (`closedOn`) and today. It is never stored.
   - A deadline is **done** once it's closed: an invoice is paid, a credential is renewed, or a compliance item is resolved.
   - Otherwise it is **overdue** if its date is before today, and **upcoming** if not.
   - Invoices show their status as **unpaid**, **paid** or **overdue** (R6).
   - An upcoming item is **soon** when it is inside its first reminder window: 7 days for invoices, 60 days for credentials and compliance items.
   - An invoice with no `dueDate` creates no deadline and shows "Due date missing".
7. **Reminders follow fixed schedules:**
   - invoices: 7 and 1 days before the due date (R7)
   - licenses, certifications, trainings and compliance items: 60, 30 and 7 days before (R8, R12)

   No reminders are sent on or after the due date. An overdue item just shows as overdue.

   When an item is closed (paid, renewed or resolved), its future reminders disappear. Reminders sent before it was closed stay in the outbox.

   Reminders appear in the reminder outbox, and no real email is sent.
8. **A newer credential renews the old one.** "Credential" means a license, certification or training.
   - **Automatic:** when a credential is filed for an employee who already has an open credential of the same type with an earlier `expiresOn`, the old one gets `renewedOn = today`. This happens whenever a document becomes `filed`, whether by arrival, Approve or a correction.
   - **By hand:** **Mark as renewed** sets `renewedOn = today` with no new document.
9. **Search covers filed documents only** (R5). Documents still in review are found in the Inbox.
   - **Matching:** the query is split into words. Each word matches case-insensitively as a substring of the name, type label, employee name, vendor name or `text`. A month name or its 3-letter short form ("March", "mar") matches the `docDate` month. A 4-digit year matches the `docDate` year. Every word must match.
   - **Ranking:** each word scores 2 points if it matches the name, employee or vendor, and 1 point if it matches anywhere else. Results are sorted by score, and ties go to the newest `docDate`.
   - **Filters:** type, employee, vendor, and a from/to range on `docDate`.
   - "Henry Schein March" must return `Invoice – Henry Schein – 2026-03-12` first.
10. **Out of scope. Do not build any of these:** insurance billing, claims or appeals; e-signature; scheduling, time clock or payroll; performance reviews or concern reporting; integrations (Dentrix, OMSVision, QuickBooks, Weave, Paychex); onboarding checklists; logins or roles.
11. **All people in the mock data are made up.** Never use real names or real personal data. Real vendor names (Henry Schein, Medline) are fine.
12. **Write for a busy, non-technical practice manager.** Use plain words, no jargon, and show at most one main action per row.

## Decisions already made

These were decided with Kate on 2026-10-21, to fill gaps in the PRD.

| Topic | Decision |
|---|---|
| Mock practice | Specialty medical practice, 40 staff, one location |
| Review threshold | Confidence below 0.85 goes to review |
| Alert lead times | Invoices: 7 and 1 days. Credentials and compliance: 60, 30 and 7 days |
| Overdue | No reminders after the due date. Overdue items show at the top of the Dashboard in red |
| Intake | A "Simulate incoming" button takes the next item from `MOCK.incoming`. Drag-and-drop matches the filename against filing rules. A file with no match goes to review at confidence 0.40 |
| Fix | Up to 3 alternative buttons for one-click fixing, plus a "Something else…" picker |
| Renewal | A newer credential renews the old one automatically. A "Mark as renewed" button also works |
| Learning | Only corrections (Fix or Move) teach a rule. Approve does not. See "Learning from corrections" |
| Persistence | None. A reload restores the seed |
| Today | Fixed at `MOCK.today` = 2026-10-21 |
| Reminder outbox | Shown on the Dashboard, newest first, 20 rows. It lists the reminders sent by today, and the next one scheduled for each open item |
| Search scope | Filed documents only |
| Money | US dollars, shown as `$1,234.56` |
| Starting state | 3 documents in review and 4 items in the incoming queue. The calendar opens on today's month |
| Setup (R11) | A read-only page showing the practice's forwarding email, e-fax number and practice details |
| Navigation | The Dashboard is home. There are 5 tabs, and the compliance calendar is a view inside Deadlines |
| Brand | Calm teal accent and the system font, light theme only (see "Design tokens and class kit") |
| File owners | Owners are role placeholders. The team assigns names later |

## Navigation

Every screen has the same header: the sorted-bars logo and the `sortable` wordmark, then five tabs, a search box, and a ⚙ icon that opens Setup. The header lives in `index.html`, which the Shell owner owns. Pressing Enter in the search box goes to `#/search?q=<query>`.

```
[≡ sortable]  Dashboard | Inbox (3) | Library | Deadlines | Employees    [ Search… ]  ⚙
```

The app uses hash routing (this works on `file://`), and the browser Back button must work. Any unknown route goes to `#/dashboard`. An unknown ID, such as `#/doc/doc-999`, shows a "Not found" empty state.

| Route | View file | Screen |
|---|---|---|
| `#/dashboard` (default) | `dashboard` | Five panels: **Overdue** (all kinds), **Due in the next 30 days** (invoices and compliance), **Expiring credentials** (next 60 days), **Review queue** count with a link to the Inbox, and the **Reminder outbox** |
| `#/inbox` | `inbox` | "Simulate incoming" button (disabled when the queue is empty) and drop zone. Review queue, where each row shows the filename, suggested name, folder and confidence, with **Approve** and **Fix** buttons. The tab badge shows the number of items in review |
| `#/library` | `library` | Folder tiles with counts |
| `#/library/:folder` | `library` | Documents in the folder, with filters |
| `#/doc/:id` | `library` | Document detail: fields, placeholder preview and **Move**. Invoices also get **Mark as paid**, and credentials get **Mark as renewed** |
| `#/search?q=` | `library` | Search results with filters |
| `#/deadlines` | `deadlines` | Overdue items first, then upcoming items by date. Each row has one action: **Mark as paid** (invoice), **Mark as renewed** (credential) or **Resolve** (compliance). Has a List / Calendar toggle |
| `#/deadlines/calendar` | `deadlines` | Month calendar of every open deadline. Opens on today's month, with ‹ › arrows for the previous and next month |
| `#/employees` | `employees` | Staff list, with a flag showing how many credentials each person has overdue or expiring in the next 60 days |
| `#/employees/:id` | `employees` | One employee's documents, with expiring credentials flagged |
| `#/setup` | `setup` | Forwarding email, e-fax number and practice details |

## Module APIs

Every builder codes against these functions. Change a signature only with the file's owner, and update this section in the same change.

**`Sortable.util`** (`js/util.js`)
- `today()` returns `MOCK.today`.
- `addDays(date, n)` returns a date string.
- `daysBetween(a, b)` returns `b − a` in whole days.
- `monthIndex(word)` returns 1–12 for a month name or its 3-letter short form, otherwise `null`.
- `formatDate(date)` returns `"Mar 12, 2026"`.
- `formatMoney(cents)` returns `"$1,234.56"`.
- `esc(text)` escapes text for HTML.
- `nextId(prefix, list)` returns the next ID with that prefix, one higher than the highest in `list` (`"doc-048"`). `doc` IDs are padded to 3 digits and all others to 2. `list` may hold objects with an `.id` or plain ID strings.
- `typeLabel(type)` returns the display label from hard rule 3.

**`Sortable.store`** (`js/store.js`)

Setup:
- `init()` deep-copies `MOCK` into state. `app.js` calls it once at boot.

Reads:
- `practice()`
- `employees()` and `employee(id)`
- `vendors()` and `vendor(id)`
- `documents(filter)`, where `filter` is `{ status, folder, employeeId, vendorId, type }` and every key is optional. Also `document(id)`.
- `reviewQueue()`
- `compliance()`
- `rules()` returns the learned rules first, then the seed rules.
- `incomingCount()` returns how many simulated arrivals are left, so the Inbox can disable "Simulate incoming".
- All reads return deep copies. Changing a returned object never changes state.
- Only filed documents create deadlines.
- `invoiceStatus(doc)` returns `"unpaid"`, `"paid"` or `"overdue"`.
- `deadlines()` returns a list of deadline objects:

  ```js
  { id: "invoice:doc-012",   // "<kind>:<refId>"
    kind,                    // "invoice" | "credential" | "compliance"
    title,                   // the document name, or the compliance item's title
    dueOn,                   // invoice.dueDate, expiresOn or dueOn
    status,                  // "upcoming" | "overdue" | "done"
    soon,                    // true or false (hard rule 6)
    refId, employeeId, vendorId,
    closedOn }               // paidOn, renewedOn or resolvedOn, otherwise null
  ```

Writes (each one notifies subscribers):
- `receive(input)` classifies the input, creates the document as `filed` or `review`, and returns it. `input` is `{ channel, sender, filename, text, fields }`.
- `nextIncoming()` calls `receive` with the next `MOCK.incoming` item. It returns `null` when the queue is empty.
- `approve(id)` files the document as suggested. If there is no suggested folder (no rule matched), it returns `null` and the document stays in review.
- `correct(id, result)` files or moves the document to `result`, rebuilds its name and learns a rule.
- `markPaid(id)` sets `invoice.paidOn = today`.
- `markRenewed(id)` sets `renewedOn = today`.
- `resolveCompliance(id)` sets `resolvedOn = today`.
- `markPaid`, `markRenewed` and `resolveCompliance` accept either a plain ID or a deadline ID such as `invoice:doc-012`.

Subscribing:
- `subscribe(fn)`

**`Sortable.ai`** (`js/ai-mock.js`)
- `classify(input, rules)` returns `{ result, confidence, alternatives, fields }`.
- `matchKey(input)` returns the learning key (see "Learning from corrections").
- `ruleFromCorrection(doc, result)` returns a learned rule, or `null`.
- `nameFor(doc)` returns the filed name.

**`Sortable.search`** (`js/search.js`)
- `run(query, filters)` returns ranked filed documents. `filters` is `{ type, employeeId, vendorId, from, to }`.
- Query words are split on spaces and commas.
- Each word scores once, at its highest value.
- `from` and `to` include both ends, and blank filters are ignored.
- An empty query returns the filtered documents, newest first.

**`Sortable.reminders`** (`js/reminders.js`)
- `schedule(deadline)` returns `[{ sendOn, offsetDays }]`.
- `outbox()` returns `{ sent: [...], next: [...] }`. Each row is `{ deadlineId, title, sendOn, offsetDays }`.
- A reminder counts as sent if `sendOn` is on or before today. For a closed item, it must also be on or before `closedOn`.
- `schedule()` returns the full schedule, earliest first.
- `sent` is ordered newest first, and `next` soonest first.
- `outbox()` returns every row. The Dashboard shows 20.

**Views and rendering**
- Each view registers itself as `Sortable.views.<name> = { render(root, params) }`.
- `params` is `{ segments, query }`. For `#/library/Invoices` that is `{ segments: ["library", "Invoices"], query: {} }`. For `#/search?q=henry` it is `{ segments: ["search"], query: { q: "henry" } }`.
- On every route change, and after every store write (through `subscribe`), the router clears `<main id="view">`, gives the view a fresh `root` element and re-renders. It also updates the Inbox badge.
- Views attach event listeners only to elements they create, never to `document` or `window`.

## Data contract

`data/mock-data.js` sets `window.MOCK`. This is the only seed data. Field names and types below are a contract: change them only with the Data owner, and update this section in the same change.

General conventions:

- Dates are `"YYYY-MM-DD"` strings with no times or time zones.
- Money is integer cents.
- IDs are a prefix plus a zero-padded number: `emp-01`, `ven-01`, `doc-001`, `cmp-01`, `in-01`, `rule-01`.

```js
window.MOCK = {
  today: "2026-10-21",
  practice: { name, specialty, staffCount: 40, forwardEmail, faxNumber },

  employees: [ { id: "emp-01", name, role, startDate } ],          // exactly 40 people, all made up
  vendors:   [ { id: "ven-01", name, category } ],

  documents: [ {
    id: "doc-001",
    filename,             // original file name
    name,                 // filed: "Type – Employee or Vendor – YYYY-MM-DD". In review: same as filename
    type,                 // "invoice" | "license" | "certification" | "training"
                          // | "hr_form" | "contract" | "compliance" | "other"
    folder,               // "Invoices" | "Licenses" | "HR" | "Vendors" | "Compliance". Null in review
    status,               // "filed" | "review"
    confidence,           // 0 to 1
    alternatives,         // review only: up to 3 results { type, folder, employeeId, vendorId }. Otherwise []
    matchKey,             // learning key from Sortable.ai.matchKey
    channel,              // "email" | "fax" | "upload"
    sender,               // email address, fax number or "upload"
    receivedOn, docDate,
    employeeId,           // or null
    vendorId,             // or null
    text,                 // short readable summary, used by search and the preview
    invoice,              // invoices only: { amountCents, dueDate, paidOn }. paidOn is null until paid. Otherwise null
    expiresOn,            // credentials only, otherwise null
    renewedOn             // credentials only. Null until renewed
  } ],

  compliance: [ { id: "cmp-01", title, category, dueOn, resolvedOn, documentId } ],
  // category: "OSHA" | "HIPAA" | "Inspection" | "Renewal". resolvedOn is null until resolved. documentId may be null.

  incoming: [ { id: "in-01", channel, sender, filename, text,
                fields: { docDate, amountCents, dueDate, expiresOn } } ],
  // the scripted arrivals, in order, for "Simulate incoming". fields holds what the "AI read"; unused keys are null.

  filingRules: [ { id: "rule-01", match, confidence,
                   result: { type, folder, employeeId, vendorId },
                   alternatives: [ result, ... ],            // up to 3
                   fields: { amountCents, dueInDays, expiresInDays } } ]  // optional, relative to docDate
};
```

### How classification works

1. **Match a rule.** Build the match text: `(sender + " " + filename)`, lowercased. The first rule in `store.rules()` whose `match` is a substring of that text wins. Its `result`, `confidence` and `alternatives` are used.
2. **No match.** If no rule matches, the document goes to review with `confidence: 0.40`, a `result` of type `other` with no folder, and no alternatives. Fix then shows only "Something else…".
3. **Fill in the fields.** `docDate` comes from the input's `fields.docDate`. If there isn't one, it comes from a date in the filename (`YYYY-MM-DD` or `YYYYMMDD`). If there's still none, it is today. `receivedOn` is always today.
4. **Fill in amounts and dates.** These come from the input's `fields` first. Otherwise they come from the rule's relative `fields`:
   - `dueDate = docDate + dueInDays`
   - `expiresOn = docDate + expiresInDays`

   If neither has them, they are null.

### Learning from corrections

Each correction (Fix or Move) adds a learned rule:

```js
{ id: nextId("rule"), match: doc.matchKey, confidence: 0.95, result: <the corrected result>, alternatives: [] }
```

- Learned rules go before all seed rules, newest first. They live in memory only.
- **Learning key:** for email and fax, the key is the lowercased `sender`. For uploads, it is the filename, lowercased, with the extension removed, cut off at the first digit, and with trailing `_ - . ` and spaces trimmed. So `license_renewal_okafor.pdf` gives `license_renewal_okafor`, and `scan_0001.pdf` gives `scan`.
- **Short keys:** if the key is shorter than 6 characters, `ruleFromCorrection` returns `null` and nothing is learned. This stops one upload from teaching a rule that matches every upload.

### Values that are always worked out, never stored

- invoice status and deadline status
- the deadline list
- the reminder schedule and outbox
- review-queue count
- search results

### Fixtures the seed must include

Every check in "How we check it works" depends on these.

| Fixture | Exact seed |
|---|---|
| Henry Schein March invoice | A filed, paid document `Invoice – Henry Schein – 2026-03-12`. It is the only Henry Schein document dated in March |
| Invoice due in 7 days | An unpaid invoice with `dueDate` 2026-10-28 |
| Invoice due in 1 day | An unpaid invoice with `dueDate` 2026-10-22 |
| Overdue invoice | An unpaid invoice with `dueDate` before 2026-10-21 |
| Expiring certification | A certification for one employee with `expiresOn` 2026-12-05 (45 days out). It is never renewed by any check |
| License to be renewed | A license for employee `emp-07` with `expiresOn` 2026-11-10 (20 days out) |
| License renewal upload rule | A rule with `match: "license_renewal_okafor"`, confidence 0.92, result `{ type: "license", folder: "Licenses", employeeId: "emp-07" }` and `fields: { expiresInDays: 730 }`. `emp-07`'s surname is Okafor |
| `in-01` | Email from `ap@henryschein.com`, `HenrySchein_Invoice_Oct.pdf`, with fields `docDate` 2026-10-20, an amount and `dueDate` 2026-11-19. It matches a `henryschein.com` rule at 0.96 → Invoices / Henry Schein |
| `in-02` | Fax from `+1 555 0142`, `fax_0142.pdf`, with text that reads as unreadable. It matches no rule → review at 0.40 |
| `in-03` | Email from `billing@medline.com`, `Medline_statement_Oct.pdf`. It matches a `medline.com` rule at 0.70 that wrongly suggests Vendors / contract / Medline. The rule's first alternative is Invoices / invoice / Medline |
| `in-04` | Email from `billing@medline.com`, `Medline_statement_Nov.pdf`. After `in-03` is fixed, it files as an invoice with no review |
| Seeded review items | 3 documents with `status: "review"`, each with alternatives |
| Seed size | Exactly 40 employees, at least 10 of them with documents. At least 6 vendors. At least 30 filed documents covering all 5 folders. At least 8 invoices across at least 5 vendors, with at least 2 paid. At least 5 compliance items covering all 4 categories, with at least 1 overdue and 1 resolved |

The drag-and-drop demo files are any files renamed to `license_renewal_okafor.pdf` (matches the rule) and `scan_0001.pdf` (no match).

## File layout (one owner per file)

Owners are role placeholders until the team assigns names. One person can hold several roles, but each file has exactly one owner. In the first build step, the Shell owner creates stub files for all 6 views, so every route works from the start. Each stub then passes to its view's owner.

| File | What it does | Owner |
|---|---|---|
| `index.html` | Page shell, header, nav, search box, `<main id="view">`, `<script>` load order | Shell |
| `css/styles.css` | Design tokens, the class kit, header and nav | Design |
| `css/dashboard.css` | Dashboard-only styles | Deadlines |
| `css/inbox.css` | Inbox-only styles | Intake |
| `css/library.css` | Library-only styles | Library |
| `css/deadlines.css` | Deadlines-only styles | Deadlines |
| `css/employees.css` | Employees-only styles | People |
| `css/setup.css` | Setup-only styles | Intake |
| `assets/logo.svg` | Sorted-bars logo | Design |
| `data/mock-data.js` | `window.MOCK` seed data | Data |
| `js/util.js` | `Sortable.util` | Shell |
| `js/store.js` | `Sortable.store`: deep-copies the seed, the only code that changes state, derived values, renewal rule | Data |
| `js/ai-mock.js` | `Sortable.ai`: rule matching, fields, alternatives, naming, learning keys | Intake |
| `js/search.js` | `Sortable.search` | Library |
| `js/reminders.js` | `Sortable.reminders` | Deadlines |
| `js/router.js` | Hash routing, params, re-render on store change, active tab, Inbox badge | Shell |
| `js/views/dashboard.js` | Dashboard screen | Deadlines |
| `js/views/inbox.js` | Inbox, simulate button, drop zone, review queue, Fix alternatives and picker | Intake |
| `js/views/library.js` | Folders, folder list, document detail with Move, search results | Library |
| `js/views/deadlines.js` | Deadline list and calendar | Deadlines |
| `js/views/employees.js` | Employee list and detail | People |
| `js/views/setup.js` | Setup page | Intake |
| `js/app.js` | Boot: init the store, start the router | Shell |

Scripts load in this order in `index.html`:

1. `util`
2. `mock-data`
3. `store`
4. `ai-mock`
5. `search`
6. `reminders`
7. the views
8. `router`
9. `app`

Functions may call modules that load later, as long as they don't run until boot.

**The picker** is the "Something else…" form for Fix, and also the form behind **Move**. It lives in `inbox.js` as `Sortable.views.inbox.picker(doc, onSave)`, and `library.js` reuses it.
- It shows a Folder dropdown, then a Type dropdown (only for Licenses: License, Certification or Training).
- Then it shows an Employee dropdown (Licenses, HR) or a Vendor dropdown (Invoices, Vendors). Compliance shows neither.
- Then it shows a Save button.

## Design tokens and class kit

Use a light theme only, with the font `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Status colors are always paired with a text label, never color alone.

| Token | Value | Used for |
|---|---|---|
| `--accent` | `#0F766E` | Primary buttons, active tab, links |
| `--accent-weak` | `#CCFBF1` | Selected rows, drop-zone hover |
| `--text` | `#111827` | Body text |
| `--muted` | `#6B7280` | Secondary text |
| `--border` | `#E5E7EB` | Lines and card borders |
| `--bg` | `#FFFFFF` | Page background |
| `--surface` | `#F9FAFB` | Cards, header |
| `--danger` | `#B91C1C` | Overdue |
| `--warn` | `#B45309` | Soon |
| `--ok` | `#15803D` | Paid, renewed, resolved |

`index.html` loads `css/styles.css` first, then the six screen CSS files in alphabetical order. The shared classes the Design owner provides are listed below. Screens use these first, and add classes in their own CSS file only for screen-specific layout.

- **Header** (markup in `index.html`): `.app-header`, `.brand`, `.brand-logo`, `.wordmark`, `.tabs`, `.tab`, `.tab.is-active`, `.tab-badge`, `.search-box`, `.setup-link`. On `#/doc` and `#/search` the Library tab is active. The badge is hidden when the count is 0.
- **Layout:** `.page`, `.page-title`, `.card`, `.card-grid`, `.muted`, `.empty`
- **Tables:** `.table`, `.row-actions`
- **Buttons:** `.btn`, `.btn-primary`, `.btn-link`
- **Status badges:** `.badge`, `.badge-overdue`, `.badge-soon`, `.badge-ok`, `.badge-review`
- **Library:** `.tile` (folder tile)
- **Inbox:** `.dropzone`, `.dropzone.is-over`, `.alt-buttons`
- **Forms:** `.picker`, `.filters`
- **Calendar:** `.cal`, `.cal-head` (the month bar with ‹ › arrows), `.cal-dow`, `.cal-day`, `.cal-day.is-today`, `.cal-day.is-blank`, `.cal-item`, `.cal-item.is-overdue`, `.cal-item.is-soon`
- **Dashboard and Inbox:** `.outbox`, `.outbox-row`
- **Selection:** `tr.is-selected`
- **Extra tokens:** `--danger-weak`, `--warn-weak`, `--ok-weak` (light backgrounds for the status colors)

**Checking phone width:** headless Chrome won't make a window narrower than 500px. To check a screen at phone width, load the app in a 375px-wide `<iframe>` on a test page, then compare `document.documentElement.scrollWidth` with 375.

## How we check it works

Run through this list by hand before every demo and after any change. Open `index.html` by double-clicking it, with the devtools console open. Run the checks in this order: checks 4 and 6 change the data that later checks rely on.

1. The Dashboard loads with no console errors, with Wi-Fi turned off. The Inbox badge shows 3.
2. Every tab and route in the Navigation table opens, and the Back button works.
3. Click **Simulate incoming** once (`in-01`). The Henry Schein invoice files under Invoices with the vendor, amount and due date 2026-11-19 filled in.
4. Drag in `license_renewal_okafor.pdf`. It files under Licenses with an expiration date 730 days out, and appears in `emp-07`'s folder. Their old license now shows Renewed, and its remaining alerts disappear.
5. Click **Simulate incoming** (`in-02`), then drag in `scan_0001.pdf`. Both land in the review queue, not a folder.
6. Click **Simulate incoming** (`in-03`). It lands in review with the wrong suggestion. Click **Fix**, then the "Invoices – Medline" button. It files as an invoice. Click **Simulate incoming** (`in-04`). It files as an invoice with no review.
7. Search "Henry Schein March". `Invoice – Henry Schein – 2026-03-12` is the first result, and it opens in one click.
8. In the outbox:
   - the invoice due 2026-10-28 shows its 7-day reminder
   - the invoice due 2026-10-22 shows both its 7-day and 1-day reminders
   - the certification expiring 2026-12-05 shows its 60-day alert
9. **Mark as paid** on the invoice due 2026-10-28. Its status changes to paid everywhere. Its scheduled 1-day reminder (2026-10-27) disappears from the outbox's next reminders, and its 7-day reminder stays in the sent list.
10. Reload the page. All changes are gone and the seed state is back.
