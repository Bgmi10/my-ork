"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Plus,
  Target,
  Users,
  Building,
  Menu,
  ChevronDown,
  HomeIcon,
  Briefcase,
  ChevronUp,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import Sidebar from "./Sidebar"
import Dashboard from "./Dashboard"
import CreateOKRForm from "./CreateOKRForm"
import InviteUserModal from "./InviteUserModal"
import CreateTeamModal from "./CreateTeamModal"
import CreateDepartmentModal from "./CreateDepartmentModal"
import Profile from "./Profile"
import CreateOrganizationPanel from "./CreaateOrganization"
import MyOkr from "./MyOkr"
import TeamOkr from "./TeamOkr"
import Department from "./Department"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState("dashboard")
  const userMenuRef = useRef(null)
  const { user, handleLogout }: { user: any; handleLogout: () => void } = useAuth()
  const [showCreateOrganizationPanel, setShowCreateOrganizationPanel] = useState(false);
  
  useEffect(() => {
    if (user.organization || user.role === "MEMBER") {
        setShowCreateOrganizationPanel(false);
    } else {
        setShowCreateOrganizationPanel(true);
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      //@ts-ignore
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (showCreateOrganizationPanel) {
    return <CreateOrganizationPanel user={user} onOrganizationCreated={() => setShowCreateOrganizationPanel(false)} />
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon, active: true },
    { id: "create", label: "Create", icon: Plus, badge: "New" },
    { id: "company-okrs", label: "Company OKRs", icon: Building },
    { id: "team-okrs", label: "Team OKRs", icon: Users },
    { id: "my-okrs", label: "My OKRs", icon: Target },
    { id: "departments", label: "Departments", icon: Briefcase, isAdmin: true },
    { id: "profile", label: "Profile", icon: User },
  ]

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard user={user} setActiveSection={setActiveSection} />
      case "create-okr":
        return <CreateOKRForm user={user} onBack={() => setActiveSection("dashboard")} />
      case "create-user":
        return <InviteUserModal isOpen={true} onClose={() => setActiveSection("dashboard")} />
      case "create-team":
        return <CreateTeamModal isOpen={true} onClose={() => setActiveSection("dashboard")} />
      case "create-department":
        return <CreateDepartmentModal isOpen={true} onClose={() => setActiveSection("dashboard")} />
      case "profile":
        return <Profile />
      case "my-okrs":
        return <MyOkr setActiveSection={setActiveSection} />
      case "team-okrs":
        return <TeamOkr setActiveSection={setActiveSection} />
      case "departments":
        return <Department />
      default:
        return <Dashboard user={user} setActiveSection={setActiveSection} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Decorative Background SVGs */}
      <svg
        className="absolute top-1/4 left-1/4 w-20 h-20 text-blue-500/15 animate-float z-0"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 20C6.20914 20 8 18.2091 8 16C8 13.7909 6.20914 12 4 12C1.79086 12 0 13.7909 0 16C0 18.2091 1.79086 20 4 20Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M20 20C22.2091 20 24 18.2091 24 16C24 13.7909 22.2091 12 20 12C17.7909 12 16 13.7909 16 16C16 18.2091 17.7909 20 20 20Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="absolute bottom-1/3 right-1/3 w-24 h-24 text-indigo-400/10 animate-float animation-delay-2000"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M22 12H18M6 12H2M12 6V2M12 22V18M7.8 7.8L4.6 4.6M16.2 7.8L19.4 4.6M16.2 16.2L19.4 19.4M7.8 16.2L4.6 19.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute top-32 right-32 w-16 h-16 text-blue-400/15 animate-float animation-delay-1000"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M8 12L12 8L16 12M12 16V8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarItems={sidebarItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 lg:px-6 py-4 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white/70 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search Bar */}
              <div className="relative group hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-200 " />
                <input
                  type="text"
                  placeholder="Search OKRs, teams, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 lg:w-80 pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 cursor-pointer text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:block font-medium text-white">{user.name}</span>
                  {userMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 bg-gray-800 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl py-2 z-50"
                    style={{ position: "absolute", zIndex: "9999px" }}
                  >
                    <div className="px-4 py-3 border-b border-white/20">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-blue-200 text-sm line-clamp-1">{user.email}</p>
                      <p className="text-blue-300 text-xs mt-1">{user.role === 'ADMIN' ? 'Admin' : 'Member'}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full  cursor-pointer flex items-center space-x-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors" onClick={() =>{
                        setUserMenuOpen(false);
                        setActiveSection("profile")
                        }}>
                        <User className="w-4 h-4" />
                        <span>My Account</span>
                      </button>
                      <button className="w-full  cursor-pointer flex items-center space-x-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-2 border-white/20" />
                      <button
                        onClick={handleLogout}
                        className="w-full  cursor-pointer flex items-center space-x-3 px-4 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {renderActiveSection()}
      </div>

      <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animation-delay-1000 {
                    animation-delay: 1s;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-3000 {
                    animation-delay: 3s;
                }
            `}</style>
    </div>
  )
}
