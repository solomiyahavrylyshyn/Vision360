import { useNavigate } from "react-router";
import { useSyncExternalStore } from "react";
import { companyStore } from "../stores/companyStore";

// Software-account page — the customer↔Vision360 relationship.
// Per Marek's walkthrough #3: "Account... For the software account.
// I [communicate] with your account manager. Email, schedule a call... private email."
//
// So this page holds: subscription/plan info, account manager contact card
// with email + schedule-call CTAs, and billing contact.

export function Account() {
  const navigate = useNavigate();
  const companyName = useSyncExternalStore(companyStore.subscribe, companyStore.getCompanyName);

  // Mocked Vision360 account data
  const accountManager = {
    name: "Marek Stroz",
    title: "Senior Account Manager",
    email: "marek.stroz@vision360.app",
    phone: "(813) 555-0188",
    schedulingUrl: "https://calendly.com/vision360-marek",
  };
  const subscription = {
    plan: "Growth",
    seats: 5,
    seatsUsed: 4,
    status: "Active",
    renewalDate: "Dec 14, 2026",
    pricePerSeat: 49,
  };
  const accountId = "V360-29899-OMH";
  const billingContact = {
    name: "John Doe",
    email: "billing@omegahomeservices.com",
  };

  const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "24px" }}>{title}</h2>
        {description && <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[860px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-3"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back
          </button>
          <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>Account</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Your Vision360 subscription, billing, and account manager.</p>
        </div>

        <div className="space-y-4">
          {/* Account manager — Marek's headline use case */}
          <Section title="Your account manager" description="Direct line to Vision360. Email, call, or book time.">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-[#4A6FA5] text-white flex items-center justify-center text-[20px] shrink-0" style={{ fontWeight: 600 }}>
                {accountManager.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>{accountManager.name}</div>
                <div className="text-[13px] text-[#6B7280] mt-0.5">{accountManager.title}</div>
                <div className="flex flex-col gap-1 mt-3">
                  <div className="flex items-center gap-2 text-[13px] text-[#374151]">
                    <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>email</span>
                    <a href={`mailto:${accountManager.email}`} className="text-[#4A6FA5] hover:underline">{accountManager.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#374151]">
                    <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>phone</span>
                    <a href={`tel:${accountManager.phone}`} className="text-[#4A6FA5] hover:underline">{accountManager.phone}</a>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href={`mailto:${accountManager.email}`}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>email</span>
                    Send email
                  </a>
                  <a
                    href={accountManager.schedulingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>event</span>
                    Schedule a call
                  </a>
                </div>
              </div>
            </div>
          </Section>

          {/* Subscription / plan */}
          <Section title="Subscription" description="Current plan, seats, and renewal.">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Plan</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>{subscription.plan}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A]" style={{ fontWeight: 600 }}>{subscription.status}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Seats</div>
                <div className="text-[16px] text-[#1A2332] mt-1" style={{ fontWeight: 600 }}>
                  {subscription.seatsUsed} <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>of {subscription.seats} used</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Renews on</div>
                <div className="text-[16px] text-[#1A2332] mt-1" style={{ fontWeight: 600 }}>{subscription.renewalDate}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Price</div>
                <div className="text-[16px] text-[#1A2332] mt-1" style={{ fontWeight: 600 }}>${subscription.pricePerSeat} <span className="text-[13px] text-[#9CA3AF]" style={{ fontWeight: 400 }}>/ seat / mo</span></div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>
                Manage plan
              </button>
              <button className="h-9 px-4 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] transition-colors" style={{ fontWeight: 500 }}>
                View invoices
              </button>
            </div>
          </Section>

          {/* Billing contact */}
          <Section title="Billing contact" description="Where Vision360 sends invoices and receipts.">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Contact</div>
                <div className="text-[14px] text-[#1A2332] mt-1" style={{ fontWeight: 500 }}>{billingContact.name}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Email</div>
                <div className="text-[14px] text-[#1A2332] mt-1" style={{ fontWeight: 500 }}>{billingContact.email}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Workspace</div>
                <div className="text-[14px] text-[#1A2332] mt-1" style={{ fontWeight: 500 }}>{companyName}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Account ID</div>
                <div className="text-[14px] text-[#1A2332] mt-1 font-mono" style={{ fontWeight: 500 }}>{accountId}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="h-9 px-4 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] transition-colors" style={{ fontWeight: 500 }}>
                Update billing contact
              </button>
            </div>
          </Section>

          {/* Danger zone */}
          <Section title="Danger zone" description="Cancel your subscription or close the workspace.">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border border-[#FEE2E2] rounded-lg px-4 py-3 bg-[#FEF2F2]">
                <div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Cancel subscription</div>
                  <div className="text-[12px] text-[#6B7280] mt-0.5">Your workspace stays read-only after the current period ends.</div>
                </div>
                <button className="h-8 px-3 border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] rounded-md text-[13px] transition-colors" style={{ fontWeight: 500 }}>
                  Cancel
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
