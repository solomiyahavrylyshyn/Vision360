import { useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";

const actions = [
  { icon: "person_add", title: "Add your first customer", sub: "Recommended - needed for jobs & estimates", to: "/clients" },
  { icon: "work", title: "Create your first job", sub: "Schedule and assign field work", to: "/jobs" },
  { icon: "description", title: "Create an estimate", sub: "Send quotes to your customer", to: "/estimates/new" },
];

export function Welcome() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="w-full flex flex-col gap-6">
        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Welcome to Vision360!</h1>
            <p className="text-[18px] text-[#374151]">
              Your account is ready. Start managing your field operations - jobs, clients, estimates and more.
            </p>
          </div>

          {/* Action cards */}
          <div className="flex flex-col gap-4">
            {actions.map((a) => (
              <button
                key={a.title}
                type="button"
                onClick={() => navigate(a.to)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-[#E5E7EB] bg-white text-left transition-colors hover:border-[#4A6FA5] hover:bg-[#F9FAFB]"
              >
                <span className="material-icons text-[#1A2332] shrink-0" style={{ fontSize: "20px" }}>{a.icon}</span>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[14px] font-medium leading-5 text-[#1A2332]">{a.title}</p>
                  <p className="text-[12px] font-medium leading-4 text-[#6B7280]">{a.sub}</p>
                </div>
                <span className="material-icons text-[#6B7280] shrink-0" style={{ fontSize: "20px" }}>chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85]"
        >
          Skip
        </button>
      </div>
    </AuthLayout>
  );
}
