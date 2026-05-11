import { useState, useSyncExternalStore, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { tagsStore } from "../stores/tagsStore";
import { countiesStore } from "../stores/countiesStore";
import { jobTypesStore } from "../stores/jobTypesStore";
import { customFieldsStore, type CfEntity } from "../stores/customFieldsStore";
import { toast } from "sonner";

type SettingsSection =
  | "home"
  | "profile"
  | "business"
  | "notifications"
  | "security"
  | "billing"
  | "team"
  | "integrations"
  | "taxes"
  | "templates"
  | "marketingSources"
  | "customerTags"
  | "counties"
  | "jobTypes"
  | "customFields";


export function Settings() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>("home");

  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState("");
  const marketingSources = useSyncExternalStore(
    marketingSourcesStore.subscribe,
    marketingSourcesStore.getSources
  );
  const customerTags = useSyncExternalStore(
    tagsStore.subscribe,
    tagsStore.getTags
  );
  const counties = useSyncExternalStore(
    countiesStore.subscribe,
    countiesStore.getCounties
  );
  const [newSourceName, setNewSourceName] = useState("");
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [newCountyName, setNewCountyName] = useState("");
  const [editingCounty, setEditingCounty] = useState<string | null>(null);
  const [editingCountyValue, setEditingCountyValue] = useState("");
  const jobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  const [newJobTypeName, setNewJobTypeName] = useState("");
  const [editingJobType, setEditingJobType] = useState<string | null>(null);
  const [editingJobTypeValue, setEditingJobTypeValue] = useState("");

  // Custom Fields — via shared store
  const [cfEntity, setCfEntity] = useState<CfEntity>("clients");
  const customFields = useSyncExternalStore(customFieldsStore.subscribe, customFieldsStore.getFields);
  const [cfNewOption, setCfNewOption] = useState<Record<string, string>>({});

  return (
    <div className="flex h-full bg-[#F2F4F7]" style={{ height: "calc(100vh - 64px)" }}>
      {/* Settings Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
        {/* Sidebar Top */}
        <div className="px-3.5 py-3.5 border-b border-[#E5E7EB]">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[#546478] mb-2.5">Settings</div>
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1.5 pl-8 border border-[#E5E7EB] rounded-md text-xs bg-[#F5F7FA] text-[#1A2332] outline-none transition-all focus:border-[#4A6FA5] focus:shadow-[0_0_0_3px_#EBF0F8] focus:bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%23546478' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "9px center"
            }}
          />
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-1.5">
          <button
            onClick={() => setActiveSection("home")}
            className={`w-full flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium transition-colors ${
              activeSection === "home"
                ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold"
                : "text-[#1A2332] hover:bg-[#F5F7FA]"
            }`}
          >
            <span className={`material-icons flex-shrink-0 ${activeSection === "home" ? "text-[#4A6FA5]" : "text-[#546478]"}`} style={{ fontSize: "17px" }}>home</span>
            <span>Home</span>
          </button>

          <div className="h-px bg-[#E5E7EB] mx-3.5 my-1.5"></div>

          {/* Account Group */}
          <div>
            <div className="flex items-center px-3.5 py-[7px] cursor-pointer hover:bg-[#F5F7FA]">
              <span className="material-icons text-[#546478] mr-2 flex-shrink-0" style={{ fontSize: "16px" }}>person</span>
              <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Account</span>
              <span className="material-icons text-[#546478] text-base">expand_more</span>
            </div>
            <div>
              <button
                onClick={() => setActiveSection("profile")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "profile"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveSection("security")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "security"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Security & Password
              </button>
              <button
                onClick={() => setActiveSection("notifications")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "notifications"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Notifications
              </button>
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] mx-3.5 my-1.5"></div>

          {/* Business Group */}
          <div>
            <div className="flex items-center px-3.5 py-[7px] cursor-pointer hover:bg-[#F5F7FA]">
              <span className="material-icons text-[#546478] mr-2 flex-shrink-0" style={{ fontSize: "16px" }}>business</span>
              <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Business</span>
              <span className="material-icons text-[#546478] text-base">expand_more</span>
            </div>
            <div>
              <button
                onClick={() => setActiveSection("business")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "business"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Company Info
              </button>
              <button
                onClick={() => setActiveSection("team")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "team"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Team & Users
              </button>
              <button
                onClick={() => setActiveSection("taxes")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "taxes"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Taxes & Rates
              </button>
              <button
                onClick={() => setActiveSection("marketingSources")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "marketingSources"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Lead Sources
              </button>
              <button
                onClick={() => setActiveSection("customerTags")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "customerTags"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Customer Tags
              </button>
              <button
                onClick={() => setActiveSection("counties")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "counties"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Counties
              </button>
              <button
                onClick={() => setActiveSection("jobTypes")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "jobTypes"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Job Types
              </button>
              <button
                onClick={() => setActiveSection("customFields")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "customFields"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Custom Fields
              </button>
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] mx-3.5 my-1.5"></div>

          {/* System Group */}
          <div>
            <div className="flex items-center px-3.5 py-[7px] cursor-pointer hover:bg-[#F5F7FA]">
              <span className="material-icons text-[#546478] mr-2 flex-shrink-0" style={{ fontSize: "16px" }}>settings</span>
              <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">System</span>
              <span className="material-icons text-[#546478] text-base">expand_more</span>
            </div>
            <div>
              <button
                onClick={() => setActiveSection("integrations")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "integrations"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveSection("templates")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "templates"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Email Templates
              </button>
              <button
                onClick={() => setActiveSection("billing")}
                className={`w-full block px-3.5 py-1.5 pl-9 text-[12.5px] transition-colors text-left ${
                  activeSection === "billing"
                    ? "bg-[#EBF0F8] text-[#4A6FA5] font-semibold border-l-[3px] border-l-[#4A6FA5] pl-[33px]"
                    : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
                }`}
              >
                Billing & Subscription
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-7 px-9 max-w-[960px]">
          {activeSection === "home" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Settings</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage your account, business information, and system preferences.
              </p>

              <div className="flex items-center justify-between px-4 py-3 bg-[#EBF3FF] border border-[#BDD4F5] rounded-lg mb-4.5 gap-4">
                <div className="flex items-center gap-2.5 text-[13px] text-[#1D4ED8] leading-normal">
                  <span className="material-icons flex-shrink-0 text-[#3B82F6]" style={{ fontSize: "17px" }}>info</span>
                  <span>You're currently on the <strong>Pro Plan</strong>. Upgrade to unlock more features.</span>
                </div>
                <button className="px-3.5 py-1.5 bg-white border border-[#BDD4F5] rounded-md text-xs font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE] transition-colors whitespace-nowrap">
                  Upgrade
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("profile")}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>person</span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#1A2332] mb-1">Profile</h3>
                      <p className="text-[13px] text-[#546478]">Update your personal information</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("business")}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>business</span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#1A2332] mb-1">Business Info</h3>
                      <p className="text-[13px] text-[#546478]">Manage company details</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("team")}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>group</span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#1A2332] mb-1">Team & Users</h3>
                      <p className="text-[13px] text-[#546478]">Manage team members and permissions</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("billing")}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>credit_card</span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#1A2332] mb-1">Billing</h3>
                      <p className="text-[13px] text-[#546478]">View plans and payment methods</p>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeSection === "profile" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Profile Information</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Update your personal information and contact details.
              </p>

              <Card className="p-6 border border-[#E5E7EB]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>First Name</Label>
                      <Input defaultValue="Marek" className="border-[#E5E7EB]" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Last Name</Label>
                      <Input defaultValue="Stroz" className="border-[#E5E7EB]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Email</Label>
                    <Input type="email" defaultValue="marek@abcplumbing.com" className="border-[#E5E7EB]" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Phone</Label>
                    <Input defaultValue="(555) 123-4567" className="border-[#E5E7EB]" />
                  </div>
                  <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]">Save Changes</Button>
                </div>
              </Card>
            </>
          )}

          {activeSection === "business" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Business Information</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage your company details, address, and business settings.
              </p>

              <Card className="p-6 border border-[#E5E7EB]">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Business Name</Label>
                    <Input defaultValue="ABC Plumbing Services" className="border-[#E5E7EB]" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Tax ID / EIN</Label>
                    <Input defaultValue="12-3456789" className="border-[#E5E7EB]" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Business Address</Label>
                    <Input defaultValue="123 Main Street, Suite 100" className="border-[#E5E7EB]" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input defaultValue="San Francisco" className="border-[#E5E7EB]" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>State</Label>
                      <Input defaultValue="CA" className="border-[#E5E7EB]" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>ZIP</Label>
                      <Input defaultValue="94105" className="border-[#E5E7EB]" />
                    </div>
                  </div>
                  <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]">Save Changes</Button>
                </div>
              </Card>
            </>
          )}

          {activeSection === "notifications" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Notifications</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Configure how and when you receive notifications.
              </p>

              <Card className="p-6 border border-[#E5E7EB]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-[#546478]">Receive updates via email</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-[#546478]">Receive text message alerts</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Appointment Reminders</div>
                      <div className="text-sm text-[#546478]">Get reminded before jobs</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Payment Notifications</div>
                      <div className="text-sm text-[#546478]">Notify when payments are received</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === "security" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Security & Password</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage your password and security preferences.
              </p>

              <Card className="p-6 border border-[#E5E7EB]">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Current Password</Label>
                    <Input type="password" placeholder="••••••••" className="border-[#E5E7EB]" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>New Password</Label>
                    <Input type="password" placeholder="••••••••" className="border-[#E5E7EB]" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block" style={{ fontWeight: 500 }}>Confirm New Password</Label>
                    <Input type="password" placeholder="••••••••" className="border-[#E5E7EB]" />
                  </div>
                  <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]">Update Password</Button>
                </div>
              </Card>
            </>
          )}

          {activeSection === "team" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Team & Users</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Invite team members and manage their access and permissions.
              </p>

              <div className="flex justify-between items-center mb-3.5">
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="max-w-[380px] px-3 py-2 pl-9 border border-[#E5E7EB] rounded-md text-[13px] bg-white transition-all focus:border-[#4A6FA5] focus:shadow-[0_0_0_3px_#EBF0F8] outline-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23546478' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "11px center"
                  }}
                />
                <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]">+ Invite Member</Button>
              </div>

              <table className="w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <thead className="bg-[#F0F2F5]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Name</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Email</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Role</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Status</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#E5E7EB] hover:bg-[#F5F7FA]">
                    <td className="px-3.5 py-3 text-[13px] font-semibold">Marek Stroz</td>
                    <td className="px-3.5 py-3 text-[13px]">marek@abcplumbing.com</td>
                    <td className="px-3.5 py-3 text-[13px]">Owner</td>
                    <td className="px-3.5 py-3 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-[13px]">
                      <button className="px-3 py-1 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {activeSection === "billing" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Billing & Subscription</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage your subscription plan and payment methods.
              </p>

              <Card className="p-6 border border-[#E5E7EB] mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Pro Plan</h3>
                    <p className="text-[#546478]">Billed monthly</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#1A2332]">$49</div>
                    <div className="text-sm text-[#546478]">per month</div>
                  </div>
                </div>
                <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]">Upgrade Plan</Button>
              </Card>

              <Card className="p-6 border border-[#E5E7EB]">
                <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#EBF0F8] rounded flex items-center justify-center">
                      <span className="material-icons text-[#4A6FA5]">credit_card</span>
                    </div>
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-[#546478]">Expires 12/2026</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <Button variant="outline" className="border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8]">+ Add Payment Method</Button>
              </Card>
            </>
          )}

          {(activeSection === "integrations" || activeSection === "taxes" || activeSection === "templates") && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>
                {activeSection === "integrations" && "Integrations"}
                {activeSection === "taxes" && "Taxes & Rates"}
                {activeSection === "templates" && "Email Templates"}
              </h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                This section is coming soon.
              </p>
              <Card className="p-8 border border-[#E5E7EB] text-center">
                <div className="w-14 h-14 rounded-xl bg-[#EBF0F8] flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "28px" }}>construction</span>
                </div>
                <h3 className="text-[16px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Coming Soon</h3>
                <p className="text-[13px] text-[#546478]">This feature is currently under development.</p>
              </Card>
            </>
          )}

          {activeSection === "marketingSources" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Lead Sources</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage the list of lead sources available when creating or editing clients.
              </p>

              <Card className="p-6 border border-[#E5E7EB] mb-4">
                <div className="flex gap-3 mb-5">
                  <Input
                    placeholder="New source name..."
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="border-[#E5E7EB] max-w-[360px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newSourceName.trim()) {
                          marketingSourcesStore.addSource(newSourceName);
                          setNewSourceName("");
                          toast.success("Source added");
                        }
                      }
                    }}
                  />
                  <Button
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
                    onClick={() => {
                      if (newSourceName.trim()) {
                        marketingSourcesStore.addSource(newSourceName);
                        setNewSourceName("");
                        toast.success("Source added");
                      }
                    }}
                  >
                    + Add Source
                  </Button>
                </div>

                <table className="w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <thead className="bg-[#F0F2F5]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Source Name</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#546478] w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketingSources.map((source) => (
                      <tr key={source} className="border-t border-[#E5E7EB] hover:bg-[#F5F7FA]">
                        <td className="px-3.5 py-2.5 text-[13px]">
                          {editingSource === source ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="border-[#E5E7EB] h-8 text-[13px] max-w-[300px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  marketingSourcesStore.renameSource(source, editingValue);
                                  setEditingSource(null);
                                  toast.success("Source renamed");
                                }
                                if (e.key === "Escape") setEditingSource(null);
                              }}
                            />
                          ) : (
                            source
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingSource === source ? (
                              <>
                                <button
                                  onClick={() => {
                                    marketingSourcesStore.renameSource(source, editingValue);
                                    setEditingSource(null);
                                    toast.success("Source renamed");
                                  }}
                                  className="px-2.5 py-1 bg-[#4A6FA5] text-white rounded text-xs font-medium hover:bg-[#3d5a85] transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingSource(null)}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#546478] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingSource(source); setEditingValue(source); }}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => { marketingSourcesStore.removeSource(source); toast.success("Source removed"); }}
                                  className="px-2.5 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-xs font-medium hover:bg-[#DC2626] hover:text-white transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {activeSection === "customerTags" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Customer Tags</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage the list of tags available for organizing and categorizing clients.
              </p>

              <Card className="p-6 border border-[#E5E7EB] mb-4">
                <div className="flex gap-3 mb-5">
                  <Input
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="border-[#E5E7EB] max-w-[360px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newTagName.trim()) {
                          tagsStore.addTag(newTagName);
                          setNewTagName("");
                          toast.success("Tag added");
                        }
                      }
                    }}
                  />
                  <Button
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
                    onClick={() => {
                      if (newTagName.trim()) {
                        tagsStore.addTag(newTagName);
                        setNewTagName("");
                        toast.success("Tag added");
                      }
                    }}
                  >
                    + Add Tag
                  </Button>
                </div>

                <table className="w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <thead className="bg-[#F0F2F5]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Tag Name</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#546478] w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTags.map((tag) => (
                      <tr key={tag} className="border-t border-[#E5E7EB] hover:bg-[#F5F7FA]">
                        <td className="px-3.5 py-2.5 text-[13px]">
                          {editingTag === tag ? (
                            <Input
                              value={editingTagValue}
                              onChange={(e) => setEditingTagValue(e.target.value)}
                              className="border-[#E5E7EB] h-8 text-[13px] max-w-[300px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  tagsStore.renameTag(tag, editingTagValue);
                                  setEditingTag(null);
                                  toast.success("Tag renamed");
                                }
                                if (e.key === "Escape") setEditingTag(null);
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                                {tag}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingTag === tag ? (
                              <>
                                <button
                                  onClick={() => {
                                    tagsStore.renameTag(tag, editingTagValue);
                                    setEditingTag(null);
                                    toast.success("Tag renamed");
                                  }}
                                  className="px-2.5 py-1 bg-[#4A6FA5] text-white rounded text-xs font-medium hover:bg-[#3d5a85] transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingTag(null)}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#546478] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingTag(tag); setEditingTagValue(tag); }}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => { tagsStore.removeTag(tag); toast.success("Tag removed"); }}
                                  className="px-2.5 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-xs font-medium hover:bg-[#DC2626] hover:text-white transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {activeSection === "jobTypes" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Job Types</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage the list of job types available when creating or editing jobs.
              </p>

              <Card className="p-6 border border-[#E5E7EB] mb-4">
                <div className="flex gap-3 mb-5">
                  <Input
                    placeholder="New job type name..."
                    value={newJobTypeName}
                    onChange={(e) => setNewJobTypeName(e.target.value)}
                    className="border-[#E5E7EB] max-w-[360px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newJobTypeName.trim()) {
                          jobTypesStore.addJobType(newJobTypeName);
                          setNewJobTypeName("");
                          toast.success("Job type added");
                        }
                      }
                    }}
                  />
                  <Button
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
                    onClick={() => {
                      if (newJobTypeName.trim()) {
                        jobTypesStore.addJobType(newJobTypeName);
                        setNewJobTypeName("");
                        toast.success("Job type added");
                      }
                    }}
                  >
                    + Add Job Type
                  </Button>
                </div>

                <table className="w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <thead className="bg-[#F0F2F5]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">Job Type</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#546478] w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobTypes.map((jt) => (
                      <tr key={jt} className="border-t border-[#E5E7EB] hover:bg-[#F5F7FA]">
                        <td className="px-3.5 py-2.5 text-[13px]">
                          {editingJobType === jt ? (
                            <Input
                              value={editingJobTypeValue}
                              onChange={(e) => setEditingJobTypeValue(e.target.value)}
                              className="border-[#E5E7EB] h-8 text-[13px] max-w-[300px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  jobTypesStore.renameJobType(jt, editingJobTypeValue);
                                  setEditingJobType(null);
                                  toast.success("Job type renamed");
                                }
                                if (e.key === "Escape") setEditingJobType(null);
                              }}
                            />
                          ) : jt}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingJobType === jt ? (
                              <>
                                <button
                                  onClick={() => { jobTypesStore.renameJobType(jt, editingJobTypeValue); setEditingJobType(null); toast.success("Job type renamed"); }}
                                  className="px-2.5 py-1 bg-[#4A6FA5] text-white rounded text-xs font-medium hover:bg-[#3d5a85] transition-colors"
                                >Save</button>
                                <button
                                  onClick={() => setEditingJobType(null)}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#546478] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors"
                                >Cancel</button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingJobType(jt); setEditingJobTypeValue(jt); }}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors"
                                >Edit</button>
                                <button
                                  onClick={() => { jobTypesStore.removeJobType(jt); toast.success("Job type removed"); }}
                                  className="px-2.5 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-xs font-medium hover:bg-[#DC2626] hover:text-white transition-colors"
                                >Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {activeSection === "counties" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Counties</h1>
              <p className="text-[13px] text-[#546478] mb-4.5 leading-relaxed max-w-[680px]">
                Manage the list of counties available when creating or editing client addresses.
              </p>

              <Card className="p-6 border border-[#E5E7EB] mb-4">
                <div className="flex gap-3 mb-5">
                  <Input
                    placeholder="New county name..."
                    value={newCountyName}
                    onChange={(e) => setNewCountyName(e.target.value)}
                    className="border-[#E5E7EB] max-w-[360px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCountyName.trim()) {
                          countiesStore.addCounty(newCountyName);
                          setNewCountyName("");
                          toast.success("County added");
                        }
                      }
                    }}
                  />
                  <Button
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
                    onClick={() => {
                      if (newCountyName.trim()) {
                        countiesStore.addCounty(newCountyName);
                        setNewCountyName("");
                        toast.success("County added");
                      }
                    }}
                  >
                    + Add County
                  </Button>
                </div>

                <table className="w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <thead className="bg-[#F0F2F5]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#546478]">County Name</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#546478] w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counties.map((county) => (
                      <tr key={county} className="border-t border-[#E5E7EB] hover:bg-[#F5F7FA]">
                        <td className="px-3.5 py-2.5 text-[13px]">
                          {editingCounty === county ? (
                            <Input
                              value={editingCountyValue}
                              onChange={(e) => setEditingCountyValue(e.target.value)}
                              className="border-[#E5E7EB] h-8 text-[13px] max-w-[300px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  countiesStore.renameCounty(county, editingCountyValue);
                                  setEditingCounty(null);
                                  toast.success("County renamed");
                                }
                                if (e.key === "Escape") setEditingCounty(null);
                              }}
                            />
                          ) : (
                            county
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingCounty === county ? (
                              <>
                                <button
                                  onClick={() => {
                                    countiesStore.renameCounty(county, editingCountyValue);
                                    setEditingCounty(null);
                                    toast.success("County renamed");
                                  }}
                                  className="px-2.5 py-1 bg-[#4A6FA5] text-white rounded text-xs font-medium hover:bg-[#3d5a85] transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCounty(null)}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#546478] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingCounty(county); setEditingCountyValue(county); }}
                                  className="px-2.5 py-1 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded text-xs font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => { countiesStore.removeCounty(county); toast.success("County removed"); }}
                                  className="px-2.5 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-xs font-medium hover:bg-[#DC2626] hover:text-white transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {activeSection === "customFields" && (
            <>
              <h1 className="text-[26px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Custom Fields</h1>
              <p className="text-[13px] text-[#546478] mb-5 leading-relaxed max-w-[680px]">
                Configure up to 3 custom fields for each entity. Rename the label, choose the field type, and — for Dropdown fields — define the list of selectable options.
              </p>

              {/* Entity tabs */}
              <div className="flex border-b border-[#E5E7EB] mb-5">
                {(["clients", "jobs", "estimates", "invoices", "items"] as CfEntity[]).map((entity) => (
                  <button
                    key={entity}
                    onClick={() => setCfEntity(entity)}
                    className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors capitalize ${
                      cfEntity === entity
                        ? "border-[#4A6FA5] text-[#4A6FA5]"
                        : "border-transparent text-[#546478] hover:text-[#1A2332]"
                    }`}
                  >
                    {entity.charAt(0).toUpperCase() + entity.slice(1)}
                  </button>
                ))}
              </div>

              <Card className="border border-[#E5E7EB] overflow-hidden mb-4">
                {customFields[cfEntity].map((field, idx) => (
                  <div key={idx} className={idx > 0 ? "border-t border-[#E5E7EB]" : ""}>
                    {/* Field header row */}
                    <div className="px-6 py-4 flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-[11px] font-bold text-[#4A6FA5]">{idx + 1}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap items-start gap-4">
                        <div className="min-w-[260px] flex-1">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#546478] mb-1.5 block">Field Label</label>
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              customFieldsStore.updateField(cfEntity, idx, { label: e.target.value });
                            }}
                            onBlur={() => toast.success("Field label updated")}
                            className="border-[#E5E7EB] h-8 text-[13px]"
                            placeholder="Field label..."
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#546478] mb-1.5 block">Field Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => {
                              customFieldsStore.updateField(cfEntity, idx, { type: e.target.value as import("../stores/customFieldsStore").CfFieldType, options: [] });
                            }}
                            className="h-8 px-2.5 pr-8 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white outline-none focus:border-[#4A6FA5] cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23546478' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 8px center",
                              appearance: "none",
                            }}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="dropdown">Dropdown</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown options panel */}
                    {field.type === "dropdown" && (
                      <div className="px-6 pb-5 pl-16 bg-[#FAFBFC] border-t border-[#EDF0F5]">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#546478] mb-2.5 mt-3.5 block">Dropdown Options</label>
                        {field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {field.options.map((opt, oi) => (
                              <span
                                key={oi}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-md text-[12.5px] text-[#1A2332]"
                              >
                                {opt}
                                <button
                                  onClick={() => {
                                    customFieldsStore.removeOption(cfEntity, idx, opt);
                                  }}
                                  className="text-[#8899AA] hover:text-[#DC2626] transition-colors ml-0.5"
                                >
                                  <span className="material-icons" style={{ fontSize: "13px", lineHeight: 1 }}>close</span>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {field.options.length === 0 && (
                          <p className="text-[12px] text-[#8899AA] mb-3">No options yet. Add the first one below.</p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={cfNewOption[`${cfEntity}-${idx}`] || ""}
                            onChange={(e) => setCfNewOption({ ...cfNewOption, [`${cfEntity}-${idx}`]: e.target.value })}
                            placeholder="New option..."
                            className="border-[#E5E7EB] h-8 text-[13px] max-w-[260px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = (cfNewOption[`${cfEntity}-${idx}`] || "").trim();
                                if (val) {
                                  customFieldsStore.addOption(cfEntity, idx, val);
                                  setCfNewOption({ ...cfNewOption, [`${cfEntity}-${idx}`]: "" });
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const val = (cfNewOption[`${cfEntity}-${idx}`] || "").trim();
                              if (val) {
                                customFieldsStore.addOption(cfEntity, idx, val);
                                setCfNewOption({ ...cfNewOption, [`${cfEntity}-${idx}`]: "" });
                              }
                            }}
                            className="px-3 h-8 bg-[#EBF0F8] text-[#4A6FA5] border border-[#C8D5E8] rounded-md text-[12px] font-medium hover:bg-[#4A6FA5] hover:text-white transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Card>

              <div className="flex justify-end">
                <Button
                  className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
                  onClick={() => toast.success("Custom fields saved")}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}