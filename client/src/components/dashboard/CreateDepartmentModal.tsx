"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Building, Users, Plus } from "lucide-react"
import { config } from "../../config/config"
import { useAuth } from "../../context/AuthContext"

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateDepartmentModal({ isOpen, onClose }: CreateDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    selectedTeams: [] as string[],
  })
  const { user }: { user: any } = useAuth();

  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen])

  const fetchTeams = async () => {
    try {
      // Mock teams data - replace with actual API call
      setTeams([
        { id: "1", name: "Frontend Team", department: "Engineering" },
        { id: "2", name: "Backend Team", department: "Engineering" },
        { id: "3", name: "DevOps Team", department: "Engineering" },
        { id: "4", name: "Content Team", department: "Marketing" },
        { id: "5", name: "SEO Team", department: "Marketing" },
        { id: "6", name: "Sales Team", department: "Sales" },
        { id: "7", name: "Customer Success", department: "Sales" },
      ] as any)
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTeamSelection = (teamId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTeams: prev.selectedTeams.includes(teamId)
        ? prev.selectedTeams.filter((id) => id !== teamId)
        : [...prev.selectedTeams, teamId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter a department name")
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        teamIds: formData.selectedTeams,
        organizationId: user?.organization?.id,
      }

      // API call would go here
      const response = await fetch(`${config.apiUrl}/department`, {
        method: "POST",
        body: JSON.stringify(payload), 
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onClose()
      } else {
        alert("Failed to create department. Please try again.")
      }
    } catch (error) {
      console.error("Error creating department:", error)
      alert("Failed to create department. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Department</h2>
              <p className="text-blue-200 text-sm">Create a new department and assign teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Department Name */}
          <div>
            <label className="block text-white font-medium mb-2">Department Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter department name..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Assign Teams (Optional)</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-60 overflow-y-auto">
              {teams.length === 0 ? (
                <p className="text-blue-200 text-center py-4">No teams available</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team: any) => (
                    <label
                      key={team.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedTeams.includes(team.id)}
                        onChange={() => handleTeamSelection(team.id)}
                        className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-300" />
                          <span className="text-white font-medium">{team.name}</span>
                        </div>
                        <p className="text-blue-200 text-sm">Current: {team.department}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.selectedTeams.length > 0 && (
              <p className="text-blue-200 text-sm mt-2">{formData.selectedTeams.length} team(s) selected</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Creating..." : "Create Department"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
