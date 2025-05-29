import { useState, useEffect } from "react";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { config } from "../config/config";

export default function AcceptInvite() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    if (inviteToken) {
      setToken(inviteToken);
    } else {
      setError("Invalid invitation link");
    }
  }, []);

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!token) {
      setError("Invalid invitation token");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${config.apiUrl}/invite/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          token: token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        
        // Show success message for 3 seconds then redirect to auth page
        setTimeout(() => {
          window.location.href = "/auth";
        }, 3000);
      } else {
        setError(data.message || "Failed to accept invitation");
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
        <div className="backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Account Created Successfully!
          </h2>
          <p className="text-blue-200 mb-6">
            Your account has been created and the invitation has been accepted. You can now login to access your team.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-blue-300">Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Accept Team Invitation
          </h2>
          <p className="text-blue-200">
            You've been invited to join a team. Please enter your name to complete your account setup.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(""); // Clear error when user types
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
              placeholder="Enter your full name"
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
            disabled={isLoading || !name.trim() || !token}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Accepting Invitation...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Accept Invitation</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-200/70 text-sm">
            Once accepted, you'll be able to login and collaborate with your team members.
          </p>
        </div>
      </div>
    </div>
  );
}