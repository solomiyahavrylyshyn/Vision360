// Notification event catalog — mirrors the backend exactly:
// backend-service Vision360.Domain/Constants/NotificationEventKeys.cs (9 keys,
// in display order). The keys are the wire values; the app owns the labels and
// the Job / Estimate / Invoice & Payment grouping (as the backend comment says).
//
// Not here, because the backend refuses or never sends them:
//   • "Invoice overdue" — no scheduled overdue check yet (FR-7.12).
//   • Estimate sent / signed, Invoice signed — no such keys on the backend.
// "Technician dispatched" is a real key, but nothing sends it until the mobile
// app's "On my way".

export interface NotificationEvent {
  key: string;
  label: string;
  description: string;
}

export const jobNotificationEvents: NotificationEvent[] = [
  { key: "newJobAssigned", label: "New job assigned", description: "When a job is assigned to a technician" },
  { key: "jobRescheduled", label: "Job rescheduled", description: "When a job's date or time changes" },
  { key: "technicianDispatched", label: "Technician dispatched", description: "When a technician is on the way to a job" },
  { key: "jobCompleted", label: "Job completed", description: "When a job is marked completed" },
];

export const estimateNotificationEvents: NotificationEvent[] = [
  { key: "estimateApproved", label: "Estimate approved", description: "When a client approves an estimate" },
  { key: "estimateDeclined", label: "Estimate declined", description: "When a client declines an estimate" },
  { key: "customerViewedEstimate", label: "Customer viewed estimate", description: "When a client opens the estimate link" },
];

export const paymentNotificationEvents: NotificationEvent[] = [
  { key: "paymentReceived", label: "Payment received", description: "When a client payment is received" },
  { key: "failedPayment", label: "Failed payment", description: "When a card payment fails" },
];

export const notificationGroups = [
  { title: "Job notifications", events: jobNotificationEvents },
  { title: "Estimate notifications", events: estimateNotificationEvents },
  { title: "Invoice & Payment notifications", events: paymentNotificationEvents },
];

export const allNotificationEvents: NotificationEvent[] = [
  ...jobNotificationEvents,
  ...estimateNotificationEvents,
  ...paymentNotificationEvents,
];
