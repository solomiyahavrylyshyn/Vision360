import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function CompanySetup() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Column: Visual/Marketing */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659353586512-bcc4c7182d01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbmdpbmVlciUyMHRhYmxldHxlbnwxfHx8fDE3NzUyMjIzODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/80 to-transparent" />

        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full">
          <div className="mt-auto mb-16">
            <div className="mb-8" style={{ marginTop: "-1px", paddingRight: "3px", marginBottom: "-1px", paddingLeft: "3px" }}>
              <img src={logoImg} alt="Vision360 Logo" className="h-[96px] w-auto object-contain brightness-0 invert mb-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Transform your <br/>
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

      {/* Right Column: Business Setup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-5">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center">
                <span className="material-icons text-white" style={{ fontSize: "16px" }}>check</span>
              </div>
              <span className="text-xs font-semibold text-[#4A6FA5]">Account</span>
            </div>
            <div className="w-8 h-px bg-[#DDE3EE]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center">
                <span className="material-icons text-white" style={{ fontSize: "16px" }}>check</span>
              </div>
              <span className="text-xs font-semibold text-[#4A6FA5]">Verify</span>
            </div>
            <div className="w-8 h-px bg-[#DDE3EE]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <span className="text-xs font-semibold text-[#1A2332]">Business</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Tell us about your business</h2>
            <p className="text-[#546478] text-[15px]">Just the basics to personalize your experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g., Smith Plumbing Services"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
              <p className="text-xs text-[#546478]">This appears on estimates and invoices</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#1A2332]">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#1A2332]">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Business Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">Industry</Label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-11 px-3 border border-[#DDE3EE] rounded-md bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6FA5] transition-colors text-sm"
              >
                <option value="">Select your industry</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="cleaning">Cleaning</option>
                <option value="landscaping">Landscaping</option>
                <option value="general">General Contracting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">Team Size</Label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full h-11 px-3 border border-[#DDE3EE] rounded-md bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6FA5] transition-colors text-sm"
              >
                <option value="">Select team size</option>
                <option value="1">Just me</option>
                <option value="2-5">2 - 5</option>
                <option value="6-15">6 - 15</option>
                <option value="16-50">16 - 50</option>
                <option value="50+">50+</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] text-white transition-colors mt-2"
              disabled={!companyName || !firstName || !lastName || !phone}
            >
              Continue
            </Button>

            <div className="text-center">
              {/* removed skip button — business info is required */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}