import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";

export function CreateEvent() {
  const navigate = useNavigate();
  const [date, setDate] = useState("2026-01-15");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("2 hours");
  const [endTime, setEndTime] = useState("11:00");
  const [eventType, setEventType] = useState("Initial Consultation");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("Marek Stroz (Me)");
  const [notify, setNotify] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState(
    "Your appointment is scheduled for Monday, January 15 at 9:00 AM. We look forward to seeing you!"
  );

  const handleSave = () => {
    navigate(-1);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#DDE3EE] px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back to Job
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="outline">Save Draft</Button>
          <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85]" onClick={handleSave}>
            Save & Notify Client
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#F5F7FA] p-6">
        <h1 className="text-3xl mb-6" style={{ fontWeight: 700, color: "#1A2332" }}>
          Schedule Event
        </h1>

        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date & Time */}
            <Card className="p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: "#1A2332" }}>
                Date & Time
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Date <span className="text-[#DC2626]">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-[#DDE3EE]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Start Time <span className="text-[#DC2626]">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border-[#DDE3EE]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Duration
                  </Label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE3EE] rounded-md"
                  >
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    End Time
                  </Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border-[#DDE3EE]"
                    readOnly
                  />
                </div>
              </div>
            </Card>

            {/* Event Details */}
            <Card className="p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: "#1A2332" }}>
                Event Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Event Type
                  </Label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE3EE] rounded-md"
                  >
                    <option>Initial Consultation</option>
                    <option>Service Call</option>
                    <option>Installation</option>
                    <option>Follow-up Visit</option>
                    <option>Inspection</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Custom Title (optional)
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g., Install new water heater"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="border-[#DDE3EE]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ fontWeight: 500 }}>
                    Description (optional)
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Add notes about this visit..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-[#DDE3EE]"
                  />
                </div>
              </div>
            </Card>

            {/* Assignment */}
            <Card className="p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: "#1A2332" }}>
                Assignment
              </h3>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ fontWeight: 500 }}>
                  Assign to
                </Label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE3EE] rounded-md"
                >
                  <option>Marek Stroz (Me)</option>
                </select>
                <p className="text-xs text-[#546478]">
                  Unlock Employee Management to assign to team members
                </p>
              </div>
            </Card>

            {/* Client Notification */}
            <Card className="p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: "#1A2332" }}>
                Client Notification
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id="notify"
                  checked={notify}
                  onCheckedChange={(checked) => setNotify(checked as boolean)}
                />
                <Label htmlFor="notify" className="text-sm cursor-pointer" style={{ fontWeight: 500 }}>
                  Send appointment notification to client
                </Label>
              </div>
              {notify && (
                <div className="bg-[#F5F7FA] rounded-md p-4 space-y-4">
                  <div>
                    <div className="text-sm text-[#546478] mb-2">
                      John Smith will receive a notification at:
                    </div>
                    <div className="text-sm">📧 john.smith@email.com</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm" style={{ fontWeight: 500 }}>
                      Message
                    </Label>
                    <Textarea
                      rows={3}
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="border-[#DDE3EE]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reminder"
                      checked={reminder}
                      onCheckedChange={(checked) => setReminder(checked as boolean)}
                    />
                    <Label htmlFor="reminder" className="text-sm cursor-pointer">
                      Send reminder 24 hours before
                    </Label>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: "#1A2332" }}>
                Event Preview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#546478] mb-1">Date & Time</div>
                  <div style={{ fontWeight: 600, color: "#1A2332" }}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-[#546478]">
                    {startTime} - {endTime}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#546478] mb-1">Event Type</div>
                  <div style={{ fontWeight: 600, color: "#1A2332" }}>{eventType}</div>
                </div>
                {customTitle && (
                  <div>
                    <div className="text-sm text-[#546478] mb-1">Custom Title</div>
                    <div style={{ fontWeight: 600, color: "#1A2332" }}>{customTitle}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-[#546478] mb-1">Assigned To</div>
                  <div style={{ fontWeight: 600, color: "#1A2332" }}>{assignee}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
