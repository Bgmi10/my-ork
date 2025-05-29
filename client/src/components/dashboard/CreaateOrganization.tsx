import { useState } from "react";
import { Building, Check, Loader2 } from "lucide-react";
import { config } from "../../config/config";

export default function CreateOrganizationPanel({ user, onOrganizationCreated }: { user: any, onOrganizationCreated: any }) {
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();
    
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${config.apiUrl}/organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: organizationName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        
        // Show success message for 2 seconds then update user
        setTimeout(() => {
          onOrganizationCreated({
            ...user,
            organization: data.data
          });
        }, 2000);
      } else {
        setError(data.message || "Failed to create organization");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className=" backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Organization Created Successfully!
          </h2>
          <p className="text-blue-200 mb-6">
            Welcome to your new organization. Setting up your dashboard...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-blue-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="bg-white/10  backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Create Your Organization
          </h2>
          <p className="text-blue-200">
            To get started, please create your organization. This will be your workspace for managing OKRs.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-white mb-2">
              Organization Name
            </label>
            <input
              type="text"
              id="organizationName"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
                setError(""); // Clear error when user types
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
              placeholder="Enter your organization name"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !organizationName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Organization...</span>
              </>
            ) : (
              <>
                <Building className="w-5 h-5" />
                <span>Create Organization</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-200/70 text-sm">
            Once created, you'll be able to invite team members and start creating OKRs.
          </p>
        </div>
      </div>
    </div>
  );
}