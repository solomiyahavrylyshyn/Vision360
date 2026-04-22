import { PageHeader } from "../components/ui/page-header";

export function Events() {
  return (
    <div className="p-8">
      <PageHeader title="Appointments" />

      <div className="bg-white rounded-lg border border-[#DDE3EE] p-12 text-center">
        <div className="w-14 h-14 rounded-xl bg-[#EBF0F8] flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "28px" }}>event</span>
        </div>
        <h2 className="text-[16px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Appointments Coming Soon</h2>
        <p className="text-[13px] text-[#546478] max-w-[360px] mx-auto">This feature is currently under development. You'll be able to manage all your appointments here.</p>
      </div>
    </div>
  );
}
