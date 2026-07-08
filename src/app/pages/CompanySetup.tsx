import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { AuthStepper } from "../components/AuthStepper";
import { companyStore } from "../stores/companyStore";
import { trialStore } from "../stores/trialStore";
import { setupStore } from "../stores/setupStore";

export function CompanySetup() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [timeZone, setTimeZone] = useState("");

  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    phone.trim() !== "" &&
    industry !== "" &&
    teamSize !== "" &&
    timeZone !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (companyName.trim()) companyStore.setCompanyName(companyName.trim());
    trialStore.startTrialIfMissing();
    setupStore.markComplete();
    navigate("/welcome");
  };

  const labelCls = "text-[14px] font-medium leading-5 text-[#1A2332]";
  const inputCls =
    "w-full h-10 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";
  const selectCls =
    "w-full h-10 pl-4 pr-10 rounded-lg border border-[#E5E7EB] bg-white text-[14px] appearance-none shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6" noValidate>
        <AuthStepper current={3} />

        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Tell us about your business</h1>
            <p className="text-[18px] text-[#374151]">Just the basics to personalize your experience.</p>
          </div>

          {/* form-inner */}
          <div className="flex flex-col gap-4">
            {/* Company name (optional) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="company" className={labelCls}>Company name</label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Smith Plumbing Services"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* First / Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="first-name" className={labelCls}>First name *</label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="last-name" className={labelCls}>Last name *</label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Business phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className={labelCls}>Business phone *</label>
              <input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            {/* Industry */}
            <div className="flex flex-col gap-2">
              <label htmlFor="industry" className={labelCls}>Industry *</label>
              <div className="relative">
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={selectCls}
                  style={{ color: industry ? "#1A2332" : "#6B7280" }}
                  required
                >
                  <option value="">Select your industry</option>
                  <option value="hvac">HVAC</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="roofing">Roofing</option>
                  <option value="pool">Pool Service</option>
                  <option value="general">General Contracting</option>
                  <option value="others">Other</option>
                </select>
                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "20px" }}>expand_more</span>
              </div>
            </div>

            {/* Team size / Time zone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="team-size" className={labelCls}>Team size *</label>
                <div className="relative">
                  <select
                    id="team-size"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className={selectCls}
                    style={{ color: teamSize ? "#1A2332" : "#6B7280" }}
                    required
                  >
                    <option value="">Select team size</option>
                    <option value="solo">Just me</option>
                    <option value="under10">Under 10</option>
                    <option value="plus10more">More than 10</option>
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "20px" }}>expand_more</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="time-zone" className={labelCls}>Time zone *</label>
                <div className="relative">
                  <select
                    id="time-zone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className={selectCls}
                    style={{ color: timeZone ? "#1A2332" : "#6B7280" }}
                    required
                  >
                    <option value="">Select time zone</option>
                    <option value="et">(UTC-05:00) USA/New_York</option>
                    <option value="ct">(UTC-06:00) USA/Chicago</option>
                    <option value="mt">(UTC-07:00) USA/Denver</option>
                    <option value="pt">(UTC-08:00) USA/Los_Angeles</option>
                    <option value="akt">(UTC-09:00) USA/Anchorage</option>
                    <option value="ht">(UTC-10:00) USA/Honolulu</option>
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "20px" }}>expand_more</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Continue
        </button>
      </form>
    </AuthLayout>
  );
}
