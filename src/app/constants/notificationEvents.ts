// Notification event catalog (FR-13.3) — the single list shared by the
// company-level defaults (Settings → Company profile → Notifications) and the
// per-user preferences (Profile → Notifications, FR-13.5).
//
// Deliberately excluded, because the PRD rules them out:
//   • "Invoice overdue" — Overdue is derived on display; no overdue
//     notifications are sent (FR-7.12).
//   • "Failed payment" — a failed payment stores no record and raises no
//     notification; it is a transient event (FR-8.4).

export interface NotificationEvent {
  key: string;
  label: string;
  description: string;
}

export const jobNotificationEvents: NotificationEvent[] = [
  { key: "job_assigned", label: "New job assigned", description: "Notify when a job is assigned to a technician" },
  { key: "job_dispatched", label: "Technician dispatched", description: "Notify when a technician is dispatched to a job" },
  { key: "job_completed", label: "Job completed", description: "Notify when a job is marked completed" },
];

export const estimateNotificationEvents: NotificationEvent[] = [
  { key: "estimate_sent", label: "Estimate sent", description: "Notify when an estimate is sent to a client" },
  { key: "estimate_viewed", label: "Estimate viewed", description: "Notify when a client opens the estimate link" },
  { key: "estimate_changes", label: "Changes requested", description: "Notify when a client requests changes" },
  { key: "estimate_approved", label: "Estimate approved", description: "Notify when a client approves an estimate" },
  { key: "estimate_signed", label: "Estimate signed", description: "Notify when a client signs an estimate, including the option selected" },
];

export const paymentNotificationEvents: NotificationEvent[] = [
  { key: "invoice_signed", label: "Invoice signed", description: "Notify when a client signs an invoice" },
  { key: "payment_received", label: "Payment received", description: "Notify when a customer payment is received" },
];

export const allNotificationEvents: NotificationEvent[] = [
  ...jobNotificationEvents,
  ...estimateNotificationEvents,
  ...paymentNotificationEvents,
];
