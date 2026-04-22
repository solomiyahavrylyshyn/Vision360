import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const calculatePasswordStrength = () => {
    if (!password) return { width: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    if (strength <= 25) return { width: 25, label: "Weak", color: "#DC2626" };
    if (strength <= 50) return { width: 50, label: "Fair", color: "#D97706" };
    if (strength <= 75) return { width: 75, label: "Good", color: "#D97706" };
    return { width: 100, label: "Strong", color: "#16A34A" };
  };

  const passwordStrength = calculatePasswordStrength();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    navigate("/verify-2fa");
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Column: Visual/Marketing - Hidden on small screens */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659353586512-bcc4c7182d01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbmdpbmVlciUyMHRhYmxldHxlbnwxfHx8fDE3NzUyMjIzODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/80 to-transparent" />
        
        {/* Content */}
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

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Logo for mobile only */}
          <div className="lg:hidden mb-5">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-10">
            {/* Step indicator */}
            <div className="mb-8 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <span className="text-xs font-semibold text-[#1A2332]">Account</span>
              </div>
              <div className="w-8 h-px bg-[#DDE3EE]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EDF0F5] flex items-center justify-center text-[#546478] text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-semibold text-[#546478]">Verify</span>
              </div>
              <div className="w-8 h-px bg-[#DDE3EE]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EDF0F5] flex items-center justify-center text-[#546478] text-xs font-bold">
                  3
                </div>
                <span className="text-xs font-semibold text-[#546478]">Business</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Create your account</h2>
            <p className="text-[#546478] text-[15px]">Start managing your field operations efficiently.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Work Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
              {password && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-[#EDF0F5]">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.width >= 25 ? 'bg-red-500' : 'bg-transparent'}`}
                      style={{ width: passwordStrength.width >= 25 ? '100%' : '0%' }}
                    />
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.width >= 50 ? 'bg-amber-500' : 'bg-transparent'}`}
                      style={{ width: passwordStrength.width >= 50 ? '100%' : '0%' }}
                    />
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.width >= 75 ? 'bg-amber-500' : 'bg-transparent'}`}
                      style={{ width: passwordStrength.width >= 75 ? '100%' : '0%' }}
                    />
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.width === 100 ? 'bg-green-600' : 'bg-transparent'}`}
                      style={{ width: passwordStrength.width === 100 ? '100%' : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className={`text-xs font-medium`} style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                    <p className="text-xs text-[#546478]">
                      Min. 8 characters
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                required
                className="mt-1 data-[state=checked]:bg-[#4A6FA5] data-[state=checked]:border-[#4A6FA5]"
              />
              <label htmlFor="terms" className="text-sm text-[#546478] leading-relaxed cursor-pointer select-none">
                I agree to the{" "}
                <a href="#" className="text-[#4A6FA5] font-semibold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#4A6FA5] font-semibold hover:underline">
                  Privacy Policy
                </a>.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] transition-colors mt-4"
              disabled={!acceptTerms || password.length === 0}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#EDF0F5] text-center">
            <p className="text-[#546478]">
              Already have an account?{" "}
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="text-[#4A6FA5] font-semibold hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}