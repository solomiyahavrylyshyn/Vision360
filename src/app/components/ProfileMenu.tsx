import { useNavigate } from "react-router";

export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const goTo = (path: string, replace = false) => {
    onClose();
    navigate(path, { replace });
  };

  return (
    <div className="fixed right-4 top-[68px] z-[1200] w-[240px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-2 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
      <button
        type="button"
        onClick={() => goTo("/profile")}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
        style={{ fontWeight: 600 }}
      >
        <span className="material-icons-outlined text-[#4A6FA5]" style={{ fontSize: "19px" }}>person</span>
        <span>Account Profile</span>
      </button>

      <div className="my-1 h-px bg-[#EEF1F5]" />

      <button
        type="button"
        onClick={() => goTo("/login", true)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
        style={{ fontWeight: 600 }}
      >
        <span className="material-icons-outlined" style={{ fontSize: "19px" }}>logout</span>
        <span>Logout</span>
      </button>
    </div>
  );
}
