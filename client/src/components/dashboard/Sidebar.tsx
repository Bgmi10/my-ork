"use client"

import { useState, useRef, useEffect } from "react"
import { Target, User, ChevronDown, ChevronRight, Plus, Users, Building } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarItems,
  activeSection,
  setActiveSection,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (sidebarOpen: boolean) => void
  sidebarItems: any[]
  activeSection: string
  setActiveSection: (activeSection: string) => void
}) {
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user }: { user: any } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      //@ts-ignore
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCreateDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const createOptions = [
    { id: "create-okr", label: "Create OKR", icon: Target, color: "from-blue-600 to-indigo-600", onlyAdmin: false },
    { id: "create-user", label: "Invite User", icon: User, color: "from-green-600 to-emerald-600", onlyAdmin: false },
    { id: "create-team", label: "Create Team", icon: Users, color: "from-purple-600 to-pink-600", onlyAdmin: true },
    { id: "create-department", label: "Create Department", icon: Building, color: "from-orange-600 to-red-600", onlyAdmin: true },
  ]

  const handleCreateOptionClick = (optionId: string) => {
    setActiveSection(optionId)
    setCreateDropdownOpen(false)
    setSidebarOpen(false)
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 transform transition-transform duration-300 z-50 overflow-y-auto ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex flex-col items-start gap-4 justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">My OKR</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-white/70 hover:text-white hover:bg-white/10 px-2 py-1 rounded-full font-medium flex items-center gap-2"><Building className="w-4 h-4" /> {user?.role === "ADMIN" ? user?.organization?.name : user?.team?.department?.organization?.name}</span>
        </div>
      </div>

      <nav className="p-4 space-y-2"> 
        {sidebarItems.filter((item) => item.isAdmin ? user?.role === "ADMIN" : true).map((item)  => {
          // Handle the create item specially
          if (item.id === "create") {
            return (
              <div key={item.id} className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                    createDropdownOpen || activeSection.startsWith("create-")
                      ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium flex-1">Create</span>
                  {item.badge && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                  {createDropdownOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {createDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-full bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 z-[9999]">
                    {createOptions.filter((option) => option.onlyAdmin ? user?.role === "ADMIN" : true).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleCreateOptionClick(option.id)}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                      >
                        <div
                          className={`w-8 h-8 bg-gradient-to-br ${option.color} rounded-lg flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
                        >
                          <option.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label} </span>
              {item.badge && (
                <span className="ml-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="bottom-0 left-0 right-0 p-4 border-t border-white/20">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{user?.name}</p>
              <p className="text-blue-200 text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-white/20">
        <span className="text-white/70 text-xs">Developed by Subash</span>
      </div>
    </div>
  )
}
