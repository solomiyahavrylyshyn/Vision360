import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex bg-white">

      {/* Left Column */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659353586512-bcc4c7182d01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbmdpbmVlciUyMHRhYmxldHxlbnwxfHx8fDE3NzUyMjIzODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/80 to-transparent" />

        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full">
          <div className="mt-auto mb-16">
            <div className="mb-8">
              <img src={logoImg} alt="Vision360 Logo" className="h-[96px] w-auto object-contain brightness-0 invert mb-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Transform your <br />
              <span className="text-[#4A6FA5]">field operations.</span>
            </h1>
            <p className="text-[#A0B0C4] text-lg max-w-md mb-8">
              Join thousands of professionals scaling their service businesses with Vision360 FSM Platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Smart job scheduling & dispatch</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Automated quotes and invoicing</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Real-time team tracking</span>
              </div>
            </div>
          </div>
          <div className="text-[#546478] text-sm">
            © 2026 Vision360 Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          {/* Success badge */}
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#4A6FA5]/10 flex items-center justify-center shrink-0">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "26px" }}>
                check_circle
              </span>
            </div>
            <span className="text-sm font-semibold text-[#4A6FA5] tracking-wide uppercase">
              Account verified
            </span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">
              Welcome to Vision360!
            </h2>
            <p className="text-[#546478] text-[15px] leading-relaxed">
              Your account is ready. Start managing your field operations — jobs, clients, estimates and more.
            </p>
          </div>

          {/* Quick actions */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => navigate("/clients")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#DDE3EE] hover:border-[#4A6FA5] hover:bg-[#F5F7FA] transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#4A6FA5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4A6FA5]/15 transition-colors">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>person_add</span>
              </div>
              <div>
                <p className="font-semibold text-[#1A2332] text-sm">Add your first customer</p>
                <p className="text-xs text-[#546478] mt-0.5">Recommended — needed for jobs & estimates</p>
              </div>
              <span className="material-icons text-[#DDE3EE] group-hover:text-[#4A6FA5] ml-auto transition-colors" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </button>

            <button
              onClick={() => navigate("/jobs")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#DDE3EE] hover:border-[#4A6FA5] hover:bg-[#F5F7FA] transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#4A6FA5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4A6FA5]/15 transition-colors">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>work</span>
              </div>
              <div>
                <p className="font-semibold text-[#1A2332] text-sm">Create your first job</p>
                <p className="text-xs text-[#546478] mt-0.5">Schedule and assign field work</p>
              </div>
              <span className="material-icons text-[#DDE3EE] group-hover:text-[#4A6FA5] ml-auto transition-colors" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </button>

            <button
              onClick={() => navigate("/estimates/new")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#DDE3EE] hover:border-[#4A6FA5] hover:bg-[#F5F7FA] transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#4A6FA5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4A6FA5]/15 transition-colors">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>description</span>
              </div>
              <div>
                <p className="font-semibold text-[#1A2332] text-sm">Create an estimate</p>
                <p className="text-xs text-[#546478] mt-0.5">Send quotes to your customers</p>
              </div>
              <span className="material-icons text-[#DDE3EE] group-hover:text-[#4A6FA5] ml-auto transition-colors" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </button>
          </div>

          {/* Tip */}
          <div className="w-full bg-[#EEF3FA] border border-[#C8D8EE] rounded-xl px-5 py-4 flex items-start gap-3 mb-8">
            <span className="material-icons text-[#4A6FA5] shrink-0 mt-0.5" style={{ fontSize: "18px" }}>
              lightbulb
            </span>
            <p className="text-sm text-[#546478]">
              <span className="font-semibold text-[#1A2332]">Tip: </span>
              Don't forget to add your customers first — it'll make creating jobs and estimates much faster.
            </p>
          </div>

          {/* Skip */}
          <button
            onClick={() => navigate("/")}
            className="w-full text-sm text-[#A0B0C4] font-medium hover:text-[#546478] transition-colors text-center"
          >
            Go to Dashboard
          </button>

        </div>
      </div>
    </div>
  );
}
