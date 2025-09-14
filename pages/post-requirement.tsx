import { useLocation } from "wouter";
import RequirementForm from "@/components/requirement/requirement-form";

export default function PostRequirement() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/profile");
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Post Your Requirement</h1>
        <p className="text-gray-600">Let property owners know what you're looking for</p>
      </div>

      <RequirementForm onSuccess={handleSuccess} />
    </div>
  );
}