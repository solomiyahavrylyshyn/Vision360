import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("john@example.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const msg = (location.state as any)?.toast;
    if (msg) {
      setToast(msg);
      // Clear state so toast doesn't persist on refresh
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/register");
  };

  return (
    <div className="min-h-screen w-full flex bg-white relative">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#1A2332] text-white rounded-xl shadow-2xl">
            <span className="material-icons text-[#22C55E]" style={{ fontSize: "20px" }}>check_circle</span>
            <span className="text-[14px] font-medium">{toast}</span>
            <button onClick={() => setToast("")} className="ml-2 text-white/60 hover:text-white">
              <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>
        </div>
      )}

      {/* Left Column: Visual/Marketing - Hidden on small screens */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224155-169641357599?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMGNvbmNlcHR8ZW58MHx8fHwxNzc1MjIyNTE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
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

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Logo for mobile only */}
          <div className="lg:hidden mb-5">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Welcome back</h2>
            <p className="text-[#546478] text-[15px]">Sign in to your Vision360 account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">
                Email Address
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[#1A2332]">
                  Password
                </Label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked as boolean)}
                  className="data-[state=checked]:bg-[#4A6FA5] data-[state=checked]:border-[#4A6FA5]"
                />
                <label htmlFor="remember" className="text-sm text-[#546478] cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-sm text-[#4A6FA5] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] transition-colors mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#EDF0F5] text-center">
            <p className="text-[#546478]">
              Don't have an account?{" "}
              <a href="/register" onClick={handleCreateAccount} className="text-[#4A6FA5] font-semibold hover:underline">
                Create account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}