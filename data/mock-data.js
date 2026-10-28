/* Sortable MVP prototype: seed data (window.MOCK).
   Owner: Data. All people are made up. Henry Schein and Medline are real vendors.
   The store deep-copies this object on init(); nothing else may change it. */
(function () {
  "use strict";

  var TODAY = "2026-10-21";

  var employees = [
    { id: "emp-01", name: "Marisol Vance", role: "Physician", startDate: "2014-08-04" },
    { id: "emp-02", name: "Theo Lindqvist", role: "Physician", startDate: "2017-03-13" },
    { id: "emp-03", name: "Priya Ramaswamy", role: "Registered nurse", startDate: "2019-06-03" },
    { id: "emp-04", name: "Dashiell Moreau", role: "Medical assistant", startDate: "2021-01-11" },
    { id: "emp-05", name: "Keiko Abernathy", role: "Front desk lead", startDate: "2018-09-24" },
    { id: "emp-06", name: "Rafael Quintero", role: "Radiology technician", startDate: "2016-05-16" },
    { id: "emp-07", name: "Adaeze Okafor", role: "Nurse practitioner", startDate: "2020-02-10" },
    { id: "emp-08", name: "Lorcan Whitfield", role: "Physician assistant", startDate: "2022-07-18" },
    { id: "emp-09", name: "Sunniva Halvorsen", role: "Registered nurse", startDate: "2015-11-02" },
    { id: "emp-10", name: "Bastian Oyelaran", role: "Medical assistant", startDate: "2023-04-03" },
    { id: "emp-11", name: "Imogen Castellano", role: "Physician", startDate: "2012-10-01" },
    { id: "emp-12", name: "Wendell Ashby", role: "Billing specialist", startDate: "2026-02-02" },
    { id: "emp-13", name: "Noor Haddadin", role: "Scheduler", startDate: "2025-08-11" },
    { id: "emp-14", name: "Caspian Delacroix", role: "Medical assistant", startDate: "2024-03-25" },
    { id: "emp-15", name: "Talia Brennan-Reyes", role: "Registered nurse", startDate: "2021-09-13" },
    { id: "emp-16", name: "Orrin Szabo", role: "Office manager", startDate: "2013-01-07" },
    { id: "emp-17", name: "Esperanza Liang", role: "Medical assistant", startDate: "2022-11-14" },
    { id: "emp-18", name: "Jory Pemberton", role: "Front desk", startDate: "2023-06-19" },
    { id: "emp-19", name: "Ximena Albescu", role: "Billing specialist", startDate: "2019-02-25" },
    { id: "emp-20", name: "Hollis Mbeki-Grant", role: "Lab technician", startDate: "2020-08-31" },
    { id: "emp-21", name: "Saoirse Kettering", role: "Registered nurse", startDate: "2018-04-09" },
    { id: "emp-22", name: "Anselm Vortigern", role: "Physician", startDate: "2021-07-06" },
    { id: "emp-23", name: "Mireille Tanaka-Ross", role: "Medical assistant", startDate: "2024-10-07" },
    { id: "emp-24", name: "Desmond Achterberg", role: "IT coordinator", startDate: "2017-12-04" },
    { id: "emp-25", name: "Fenna Rasmusen", role: "Scheduler", startDate: "2022-01-24" },
    { id: "emp-26", name: "Gideon Nwachukwu-Hale", role: "Radiology technician", startDate: "2019-10-14" },
    { id: "emp-27", name: "Liesel Montague", role: "Registered nurse", startDate: "2016-08-22" },
    { id: "emp-28", name: "Ravi Thornbury", role: "Physician assistant", startDate: "2023-09-05" },
    { id: "emp-29", name: "Odalys Fairweather", role: "Front desk", startDate: "2025-03-17" },
    { id: "emp-30", name: "Kasimir Bellweather", role: "Lab technician", startDate: "2020-05-11" },
    { id: "emp-31", name: "Annika Solberg-Diaz", role: "Medical assistant", startDate: "2021-12-06" },
    { id: "emp-32", name: "Tobiah Rennick", role: "Billing specialist", startDate: "2018-07-30" },
    { id: "emp-33", name: "Calla Whitcombe", role: "Registered nurse", startDate: "2022-04-18" },
    { id: "emp-34", name: "Emeric Ludovici", role: "Physician", startDate: "2015-09-08" },
    { id: "emp-35", name: "Juniper Akintola", role: "Medical assistant", startDate: "2024-06-24" },
    { id: "emp-36", name: "Matthias Corrigan", role: "Facilities", startDate: "2014-02-17" },
    { id: "emp-37", name: "Rosalind Ishikawa", role: "Scheduler", startDate: "2023-01-09" },
    { id: "emp-38", name: "Silas Underhill", role: "Lab technician", startDate: "2019-04-29" },
    { id: "emp-39", name: "Wren Oduya", role: "Front desk", startDate: "2025-11-03" },
    { id: "emp-40", name: "Yusra Kallander", role: "Registered nurse", startDate: "2020-10-26" }
  ];

  var vendors = [
    { id: "ven-01", name: "Henry Schein", category: "Medical supplies" },
    { id: "ven-02", name: "Medline", category: "Medical supplies" },
    { id: "ven-03", name: "Brightline Lab Services", category: "Reference lab" },
    { id: "ven-04", name: "Cascade Medical Waste", category: "Waste disposal" },
    { id: "ven-05", name: "Summit Office Supply", category: "Office supplies" },
    { id: "ven-06", name: "Northbay Linen", category: "Linen service" },
    { id: "ven-07", name: "ClearPath IT", category: "IT services" }
  ];

  var LABELS = {
    invoice: "Invoice", license: "License", certification: "Certification", training: "Training",
    hr_form: "HR form", contract: "Contract", compliance: "Compliance", other: "Document"
  };
  var FOLDER = {
    invoice: "Invoices", license: "Licenses", certification: "Licenses", training: "Licenses",
    hr_form: "HR", contract: "Vendors", other: "Vendors", compliance: "Compliance"
  };

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Same rule as Sortable.ai.matchKey (see CLAUDE.md "Learning from corrections").
  function matchKey(channel, sender, filename) {
    if (channel !== "upload") return String(sender).toLowerCase();
    var k = String(filename).toLowerCase().replace(/\.[^.]*$/, "");
    var m = k.search(/[0-9]/);
    if (m >= 0) k = k.slice(0, m);
    return k.replace(/[_\-. ]+$/, "");
  }

  function filedName(type, employeeId, vendorId, docDate) {
    var emp = employeeId && byId(employees, employeeId);
    var ven = vendorId && byId(vendors, vendorId);
    var middle = emp ? emp.name : ven ? ven.name : "Practice";
    return LABELS[type] + " – " + middle + " – " + docDate;
  }

  var n = 0;
  // d: { filename, type, channel, sender, receivedOn?, docDate, employeeId?, vendorId?, text,
  //      amountCents?, dueDate?, paidOn?, expiresOn?, renewedOn?, review?, confidence?, alternatives? }
  function doc(d) {
    n += 1;
    var isInvoice = d.type === "invoice";
    var isCred = d.type === "license" || d.type === "certification" || d.type === "training";
    var review = !!d.review;
    return {
      id: "doc-" + (n < 10 ? "00" : n < 100 ? "0" : "") + n,
      filename: d.filename,
      name: review ? d.filename : filedName(d.type, d.employeeId, d.vendorId, d.docDate),
      type: d.type,
      folder: review ? null : FOLDER[d.type],
      status: review ? "review" : "filed",
      confidence: d.confidence != null ? d.confidence : 0.96,
      alternatives: review ? d.alternatives : [],
      matchKey: matchKey(d.channel, d.sender, d.filename),
      channel: d.channel,
      sender: d.sender,
      receivedOn: d.receivedOn || d.docDate,
      docDate: d.docDate,
      employeeId: d.employeeId || null,
      vendorId: d.vendorId || null,
      text: d.text,
      invoice: isInvoice ? { amountCents: d.amountCents, dueDate: d.dueDate || null, paidOn: d.paidOn || null } : null,
      expiresOn: isCred ? d.expiresOn || null : null,
      renewedOn: isCred ? d.renewedOn || null : null
    };
  }

  var documents = [
    // ---- Invoices (10, across 7 vendors, 4 paid) ----
    doc({ filename: "HenrySchein_Invoice_2026-03-12.pdf", type: "invoice", channel: "email", sender: "ap@henryschein.com",
      docDate: "2026-03-12", vendorId: "ven-01", amountCents: 245610, dueDate: "2026-04-11", paidOn: "2026-04-02",
      text: "Henry Schein invoice for exam gloves, nitrile, size M (40 boxes) and sterilization pouches. Total $2,456.10, net 30." }),
    doc({ filename: "HenrySchein_Invoice_2026-06-18.pdf", type: "invoice", channel: "email", sender: "ap@henryschein.com",
      docDate: "2026-06-18", vendorId: "ven-01", amountCents: 98745, dueDate: "2026-07-18", paidOn: "2026-07-10",
      text: "Henry Schein invoice for syringes, alcohol prep pads and gauze. Total $987.45, net 30." }),
    doc({ filename: "HenrySchein_Invoice_2026-09-28.pdf", type: "invoice", channel: "email", sender: "ap@henryschein.com",
      docDate: "2026-09-28", vendorId: "ven-01", amountCents: 173220, dueDate: "2026-10-28",
      text: "Henry Schein invoice for face masks, exam table paper and disinfectant wipes. Total $1,732.20, due Oct 28." }),
    doc({ filename: "Medline_Invoice_0922.pdf", type: "invoice", channel: "email", sender: "billing@medline.com",
      docDate: "2026-09-22", vendorId: "ven-02", amountCents: 312480, dueDate: "2026-10-22",
      text: "Medline invoice for wound care supplies and patient gowns. Total $3,124.80, due Oct 22." }),
    doc({ filename: "Medline_Invoice_0805.pdf", type: "invoice", channel: "email", sender: "billing@medline.com",
      docDate: "2026-08-05", vendorId: "ven-02", amountCents: 154300, dueDate: "2026-09-04", paidOn: "2026-08-30",
      text: "Medline invoice for exam gloves and sharps containers. Total $1,543.00, net 30." }),
    doc({ filename: "brightline_inv_7731.pdf", type: "invoice", channel: "fax", sender: "+1 555 0163",
      docDate: "2026-09-10", vendorId: "ven-03", amountCents: 86500, dueDate: "2026-10-10",
      text: "Brightline Lab Services invoice for outside lab panels, August. Total $865.00, due Oct 10." }),
    doc({ filename: "Cascade_Invoice_Oct.pdf", type: "invoice", channel: "email", sender: "invoices@cascademw.com",
      docDate: "2026-10-01", vendorId: "ven-04", amountCents: 42000, dueDate: "2026-10-31",
      text: "Cascade Medical Waste invoice for monthly sharps and biohazard pickup, October. Total $420.00." }),
    doc({ filename: "summit_order_5521.pdf", type: "invoice", channel: "email", sender: "orders@summitoffice.com",
      docDate: "2026-07-15", vendorId: "ven-05", amountCents: 21899, dueDate: "2026-08-14", paidOn: "2026-08-10",
      text: "Summit Office Supply invoice for printer toner, copy paper and file folders. Total $218.99." }),
    doc({ filename: "northbay_statement_1005.pdf", type: "invoice", channel: "email", sender: "accounts@northbaylinen.com",
      docDate: "2026-10-05", vendorId: "ven-06", amountCents: 36750, dueDate: "2026-11-04",
      text: "Northbay Linen invoice for weekly lab coat and gown laundering, September. Total $367.50." }),
    doc({ filename: "ClearPath_Invoice_Oct.pdf", type: "invoice", channel: "email", sender: "billing@clearpathit.com",
      docDate: "2026-10-12", vendorId: "ven-07", amountCents: 129900,
      text: "ClearPath IT invoice for monthly managed IT support and backup. Total $1,299.00. No due date printed." }),

    // ---- Licenses folder: licenses, certifications, trainings (12) ----
    doc({ filename: "license_okafor_2024.pdf", type: "license", channel: "upload", sender: "upload",
      docDate: "2024-11-10", employeeId: "emp-07", expiresOn: "2026-11-10",
      text: "State board nurse practitioner license for Adaeze Okafor. Expires November 10, 2026." }),
    doc({ filename: "bls_cert_ramaswamy.pdf", type: "certification", channel: "upload", sender: "upload",
      docDate: "2024-12-05", employeeId: "emp-03", expiresOn: "2026-12-05",
      text: "Basic Life Support (BLS) certification for Priya Ramaswamy. Expires December 5, 2026." }),
    doc({ filename: "vance_medical_license.pdf", type: "license", channel: "upload", sender: "upload",
      docDate: "2025-06-30", employeeId: "emp-01", expiresOn: "2027-06-30",
      text: "State medical license for Marisol Vance, MD. Expires June 30, 2027." }),
    doc({ filename: "lindqvist_medical_license.pdf", type: "license", channel: "upload", sender: "upload",
      docDate: "2025-03-31", employeeId: "emp-02", expiresOn: "2027-03-31",
      text: "State medical license for Theo Lindqvist, MD. Expires March 31, 2027." }),
    doc({ filename: "cma_cert_moreau.pdf", type: "certification", channel: "upload", sender: "upload",
      docDate: "2021-10-01", employeeId: "emp-04", expiresOn: "2026-10-01",
      text: "Certified Medical Assistant (CMA) certification for Dashiell Moreau. Expired October 1, 2026." }),
    doc({ filename: "hipaa_training_abernathy.pdf", type: "training", channel: "upload", sender: "upload",
      docDate: "2026-08-15", employeeId: "emp-05", expiresOn: "2027-08-15",
      text: "Annual HIPAA privacy training certificate for Keiko Abernathy. Valid until August 15, 2027." }),
    doc({ filename: "arrt_cert_quintero_2024.pdf", type: "certification", channel: "upload", sender: "upload",
      docDate: "2024-09-15", employeeId: "emp-06", expiresOn: "2026-09-15", renewedOn: "2026-09-01",
      text: "Radiologic technologist (ARRT) certification for Rafael Quintero. Expires September 15, 2026." }),
    doc({ filename: "arrt_cert_quintero_2026.pdf", type: "certification", channel: "upload", sender: "upload",
      docDate: "2026-09-01", employeeId: "emp-06", expiresOn: "2028-09-15",
      text: "Renewed radiologic technologist (ARRT) certification for Rafael Quintero. Expires September 15, 2028." }),
    doc({ filename: "whitfield_pa_license.pdf", type: "license", channel: "upload", sender: "upload",
      docDate: "2024-12-31", employeeId: "emp-08", expiresOn: "2026-12-31",
      text: "Physician assistant license for Lorcan Whitfield. Expires December 31, 2026." }),
    doc({ filename: "acls_cert_halvorsen.pdf", type: "certification", channel: "upload", sender: "upload",
      docDate: "2025-02-28", employeeId: "emp-09", expiresOn: "2027-02-28",
      text: "Advanced Cardiac Life Support (ACLS) certification for Sunniva Halvorsen. Expires February 28, 2027." }),
    doc({ filename: "osha_training_oyelaran.pdf", type: "training", channel: "upload", sender: "upload",
      docDate: "2025-11-30", employeeId: "emp-10", expiresOn: "2026-11-30",
      text: "OSHA bloodborne pathogens training certificate for Bastian Oyelaran. Valid until November 30, 2026." }),
    doc({ filename: "castellano_medical_license.pdf", type: "license", channel: "upload", sender: "upload",
      docDate: "2026-01-31", employeeId: "emp-11", expiresOn: "2028-01-31",
      text: "State medical license for Imogen Castellano, MD. Expires January 31, 2028." }),

    // ---- HR (4) ----
    doc({ filename: "i9_ashby.pdf", type: "hr_form", channel: "upload", sender: "upload",
      docDate: "2026-02-02", employeeId: "emp-12",
      text: "Form I-9 employment eligibility verification for Wendell Ashby." }),
    doc({ filename: "w4_haddadin.pdf", type: "hr_form", channel: "upload", sender: "upload",
      docDate: "2025-08-11", employeeId: "emp-13",
      text: "Form W-4 tax withholding for Noor Haddadin." }),
    doc({ filename: "direct_deposit_delacroix.pdf", type: "hr_form", channel: "upload", sender: "upload",
      docDate: "2024-03-25", employeeId: "emp-14",
      text: "Direct deposit authorization form for Caspian Delacroix." }),
    doc({ filename: "emergency_contact_okafor.pdf", type: "hr_form", channel: "upload", sender: "upload",
      docDate: "2025-01-15", employeeId: "emp-07",
      text: "Emergency contact form for Adaeze Okafor." }),

    // ---- Vendors: contracts and other (4) ----
    doc({ filename: "Medline_Supply_Agreement_2026.pdf", type: "contract", channel: "email", sender: "contracts@medline.com",
      docDate: "2026-01-15", vendorId: "ven-02",
      text: "Medline supply agreement with tiered pricing on gloves and gowns. Term January 2026 to December 2027." }),
    doc({ filename: "clearpath_msa.pdf", type: "contract", channel: "email", sender: "billing@clearpathit.com",
      docDate: "2025-11-01", vendorId: "ven-07",
      text: "ClearPath IT managed services agreement. Monthly support, backups and HIPAA-compliant email." }),
    doc({ filename: "cascade_service_contract.pdf", type: "contract", channel: "fax", sender: "+1 555 0188",
      docDate: "2026-02-01", vendorId: "ven-04",
      text: "Cascade Medical Waste service contract for monthly biohazard and sharps pickup." }),
    doc({ filename: "summit_w9.pdf", type: "other", channel: "email", sender: "orders@summitoffice.com",
      docDate: "2026-05-20", vendorId: "ven-05",
      text: "Summit Office Supply W-9 taxpayer identification form." }),

    // ---- Compliance (3) ----
    doc({ filename: "osha_training_log_2026.pdf", type: "compliance", channel: "upload", sender: "upload",
      docDate: "2026-01-20", text: "OSHA bloodborne pathogens training sign-in log for all clinical staff, 2026." }),
    doc({ filename: "hipaa_risk_assessment_2025.pdf", type: "compliance", channel: "upload", sender: "upload",
      docDate: "2025-11-15", text: "HIPAA security risk assessment, 2025. Next update due October 2026." }),
    doc({ filename: "fire_inspection_report.pdf", type: "compliance", channel: "fax", sender: "+1 555 0119",
      docDate: "2026-09-28", text: "Fire marshal inspection report. Extinguishers inspected and tagged. Passed." }),

    // ---- Review queue (3) ----
    doc({ review: true, filename: "fax_0177.pdf", type: "hr_form", channel: "fax", sender: "+1 555 0177",
      receivedOn: "2026-10-19", docDate: "2026-10-16", employeeId: "emp-15", confidence: 0.62,
      text: "Faxed form, partly legible. Mentions Talia Brennan-Reyes and a signature line.",
      alternatives: [
        { type: "certification", folder: "Licenses", employeeId: "emp-15", vendorId: null },
        { type: "training", folder: "Licenses", employeeId: "emp-15", vendorId: null },
        { type: "hr_form", folder: "HR", employeeId: "emp-21", vendorId: null }
      ] }),
    doc({ review: true, filename: "statement_0915.pdf", type: "invoice", channel: "email", sender: "office@northbaylinen.com",
      receivedOn: "2026-10-20", docDate: "2026-09-15", vendorId: "ven-06", confidence: 0.71,
      amountCents: 36750, dueDate: "2026-10-15",
      text: "Northbay Linen statement for August service. Balance $367.50.",
      alternatives: [
        { type: "contract", folder: "Vendors", employeeId: null, vendorId: "ven-06" },
        { type: "other", folder: "Vendors", employeeId: null, vendorId: "ven-06" }
      ] }),
    doc({ review: true, filename: "cpr_card_scan.pdf", type: "certification", channel: "upload", sender: "upload",
      receivedOn: "2026-10-21", docDate: "2026-10-14", employeeId: "emp-17", confidence: 0.55, expiresOn: "2028-10-14",
      text: "Photo of a CPR card. Name partly cut off: \"Esperanza L...\". Valid two years.",
      alternatives: [
        { type: "training", folder: "Licenses", employeeId: "emp-17", vendorId: null },
        { type: "certification", folder: "Licenses", employeeId: "emp-31", vendorId: null },
        { type: "hr_form", folder: "HR", employeeId: "emp-17", vendorId: null }
      ] })
  ];

  // Filed-name sanity: the Henry Schein March invoice is the first document.
  // documents[0].name === "Invoice – Henry Schein – 2026-03-12"

  window.MOCK = {
    today: TODAY,
    practice: {
      name: "Riverbend Eye Specialists",
      specialty: "Ophthalmology",
      staffCount: 40,
      forwardEmail: "riverbend-eye@in.sortable.example",
      faxNumber: "+1 555 0100"
    },

    employees: employees,
    vendors: vendors,
    documents: documents,

    compliance: [
      { id: "cmp-01", title: "Annual OSHA bloodborne pathogens training", category: "OSHA", dueOn: "2026-11-15", resolvedOn: null, documentId: "doc-031" },
      { id: "cmp-02", title: "HIPAA security risk assessment update", category: "HIPAA", dueOn: "2026-10-15", resolvedOn: null, documentId: "doc-032" },
      { id: "cmp-03", title: "Fire extinguisher inspection", category: "Inspection", dueOn: "2026-09-30", resolvedOn: "2026-09-28", documentId: "doc-033" },
      { id: "cmp-04", title: "State facility license renewal", category: "Renewal", dueOn: "2027-01-31", resolvedOn: null, documentId: null },
      { id: "cmp-05", title: "Autoclave spore test and service", category: "Inspection", dueOn: "2026-12-15", resolvedOn: null, documentId: null },
      { id: "cmp-06", title: "DEA registration renewal", category: "Renewal", dueOn: "2026-12-20", resolvedOn: null, documentId: null }
    ],

    incoming: [
      { id: "in-01", channel: "email", sender: "ap@henryschein.com", filename: "HenrySchein_Invoice_Oct.pdf",
        text: "Henry Schein invoice for exam gloves, sterilization pouches and cotton rolls. Total $1,864.25, due Nov 19.",
        fields: { docDate: "2026-10-20", amountCents: 186425, dueDate: "2026-11-19", expiresOn: null } },
      { id: "in-02", channel: "fax", sender: "+1 555 0142", filename: "fax_0142.pdf",
        text: "Unreadable fax. The page is mostly dark streaks and no words can be made out.",
        fields: { docDate: null, amountCents: null, dueDate: null, expiresOn: null } },
      { id: "in-03", channel: "email", sender: "billing@medline.com", filename: "Medline_statement_Oct.pdf",
        text: "Medline statement for October. Exam gloves and patient gowns. Amount due $2,210.40 by Nov 18.",
        fields: { docDate: "2026-10-19", amountCents: 221040, dueDate: "2026-11-18", expiresOn: null } },
      { id: "in-04", channel: "email", sender: "billing@medline.com", filename: "Medline_statement_Nov.pdf",
        text: "Medline statement for November. Wound care supplies. Amount due $1,478.90 by Dec 20.",
        fields: { docDate: "2026-10-21", amountCents: 147890, dueDate: "2026-12-20", expiresOn: null } }
    ],

    filingRules: [
      { id: "rule-01", match: "henryschein.com", confidence: 0.96,
        result: { type: "invoice", folder: "Invoices", employeeId: null, vendorId: "ven-01" },
        alternatives: [
          { type: "contract", folder: "Vendors", employeeId: null, vendorId: "ven-01" }
        ],
        fields: { amountCents: null, dueInDays: 30, expiresInDays: null } },
      { id: "rule-02", match: "medline.com", confidence: 0.70,
        result: { type: "contract", folder: "Vendors", employeeId: null, vendorId: "ven-02" },
        alternatives: [
          { type: "invoice", folder: "Invoices", employeeId: null, vendorId: "ven-02" },
          { type: "other", folder: "Vendors", employeeId: null, vendorId: "ven-02" }
        ],
        fields: { amountCents: null, dueInDays: 30, expiresInDays: null } },
      { id: "rule-03", match: "license_renewal_okafor", confidence: 0.92,
        result: { type: "license", folder: "Licenses", employeeId: "emp-07", vendorId: null },
        alternatives: [
          { type: "certification", folder: "Licenses", employeeId: "emp-07", vendorId: null }
        ],
        fields: { amountCents: null, dueInDays: null, expiresInDays: 730 } },
      { id: "rule-04", match: "cascademw.com", confidence: 0.94,
        result: { type: "invoice", folder: "Invoices", employeeId: null, vendorId: "ven-04" },
        alternatives: [
          { type: "contract", folder: "Vendors", employeeId: null, vendorId: "ven-04" }
        ],
        fields: { amountCents: null, dueInDays: 30, expiresInDays: null } },
      { id: "rule-05", match: "summitoffice.com", confidence: 0.93,
        result: { type: "invoice", folder: "Invoices", employeeId: null, vendorId: "ven-05" },
        alternatives: [
          { type: "other", folder: "Vendors", employeeId: null, vendorId: "ven-05" }
        ],
        fields: { amountCents: null, dueInDays: 30, expiresInDays: null } },
      { id: "rule-06", match: "clearpathit.com", confidence: 0.90,
        result: { type: "invoice", folder: "Invoices", employeeId: null, vendorId: "ven-07" },
        alternatives: [
          { type: "contract", folder: "Vendors", employeeId: null, vendorId: "ven-07" }
        ],
        fields: { amountCents: null, dueInDays: null, expiresInDays: null } }
    ]
  };
})();
