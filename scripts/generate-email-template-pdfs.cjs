const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs", "email-templates");
const pdfDir = path.join(outDir, "pdfs");
const htmlDir = path.join(outDir, "html");
const logoPath = path.join(root, "src", "assets", "vision360-wordmark.png");

const brand = {
  primary: "#4A6FA5",
  primaryDark: "#3d5a85",
  primaryLight: "#EBF0F8",
  primaryBorder: "#C8D5E8",
  accent: "#F97316",
  text: "#1A2332",
  muted: "#546478",
  soft: "#F5F7FA",
  border: "#E5E7EB",
  success: "#16A34A",
  danger: "#DC2626",
};

const logoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

const tenant = {
  company: "Omega Home Services",
  logoText: "OHS",
  customer: "Mike Delgado",
  staff: "Peter Novak",
  admin: "Alevtyna Ramos",
  owner: "Marek Stroz",
  phone: "(813) 286-7572",
  email: "office@omegahomeservices.com",
  address: "4405 North Clark Avenue, Tampa, FL 33614",
};

const system = {
  product: "Vision360",
  supportEmail: "support@vision360.app",
  billingEmail: "billing@vision360.app",
};

const money = (value) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const templates = [
  {
    id: "01",
    group: "Customer-facing",
    title: "Estimate sent",
    subject: "Estimate EST-1048 is ready for review",
    preheader: "Review and sign your AC replacement estimate from Omega Home Services.",
    trigger: "Staff clicks Send on an estimate",
    to: "Customer email",
    audience: "tenant",
    headline: "Your estimate is ready",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "Thanks for choosing Omega Home Services. We prepared your estimate and it is ready for review.",
      "You can review the details, ask questions, and sign online. No Vision360 account is required.",
    ],
    facts: [
      ["Estimate", "EST-1048"],
      ["Date", "Jun 4, 2026"],
      ["Total", money(4280)],
      ["Job", "AC replacement estimate"],
    ],
    cta: "Review and sign",
    url: "https://pay.vision360.app/e/est_1048",
    attachment: "EST-1048.pdf",
    note: "PDF attachment is optional when enabled by staff.",
  },
  {
    id: "02",
    group: "Customer-facing",
    title: "Estimate updated",
    subject: "Your updated estimate is ready",
    preheader: "We made the requested changes to estimate EST-1048.",
    trigger: "Staff updates an estimate after requested changes",
    to: "Customer email",
    audience: "tenant",
    headline: "Your updated estimate is ready",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "We updated your estimate based on the changes you requested.",
      "Please review the latest version and sign when everything looks right.",
    ],
    facts: [
      ["Estimate", "EST-1048"],
      ["Updated", "Jun 4, 2026"],
      ["Total", money(3975)],
      ["Change", "Revised equipment option"],
    ],
    cta: "Review updated estimate",
    url: "https://pay.vision360.app/e/est_1048",
    attachment: "EST-1048-updated.pdf",
  },
  {
    id: "03",
    group: "Customer-facing",
    title: "Estimate expiration reminder",
    subject: "Reminder: your estimate expires soon",
    preheader: "Estimate EST-1048 expires on Jun 9, 2026.",
    trigger: "2-3 days before estimate expiration",
    to: "Customer email",
    audience: "tenant",
    status: "Optional for MVP",
    headline: "Your estimate expires soon",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "Just a friendly reminder that your estimate is still available for review.",
      "If you would like to move forward, you can review and sign it online before the expiration date.",
    ],
    facts: [
      ["Estimate", "EST-1048"],
      ["Expires", "Jun 9, 2026"],
      ["Total", money(4280)],
      ["Job", "AC replacement estimate"],
    ],
    cta: "Review estimate",
    url: "https://pay.vision360.app/e/est_1048",
  },
  {
    id: "04",
    group: "Customer-facing",
    title: "Invoice sent",
    subject: "Invoice INV-2091 from Omega Home Services",
    preheader: "View and pay your invoice online.",
    trigger: "Staff issues an invoice",
    to: "Customer email",
    audience: "tenant",
    headline: "Your invoice is ready",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "Your invoice has been issued and is ready for payment.",
      "Use the secure link below to view the full invoice and choose a payment option.",
    ],
    facts: [
      ["Invoice", "INV-2091"],
      ["Date", "Jun 4, 2026"],
      ["Due date", "Jun 18, 2026"],
      ["Amount due", money(1285)],
    ],
    cta: "View and pay",
    url: "https://pay.vision360.app/i/inv_2091",
    attachment: "INV-2091.pdf",
  },
  {
    id: "05",
    group: "Customer-facing",
    title: "Invoice payment reminder",
    subject: "Payment reminder for invoice INV-2091",
    preheader: "Your invoice is past due. Pay securely online.",
    trigger: "Invoice unpaid after due date",
    to: "Customer email",
    audience: "tenant",
    status: "Deferred to Pro / later",
    headline: "Payment reminder",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "This is a polite reminder that invoice INV-2091 is past due.",
      "If payment has already been sent, thank you and please disregard this message.",
    ],
    facts: [
      ["Invoice", "INV-2091"],
      ["Due date", "Jun 18, 2026"],
      ["Amount due", money(1285)],
      ["Status", "Overdue"],
    ],
    cta: "Pay invoice",
    url: "https://pay.vision360.app/i/inv_2091",
  },
  {
    id: "06",
    group: "Customer-facing",
    title: "Payment receipt",
    subject: "Payment received for invoice INV-2091",
    preheader: "Thank you. Your payment has been confirmed.",
    trigger: "Customer pays an invoice",
    to: "Customer email",
    audience: "tenant",
    headline: "Payment received",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "Thank you for your payment. We have applied it to your invoice.",
      "A receipt summary is included below for your records.",
    ],
    facts: [
      ["Invoice", "INV-2091"],
      ["Paid", money(1285)],
      ["Method", "Visa ending in 4242"],
      ["Confirmation", "PAY-88421"],
    ],
    cta: "View receipt",
    url: "https://pay.vision360.app/r/pay_88421",
  },
  {
    id: "07",
    group: "Customer-facing",
    title: "Job scheduled confirmation",
    subject: "Your service visit is scheduled",
    preheader: "Omega Home Services will visit on Jun 12, 2026.",
    trigger: "Job created for customer",
    to: "Customer email",
    audience: "tenant",
    status: "MVP or Pro - TBD",
    headline: "Your visit is scheduled",
    greeting: `Hi ${tenant.customer},`,
    body: [
      "Your service visit has been scheduled. Please review the appointment details below.",
      "If you need to make a change, contact our office before the scheduled time.",
    ],
    facts: [
      ["Date", "Jun 12, 2026"],
      ["Arrival window", "9:00 AM - 11:00 AM"],
      ["Technician", tenant.staff],
      ["Service", "AC maintenance visit"],
    ],
    cta: "View appointment",
    url: "https://pay.vision360.app/j/job_10245",
  },
  {
    id: "08",
    group: "Auth / Account",
    title: "Email verification",
    subject: "Verify your Vision360 email",
    preheader: "Use this code to finish creating your Vision360 account.",
    trigger: "New user signs up",
    to: "New system user",
    audience: "vision360",
    headline: "Verify your email",
    greeting: `Hi ${tenant.admin},`,
    body: [
      "Use the verification code below to finish setting up your Vision360 account.",
      "This code expires soon. If you did not request this, you can ignore this email.",
    ],
    code: "438 921",
    facts: [
      ["Workspace", tenant.company],
      ["Expires", "15 minutes"],
      ["Security", "Do not share this code"],
    ],
    cta: "Verify email",
    url: "https://app.vision360.app/verify",
    note: "Auth0 default can use a verification link. OTP requires custom implementation.",
  },
  {
    id: "09",
    group: "Auth / Account",
    title: "Password reset",
    subject: "Reset your Vision360 password",
    preheader: "This secure password reset link expires in 60 minutes.",
    trigger: "User clicks Forgot password",
    to: "System user",
    audience: "vision360",
    headline: "Reset your password",
    greeting: `Hi ${tenant.admin},`,
    body: [
      "We received a request to reset your Vision360 password.",
      "Use the secure link below to choose a new password. If you did not request this, no action is needed.",
    ],
    facts: [
      ["Account", "alevtyna@omegahomeservices.com"],
      ["Expires", "60 minutes"],
      ["Requested", "Jun 4, 2026, 10:42 AM"],
    ],
    cta: "Reset password",
    url: "https://app.vision360.app/reset-password",
  },
  {
    id: "10",
    group: "Auth / Account",
    title: "Welcome email",
    subject: "Welcome to Vision360",
    preheader: "Start setting up your team, jobs, estimates, and invoices.",
    trigger: "New account activated",
    to: "New system user",
    audience: "vision360",
    status: "Nice-to-have for MVP",
    headline: "Welcome to Vision360",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "Your Vision360 workspace is active. You can now set up your company profile, invite your team, and start managing work.",
      "Here are the first steps we recommend.",
    ],
    bullets: ["Add company branding", "Invite team members", "Create your first client", "Send your first estimate"],
    cta: "Open workspace",
    url: "https://app.vision360.app/",
  },
  {
    id: "11",
    group: "Auth / Account",
    title: "Team member invitation",
    subject: `${tenant.admin} invited you to join ${tenant.company} on Vision360`,
    preheader: "Accept your invitation and create your Vision360 login.",
    trigger: "Admin invites employee to join workspace",
    to: "Invited email",
    audience: "vision360",
    headline: "You have been invited",
    greeting: "Hi Peter,",
    body: [
      `${tenant.admin} invited you to join ${tenant.company} on Vision360.`,
      "Accept the invitation to create your account and access your assigned workspace.",
    ],
    facts: [
      ["Company", tenant.company],
      ["Assigned role", "Technician"],
      ["Invited by", tenant.admin],
      ["Expires", "7 days"],
    ],
    cta: "Accept invitation",
    url: "https://app.vision360.app/invite/accept",
  },
  {
    id: "12",
    group: "Subscription / Billing",
    title: "Trial started",
    subject: "Your Vision360 trial has started",
    preheader: "You have 14 days to explore Vision360 with your team.",
    trigger: "New signup with free trial",
    to: "Account owner",
    audience: "vision360",
    headline: "Your trial has started",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "Your free Vision360 trial is active. During the trial, you can configure your workspace and test core workflows.",
      "We recommend starting with company settings, users, clients, jobs, estimates, and invoices.",
    ],
    facts: [
      ["Workspace", tenant.company],
      ["Trial length", "14 days"],
      ["Trial ends", "Jun 18, 2026"],
      ["Plan", "Pro Trial"],
    ],
    cta: "Set up workspace",
    url: "https://app.vision360.app/settings",
  },
  {
    id: "13",
    group: "Subscription / Billing",
    title: "Trial ending soon",
    subject: "Your Vision360 trial ends soon",
    preheader: "Upgrade now to keep your workspace active.",
    trigger: "3-7 days before trial expires",
    to: "Account owner",
    audience: "vision360",
    status: "Nice-to-have for MVP",
    headline: "Your trial ends soon",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "Your Vision360 trial is almost over. Upgrade before the trial end date to keep your workspace active without interruption.",
      "Your existing clients, jobs, estimates, invoices, and settings will stay in place.",
    ],
    facts: [
      ["Trial ends", "Jun 18, 2026"],
      ["Workspace", tenant.company],
      ["Recommended plan", "Pro"],
    ],
    cta: "Upgrade now",
    url: "https://app.vision360.app/billing/upgrade",
  },
  {
    id: "14",
    group: "Subscription / Billing",
    title: "Subscription invoice",
    subject: "Your Vision360 subscription receipt",
    preheader: "Receipt for your monthly Vision360 subscription.",
    trigger: "Stripe charge succeeded",
    to: "Account owner / billing email",
    audience: "vision360",
    status: "Nice-to-have for MVP",
    headline: "Subscription payment received",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "Your monthly Vision360 subscription payment has been processed successfully.",
      "A summary is included below. You can also download the full invoice from billing settings.",
    ],
    facts: [
      ["Invoice", "SUB-2026-0604"],
      ["Plan", "Pro"],
      ["Billing period", "Jun 4 - Jul 4, 2026"],
      ["Amount paid", money(149)],
    ],
    cta: "View billing",
    url: "https://app.vision360.app/billing",
  },
  {
    id: "15",
    group: "Subscription / Billing",
    title: "Payment method failed",
    subject: "Action required: payment method failed",
    preheader: "Update your payment method to keep Vision360 active.",
    trigger: "Stripe charge failed",
    to: "Account owner",
    audience: "vision360",
    status: "Nice-to-have for MVP",
    headline: "Payment method failed",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "We could not process the payment for your Vision360 subscription.",
      "Please update your payment method to avoid interruption to your workspace.",
    ],
    facts: [
      ["Workspace", tenant.company],
      ["Amount", money(149)],
      ["Attempted", "Jun 4, 2026"],
      ["Status", "Payment failed"],
    ],
    cta: "Update payment method",
    url: "https://app.vision360.app/billing/payment-method",
    tone: "warning",
  },
  {
    id: "16",
    group: "Subscription / Billing",
    title: "Subscription cancelled",
    subject: "Your Vision360 subscription has been cancelled",
    preheader: "Your workspace access remains active until the end of the billing period.",
    trigger: "Account owner cancels subscription",
    to: "Account owner",
    audience: "vision360",
    headline: "Subscription cancelled",
    greeting: `Hi ${tenant.owner},`,
    body: [
      "Your Vision360 subscription has been cancelled as requested.",
      "You can continue using your workspace until the access end date below. We would be happy to help if you want to reactivate later.",
    ],
    facts: [
      ["Workspace", tenant.company],
      ["Cancelled", "Jun 4, 2026"],
      ["Access ends", "Jul 4, 2026"],
      ["Plan", "Pro"],
    ],
    cta: "Reactivate subscription",
    url: "https://app.vision360.app/billing/reactivate",
  },
  {
    id: "17",
    group: "System / Signing",
    title: "Document signed",
    subject: "Estimate EST-1048 has been signed",
    preheader: "Signed document confirmation and PDF copy.",
    trigger: "Customer signs an estimate",
    to: "Assigned staff member + signing customer",
    audience: "tenant",
    headline: "Document signed",
    greeting: `Hi ${tenant.staff},`,
    body: [
      `${tenant.customer} signed estimate EST-1048.`,
      "A signed PDF copy is attached for records. The estimate status has been updated in Vision360.",
    ],
    facts: [
      ["Estimate", "EST-1048"],
      ["Signed by", tenant.customer],
      ["Signed on", "Jun 4, 2026"],
      ["Total", money(4280)],
    ],
    cta: "View signed estimate",
    url: "https://app.vision360.app/estimates/1048",
    attachment: "EST-1048-signed.pdf",
  },
  {
    id: "D1",
    group: "Internal team notifications",
    title: "Estimate viewed by customer",
    subject: "Customer viewed estimate EST-1048",
    preheader: "Follow up while the estimate is fresh.",
    trigger: "Customer opens public estimate link",
    to: "Assigned staff / sales owner",
    audience: "vision360",
    status: "Deferred to Pro",
    headline: "Estimate viewed",
    greeting: `Hi ${tenant.staff},`,
    body: [`${tenant.customer} viewed estimate EST-1048.`, "This can be used as a sales follow-up signal in Pro notifications."],
    facts: [["Estimate", "EST-1048"], ["Customer", tenant.customer], ["Viewed", "Jun 4, 2026, 10:15 AM"]],
    cta: "Open estimate",
    url: "https://app.vision360.app/estimates/1048",
  },
  {
    id: "D2",
    group: "Internal team notifications",
    title: "Estimate approved",
    subject: "Estimate EST-1048 was approved",
    preheader: "Customer approval is complete.",
    trigger: "Customer approves estimate",
    to: "Assigned staff / sales owner",
    audience: "vision360",
    status: "Deferred to Pro",
    headline: "Estimate approved",
    greeting: `Hi ${tenant.staff},`,
    body: [`${tenant.customer} approved estimate EST-1048.`, "Create or schedule the job when you are ready."],
    facts: [["Estimate", "EST-1048"], ["Customer", tenant.customer], ["Total", money(4280)]],
    cta: "Open estimate",
    url: "https://app.vision360.app/estimates/1048",
  },
  {
    id: "D3",
    group: "Internal team notifications",
    title: "Payment received",
    subject: "Payment received for INV-2091",
    preheader: "The invoice balance has been updated.",
    trigger: "Customer pays invoice",
    to: "Assigned staff / office team",
    audience: "vision360",
    status: "Deferred to Pro",
    headline: "Payment received",
    greeting: "Hi team,",
    body: [`${tenant.customer} paid invoice INV-2091.`, "The payment has been recorded and the invoice status is updated."],
    facts: [["Invoice", "INV-2091"], ["Amount", money(1285)], ["Method", "Visa ending in 4242"]],
    cta: "Open invoice",
    url: "https://app.vision360.app/invoices/2091",
  },
  {
    id: "D4",
    group: "Internal team notifications",
    title: "Job assigned to you",
    subject: "New job assigned: AC maintenance visit",
    preheader: "You have a new job on your schedule.",
    trigger: "Job assigned to staff member",
    to: "Assigned technician",
    audience: "vision360",
    status: "Deferred to Pro",
    headline: "Job assigned to you",
    greeting: `Hi ${tenant.staff},`,
    body: ["A job has been assigned to you in Vision360.", "Review the job details before the scheduled visit."],
    facts: [["Job", "JOB-10245"], ["Client", tenant.customer], ["Time", "Jun 12, 2026, 9:00 AM - 11:00 AM"], ["Address", tenant.address]],
    cta: "Open job",
    url: "https://app.vision360.app/jobs/10245",
  },
  {
    id: "D5",
    group: "Internal team notifications",
    title: "Job status changed",
    subject: "Job JOB-10245 status changed",
    preheader: "The job moved to In Progress.",
    trigger: "Job status changes",
    to: "Office team / assigned staff",
    audience: "vision360",
    status: "Deferred to Pro",
    headline: "Job status changed",
    greeting: "Hi team,",
    body: [`${tenant.staff} changed job JOB-10245 to In Progress.`, "The schedule and job record have been updated."],
    facts: [["Job", "JOB-10245"], ["Client", tenant.customer], ["New status", "In Progress"], ["Updated", "Jun 12, 2026, 9:08 AM"]],
    cta: "Open job",
    url: "https://app.vision360.app/jobs/10245",
  },
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function slug(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function specRows(template) {
  return [
    ["Type", template.group],
    ["Trigger", template.trigger],
    ["To", template.to],
    ["Subject", template.subject],
    ["Preheader", template.preheader],
    ...(template.status ? [["Scope", template.status]] : []),
  ].map(([label, value]) => `<div class="spec-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
}

function factRows(template) {
  return (template.facts || []).map(([label, value]) => `
    <div class="fact-row">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>
  `).join("");
}

function renderTenantLogo() {
  return `
    <div class="tenant-logo">
      <span>${esc(tenant.logoText)}</span>
    </div>
    <div>
      <div class="tenant-name">${esc(tenant.company)}</div>
      <div class="tenant-powered">Powered by Vision360</div>
    </div>
  `;
}

function renderVisionLogo() {
  return `
    <img class="vision-logo" src="${logoData}" alt="Vision360" />
  `;
}

function renderHtml(template) {
  const ctaColor = template.tone === "warning" ? brand.accent : brand.primary;
  const headerLogo = template.audience === "tenant" ? renderTenantLogo() : renderVisionLogo();
  const footerContact = template.audience === "tenant"
    ? `${tenant.company} · ${tenant.phone} · ${tenant.email} · ${tenant.address}`
    : `${system.product} · ${system.supportEmail} · ${system.billingEmail}`;
  const bullets = template.bullets ? `
    <ul class="bullet-list">
      ${template.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}
    </ul>
  ` : "";
  const codeBlock = template.code ? `<div class="code-block">${esc(template.code)}</div>` : "";
  const attachment = template.attachment ? `<div class="attachment"><span>Attachment</span><strong>${esc(template.attachment)}</strong></div>` : "";
  const note = template.note ? `<div class="note">${esc(template.note)}</div>` : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(template.id)} - ${esc(template.title)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ffffff;
      color: ${brand.text};
      font-family: Inter, Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.5;
    }
    .page {
      min-height: 100vh;
      background:
        linear-gradient(180deg, ${brand.primaryLight} 0, rgba(235,240,248,0) 230px),
        #fff;
      padding: 0;
    }
    .top-rule {
      height: 6px;
      background: linear-gradient(90deg, ${brand.primary}, ${brand.primaryDark} 74%, ${brand.accent});
      border-radius: 0 0 8px 8px;
      margin-bottom: 10px;
    }
    .doc-header {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .doc-title h1 {
      margin: 0 0 3px;
      font-size: 18px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .doc-title p {
      margin: 0;
      color: ${brand.muted};
      font-size: 12px;
    }
    .status-pill {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 7px;
      border-radius: 999px;
      background: #fff;
      border: 1px solid ${brand.primaryBorder};
      color: ${brand.primaryDark};
      font-size: 11px;
      font-weight: 700;
    }
    .spec {
      width: 100%;
      background: #fff;
      border: 1px solid ${brand.border};
      border-radius: 8px;
      padding: 8px 10px;
    }
    .spec h2 {
      margin: 0 0 5px;
      font-size: 10px;
      text-transform: uppercase;
      color: ${brand.primary};
      letter-spacing: 0;
    }
    .spec dl {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px 14px;
      margin: 0;
    }
    .spec-row {
      display: block;
      border-top: 0;
      padding-top: 0;
      margin-top: 0;
    }
    .spec-row:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
    .spec-row dt {
      margin: 0;
      color: #8899AA;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .spec-row dd {
      margin: 0;
      color: ${brand.text};
      font-size: 10px;
      font-weight: 600;
    }
    .email-shell {
      width: 640px;
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid ${brand.border};
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
      box-shadow: 0 18px 42px rgba(26,35,50,0.10);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .email-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      padding: 16px 22px;
      border-bottom: 1px solid ${brand.border};
      background: #fff;
    }
    .email-header.vision-header {
      background: linear-gradient(135deg, ${brand.text}, #243A56);
      border-bottom: 0;
    }
    .email-header.vision-header .email-meta {
      color: ${brand.primaryBorder};
    }
    .tenant-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .tenant-logo {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: ${brand.primary};
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
    }
    .tenant-name {
      font-size: 16px;
      font-weight: 800;
      color: ${brand.text};
    }
    .tenant-powered, .email-meta {
      font-size: 11px;
      color: #8899AA;
      font-weight: 600;
    }
    .vision-logo {
      width: 148px;
      height: auto;
      display: block;
    }
    .email-meta {
      text-align: right;
      white-space: nowrap;
    }
    .email-body {
      padding: 22px 28px 18px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .eyebrow {
      color: ${brand.primary};
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .email-body h2 {
      margin: 0 0 10px;
      font-size: 24px;
      line-height: 1.18;
      letter-spacing: 0;
      color: ${brand.text};
    }
    .email-body p {
      margin: 0 0 9px;
      color: #374151;
      font-size: 13px;
    }
    .facts {
      margin: 15px 0;
      border: 1px solid ${brand.border};
      border-radius: 8px;
      overflow: hidden;
      background: ${brand.soft};
    }
    .fact-row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 8px 12px;
      border-top: 1px solid ${brand.border};
      background: #fff;
    }
    .fact-row:first-child { border-top: 0; }
    .fact-row span {
      color: #8899AA;
      font-weight: 700;
      font-size: 12px;
    }
    .fact-row strong {
      color: ${brand.text};
      font-size: 13px;
      text-align: right;
    }
    .cta {
      display: inline-block;
      background: ${ctaColor};
      color: #fff;
      text-decoration: none;
      border-radius: 7px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 800;
      margin: 1px 0 8px;
    }
    .url {
      color: #6B7280;
      font-size: 11px;
      word-break: break-all;
      margin-bottom: 10px;
    }
    .code-block {
      display: inline-block;
      margin: 5px 0 14px;
      padding: 12px 16px;
      background: ${brand.primaryLight};
      border: 1px solid ${brand.primaryBorder};
      border-radius: 8px;
      color: ${brand.text};
      font-size: 29px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0;
    }
    .bullet-list {
      margin: 12px 0 16px;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .bullet-list li {
      padding: 8px 10px 8px 28px;
      border: 1px solid ${brand.border};
      border-radius: 8px;
      background: #fff;
      position: relative;
      color: ${brand.text};
      font-weight: 700;
      font-size: 12px;
    }
    .bullet-list li:before {
      content: "";
      position: absolute;
      left: 12px;
      top: 14px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${brand.success};
    }
    .attachment {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 7px 9px;
      border: 1px solid ${brand.border};
      border-radius: 8px;
      background: #fff;
      margin-top: 4px;
    }
    .attachment span {
      color: #8899AA;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .attachment strong {
      color: ${brand.text};
      font-size: 12px;
    }
    .note {
      margin-top: 10px;
      padding: 8px 10px;
      border-left: 3px solid ${brand.primary};
      background: ${brand.primaryLight};
      color: ${brand.muted};
      font-size: 12px;
      border-radius: 0 6px 6px 0;
    }
    .email-footer {
      padding: 12px 22px;
      border-top: 1px solid ${brand.border};
      background: ${brand.soft};
      color: #6B7280;
      font-size: 11px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .footer-links {
      margin-top: 5px;
      color: ${brand.primary};
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="top-rule"></div>
    <section class="doc-header">
      <div class="doc-title">
        <h1>${esc(template.id)}. ${esc(template.title)}</h1>
        <p>${esc(template.group)} email template preview</p>
        ${template.status ? `<span class="status-pill">${esc(template.status)}</span>` : ""}
      </div>
      <aside class="spec">
        <h2>Specification</h2>
        <dl>${specRows(template)}</dl>
      </aside>
    </section>
    <section class="email-shell">
      <header class="email-header ${template.audience === "vision360" ? "vision-header" : ""}">
        <div class="tenant-brand">${headerLogo}</div>
        <div class="email-meta">${esc(template.group)}<br />${esc(template.id)}</div>
      </header>
      <div class="email-body">
        <div class="eyebrow">${esc(template.title)}</div>
        <h2>${esc(template.headline)}</h2>
        <p><strong>${esc(template.greeting)}</strong></p>
        ${(template.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${codeBlock}
        ${bullets}
        ${template.facts ? `<div class="facts">${factRows(template)}</div>` : ""}
        ${template.cta ? `<a class="cta" href="${esc(template.url)}">${esc(template.cta)}</a><div class="url">${esc(template.url)}</div>` : ""}
        ${attachment}
        ${note}
      </div>
      <footer class="email-footer">
        ${esc(footerContact)}
        <div class="footer-links">Manage preferences · Privacy · Terms</div>
      </footer>
    </section>
  </main>
</body>
</html>`;
}

async function renderPdf(browser, template) {
  const name = `${template.id}-${slug(template.title)}`;
  const htmlPath = path.join(htmlDir, `${name}.html`);
  const pdfPath = path.join(pdfDir, `${name}.pdf`);
  const html = renderHtml(template);
  fs.writeFileSync(htmlPath, html);

  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });
  await page.close();
  return { name, pdfPath };
}

function renderIndex(results) {
  const rows = templates.map((template, index) => {
    const file = results[index].name;
    return `<tr><td>${esc(template.id)}</td><td>${esc(template.group)}</td><td>${esc(template.title)}</td><td>${template.status ? esc(template.status) : "MVP / transactional"}</td><td>${esc(file)}.pdf</td></tr>`;
  }).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Vision360 Email Template Pack</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Inter, Arial, sans-serif; color: ${brand.text}; margin: 0; font-size: 11px; }
    .bar { height: 6px; background: linear-gradient(90deg, ${brand.primary}, ${brand.primaryDark}, ${brand.accent}); border-radius: 0 0 8px 8px; margin-bottom: 12px; }
    img { width: 150px; height: auto; display: block; margin-bottom: 12px; }
    h1 { font-size: 24px; margin: 0 0 6px; letter-spacing: 0; }
    p { color: ${brand.muted}; margin: 0 0 12px; line-height: 1.4; }
    .palette { display: flex; gap: 8px; margin: 10px 0 14px; }
    .swatch { width: 100px; border: 1px solid ${brand.border}; border-radius: 7px; overflow: hidden; background: #fff; }
    .swatch div { height: 24px; }
    .swatch span { display: block; padding: 5px 6px; font-size: 8px; color: ${brand.muted}; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; border: 1px solid ${brand.border}; border-radius: 8px; overflow: hidden; }
    th { text-align: left; background: ${brand.primaryLight}; color: ${brand.primaryDark}; font-size: 8px; text-transform: uppercase; padding: 5px 6px; }
    td { border-top: 1px solid ${brand.border}; padding: 4px 6px; vertical-align: top; font-size: 9px; line-height: 1.25; }
  </style>
</head>
<body>
  <div class="bar"></div>
  <img src="${logoData}" alt="Vision360" />
  <h1>Vision360 Email Template Pack</h1>
  <p>Branded PDF previews for customer-facing, auth/account, subscription/billing, signing, and Pro-tier internal notification emails. Customer-facing messages use tenant-style branding with Vision360-powered footer treatment; platform/account messages use Vision360 branding.</p>
  <div class="palette">
    <div class="swatch"><div style="background:${brand.primary}"></div><span>${brand.primary}<br />Primary</span></div>
    <div class="swatch"><div style="background:${brand.primaryLight}"></div><span>${brand.primaryLight}<br />Primary light</span></div>
    <div class="swatch"><div style="background:${brand.text}"></div><span>${brand.text}<br />Text</span></div>
    <div class="swatch"><div style="background:${brand.accent}"></div><span>${brand.accent}<br />Accent</span></div>
  </div>
  <table>
    <thead><tr><th>ID</th><th>Group</th><th>Email</th><th>Scope</th><th>PDF</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function mergePdfs(results, indexPdfPath) {
  const merged = await PDFDocument.create();
  for (const pdfPath of [indexPdfPath, ...results.map((result) => result.pdfPath)]) {
    const pdf = await PDFDocument.load(fs.readFileSync(pdfPath));
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  const bytes = await merged.save();
  fs.writeFileSync(path.join(outDir, "Vision360-email-template-pack.pdf"), bytes);
}

async function main() {
  fs.mkdirSync(pdfDir, { recursive: true });
  fs.mkdirSync(htmlDir, { recursive: true });

  for (const dir of [pdfDir, htmlDir]) {
    for (const file of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, file), { force: true });
    }
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const results = [];
  for (const template of templates) {
    results.push(await renderPdf(browser, template));
  }

  const indexHtml = renderIndex(results);
  const indexHtmlPath = path.join(outDir, "index.html");
  const indexPdfPath = path.join(outDir, "00-template-pack-index.pdf");
  fs.writeFileSync(indexHtmlPath, indexHtml);
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  await page.setContent(indexHtml, { waitUntil: "networkidle" });
  await page.pdf({
    path: indexPdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });
  await page.close();
  await browser.close();

  await mergePdfs(results, indexPdfPath);
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: results.length,
    files: results.map((result, index) => ({
      id: templates[index].id,
      title: templates[index].title,
      group: templates[index].group,
      pdf: path.relative(outDir, result.pdfPath).replace(/\\/g, "/"),
      html: `html/${result.name}.html`,
    })),
  }, null, 2));

  console.log(`Generated ${results.length} template PDFs in ${pdfDir}`);
  console.log(`Combined pack: ${path.join(outDir, "Vision360-email-template-pack.pdf")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
