import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";

export function CreateProperty() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-6">
          <h1 className="text-[26px] text-[#1A2332]" style={{ fontWeight: 700 }}>
            Create Property
          </h1>
        </div>

        <div className="bg-white p-8">
          <p className="text-[14px] text-[#6B7280] mb-6">
            Property creation page - coming soon.
          </p>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
