import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Job {
  id?: string;
  client: string;
  title: string;
  status: string;
  priority: string;
  date: string;
  description?: string;
  estimatedHours?: number;
  assignedTo?: string;
}

interface JobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  onSave: (job: Job) => void;
}

export function JobForm({ open, onOpenChange, job, onSave }: JobFormProps) {
  const [formData, setFormData] = useState<Job>({
    id: job?.id || "",
    client: job?.client || "",
    title: job?.title || "",
    status: job?.status || "scheduled",
    priority: job?.priority || "medium",
    date: job?.date || new Date().toISOString().split('T')[0],
    description: job?.description || "",
    estimatedHours: job?.estimatedHours || 0,
    assignedTo: job?.assignedTo || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof Job, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ fontWeight: 600, color: "#1A2332" }}>
            {job ? "Edit Job" : "Create Job"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Client Name */}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ fontWeight: 500 }}>
              Client Name <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g., John Smith"
              value={formData.client}
              onChange={(e) => handleChange("client", e.target.value)}
              className="border-[#DDE3EE]"
              required
            />
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ fontWeight: 500 }}>
              Job Title <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g., Kitchen Renovation"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="border-[#DDE3EE]"
              required
            />
          </div>

          {/* Date and Assigned To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ fontWeight: 500 }}>
                Scheduled Date <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="border-[#DDE3EE]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm" style={{ fontWeight: 500 }}>
                Assigned To
              </Label>
              <Input
                type="text"
                placeholder="e.g., Mike Johnson"
                value={formData.assignedTo}
                onChange={(e) => handleChange("assignedTo", e.target.value)}
                className="border-[#DDE3EE]"
              />
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ fontWeight: 500 }}>
                Priority <span className="text-[#DC2626]">*</span>
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="border-[#DDE3EE]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm" style={{ fontWeight: 500 }}>
                Status <span className="text-[#DC2626]">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="border-[#DDE3EE]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ fontWeight: 500 }}>
              Estimated Hours
            </Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={formData.estimatedHours}
              onChange={(e) => handleChange("estimatedHours", parseFloat(e.target.value) || 0)}
              className="border-[#DDE3EE]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ fontWeight: 500 }}>
              Description
            </Label>
            <Textarea
              placeholder="Enter job details and requirements..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="border-[#DDE3EE] min-h-[100px]"
            />
            <p className="text-xs text-[#546478]">
              Provide details about the work to be performed
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#DDE3EE] text-[#546478] hover:bg-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4A6FA5] hover:bg-[#3d5a85]"
            >
              {job ? "Update Job" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
