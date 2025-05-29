"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Calendar,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  Loader,
  Save,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { config } from "../../config/config"

interface Team {
  id: string
  name: string
  departmentId: string
  users: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
  objectives?: Objective[]
}

interface Objective {
  id: string
  title: string
  description: string
  progress: number
  status: 'On Track' | 'Behind' | 'At Risk' | 'Complete'
  startDate: string
  endDate: string
  keyResults: KeyResult[]
  assignedTo: {
    id: string
    name: string
    email: string
  }
  teamId: string
  userId: string
}

interface KeyResult {
  id: string
  title: string
  targetValue: number
  currentValue: number
  progress: number
}

export default function TeamOkr({ setActiveSection }: { setActiveSection: (section: string) => void }) {
  const { user }: { user: any } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [objectives, setObjectives] = useState<{ [teamId: string]: Objective[] }>({})
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(null)
  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    progress: 0
  })
  const [keyResultFormData, setKeyResultFormData] = useState({
    title: '',
    targetValue: 0,
    currentValue: 0,
    status: 'NOT_STARTED'
  })

  // Initialize teams from user data
  useEffect(() => {
    if (user?.organization?.departments) {
      const allTeams = user.organization.departments.flatMap((dept: any) => 
        dept.teams.map((team: any) => ({
          ...team,
          departmentName: dept.name
        }))
      )
      setTeams(allTeams)
    } else if (user?.team) {
      setTeams([user.team])
    }
  }, [user])

  // Fetch objectives for a team
  const fetchTeamObjectives = async (teamId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${config.apiUrl}/okrs/team/${teamId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch objectives')
      }

      const data = await response.json()
      setObjectives(prev => ({ ...prev, [teamId]: data.data }))
    } catch (error) {
      console.error("Error fetching objectives:", error)
      setError('Failed to load objectives')
    } finally {
      setLoading(false)
    }
  }

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
      fetchTeamObjectives(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'text-green-400'
      case 'Behind': return 'text-yellow-400'
      case 'At Risk': return 'text-red-400'
      case 'Complete': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective)
    setObjectiveFormData({
      title: objective.title,
      description: objective.description,
      startDate: new Date(objective.startDate).toISOString().split('T')[0],
      endDate: new Date(objective.endDate).toISOString().split('T')[0],
      progress: objective.progress
    })
  }

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditingKeyResult(keyResult)
    setKeyResultFormData({
      title: keyResult.title,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      status: keyResult.progress >= 100 ? 'COMPLETED' : 
             keyResult.progress >= 60 ? 'IN_PROGRESS' :
             keyResult.progress >= 30 ? 'AT_RISK' : 'NOT_STARTED'
    })
  }

  const handleCancelEdit = () => {
    setEditingObjective(null)
    setEditingKeyResult(null)
    setObjectiveFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      progress: 0
    })
    setKeyResultFormData({
      title: '',
      targetValue: 0,
      currentValue: 0,
      status: 'NOT_STARTED'
    })
  }

  const handleSaveObjective = async () => {
    if (!editingObjective) return

    try {
      setLoading(true)
      const response = await fetch(`${config.apiUrl}/okrs/${editingObjective.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(objectiveFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to update objective')
      }

      const data = await response.json()
      const updatedObjective = data.data

      // Update local state
      setObjectives(prev => ({
        ...prev,
        [updatedObjective.teamId]: prev[updatedObjective.teamId].map(obj => 
          obj.id === updatedObjective.id ? updatedObjective : obj
        )
      }))

      setSuccess('Objective updated successfully!')
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating objective:', error)
      setError('Failed to update objective')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKeyResult = async () => {
    if (!editingKeyResult) return

    try {
      setLoading(true)
      const response = await fetch(`${config.apiUrl}/okrs/key-result/${editingKeyResult.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(keyResultFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to update key result')
      }

      const data = await response.json()
      const updatedKeyResult = data.data

      // Update local state
      setObjectives(prev => {
        const updated = {...prev}
        for (const teamId in updated) {
          updated[teamId] = updated[teamId].map(obj => ({
            ...obj,
            keyResults: obj.keyResults.map(kr => 
              kr.id === updatedKeyResult.id ? updatedKeyResult : kr
            )
          }))
        }
        return updated
      })

      setSuccess('Key Result updated successfully!')
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating key result:', error)
      setError('Failed to update key result')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteObjective = async (objective: Objective) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${objective.title}"?`)
    if (!confirmDelete) return

    try {
      setLoading(true)
      const response = await fetch(`${config.apiUrl}/okrs/${objective.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete objective')
      }

      // Update local state
      setObjectives(prev => ({
        ...prev,
        [objective.teamId]: prev[objective.teamId].filter(obj => obj.id !== objective.id)
      }))

      setSuccess('Objective deleted successfully!')
    } catch (error) {
      console.error('Error deleting objective:', error)
      setError('Failed to delete objective')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKeyResult = async (keyResultId: string, teamId: string, objectiveId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this key result?')
    if (!confirmDelete) return

    try {
      setLoading(true)
      const response = await fetch(`${config.apiUrl}/okrs/key-result/${keyResultId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete key result')
      }

      // Update local state
      setObjectives(prev => ({
        ...prev,
        [teamId]: prev[teamId].map(obj => 
          obj.id === objectiveId
            ? {
                ...obj,
                keyResults: obj.keyResults.filter(kr => kr.id !== keyResultId)
              }
            : obj
        )
      }))

      setSuccess('Key Result deleted successfully!')
    } catch (error) {
      console.error('Error deleting key result:', error)
      setError('Failed to delete key result')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const userTeamId = user?.team?.id

  const filteredTeams = isAdmin ? teams : teams.filter(team => team.id === userTeamId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Team OKRs</h1>
              <p className="text-blue-200">Q2 2025 (Apr - Jun)</p>
            </div>
          </div>
          
          {isAdmin && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300" onClick={() => setActiveSection('create-okr')}>
              <Plus className="w-4 h-4" />
              <span>Create Objective</span>
            </button>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Teams List */}
        <div className="space-y-4">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-gray-800/50 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
              {/* Team Header */}
              <div 
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleTeamExpansion(team.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-blue-200 text-sm">
                      {team.users.length} members | {team.objectives?.length || 0} objectives
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {expandedTeams.has(team.id) ? (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  )}
                </div>
              </div>

              {/* Expanded Team Content */}
              {expandedTeams.has(team.id) && (
                <div className="border-t border-white/10">
                  {/* Team Members */}
                  <div className="p-6 border-b border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-4">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team.users.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{member.name}</div>
                            <div className="text-blue-200 text-sm">{member.email}</div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Team Objectives</h4>
                      {isAdmin && (
                        <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all" onClick={() => setActiveSection('create-okr ')}>
                          <Plus className="w-4 h-4" />
                          <span>Add Objective</span>
                        </button>
                      )}
                    </div>  

                    {loading ? (
                      <div className="text-center py-8">
                        <Loader className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                        <div className="text-blue-200 mt-2">Loading objectives...</div>
                      </div>
                    ) : objectives[team.id]?.length > 0 ? (
                      <div className="space-y-4">
                        {objectives[team.id].map((objective) => (
                          <div key={objective.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            {editingObjective?.id === objective.id ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-1">Title</label>
                                    <input
                                      type="text"
                                      value={objectiveFormData.title}
                                      onChange={(e) => setObjectiveFormData({...objectiveFormData, title: e.target.value})}
                                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-1">Progress</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={objectiveFormData.progress}
                                      onChange={(e) => setObjectiveFormData({...objectiveFormData, progress: Number(e.target.value)})}
                                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-blue-200 mb-1">Description</label>
                                  <textarea
                                    value={objectiveFormData.description}
                                    onChange={(e) => setObjectiveFormData({...objectiveFormData, description: e.target.value})}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-1">Start Date</label>
                                    <input
                                      type="date"
                                      value={objectiveFormData.startDate}
                                      onChange={(e) => setObjectiveFormData({...objectiveFormData, startDate: e.target.value})}
                                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-1">End Date</label>
                                    <input
                                      type="date"
                                      value={objectiveFormData.endDate}
                                      onChange={(e) => setObjectiveFormData({...objectiveFormData, endDate: e.target.value})}
                                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveObjective}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                    {loading ? (
                                      <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="text-white font-semibold mb-1">{objective.title}</h5>
                                    <p className="text-blue-200 text-sm mb-2">{objective.description}</p>
                                    <div className="flex items-center space-x-4 text-sm">
                                      <span className="flex items-center space-x-1">
                                        <Calendar className="w-4 h-4 text-blue-300" />
                                        <span className="text-blue-200">
                                          {new Date(objective.startDate).toLocaleDateString()} - 
                                          {new Date(objective.endDate).toLocaleDateString()}
                                        </span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <User className="w-4 h-4 text-blue-300" />
                                        <span className="text-blue-200">{objective.assignedTo?.name || 'Unassigned'}</span>
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-white">{objective.progress}%</div>
                                      <div className={`text-sm ${getStatusColor(objective.status)}`}>
                                        {objective.status}
                                      </div>
                                    </div>
                                    {(isAdmin || objective.userId === user?.id) && (
                                      <div className="flex items-center space-x-2">
                                        <button 
                                          onClick={() => handleEditObjective(objective)}
                                          disabled={loading}
                                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteObjective(objective)}
                                          disabled={loading}
                                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-blue-200">Progress</span>
                                    <span className="text-sm text-white font-medium">{objective.progress}%</span>
                                  </div>
                                  <div className="w-full bg-white/10 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${getProgressColor(objective.progress)}`}
                                      style={{ width: `${objective.progress}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Key Results */}
                                <div>
                                  <h6 className="text-white font-medium mb-2">Key Results</h6>
                                  <div className="space-y-2">
                                    {objective.keyResults.map((kr) => (
                                      <div key={kr.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        {editingKeyResult?.id === kr.id ? (
                                          <div className="w-full space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs text-blue-200 mb-1">Title</label>
                                                <input
                                                  type="text"
                                                  value={keyResultFormData.title}
                                                  onChange={(e) => setKeyResultFormData({...keyResultFormData, title: e.target.value})}
                                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs text-blue-200 mb-1">Status</label>
                                                <select
                                                  value={keyResultFormData.status}
                                                  onChange={(e) => setKeyResultFormData({...keyResultFormData, status: e.target.value})}
                                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-black text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                  <option value="NOT_STARTED">Not Started</option>
                                                  <option value="IN_PROGRESS">In Progress</option>
                                                  <option value="COMPLETED">Completed</option>
                                                </select>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs text-blue-200 mb-1">Current Value</label>
                                                <input
                                                  type="number"
                                                  value={keyResultFormData.currentValue}
                                                  onChange={(e) => setKeyResultFormData({...keyResultFormData, currentValue: Number(e.target.value)})}
                                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs text-blue-200 mb-1">Target Value</label>
                                                <input
                                                  type="number"
                                                  value={keyResultFormData.targetValue}
                                                  onChange={(e) => setKeyResultFormData({...keyResultFormData, targetValue: Number(e.target.value)})}
                                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                              <button
                                                onClick={handleCancelEdit}
                                                className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                onClick={handleSaveKeyResult}
                                                disabled={loading}
                                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                              >
                                                {loading ? 'Saving...' : 'Save'}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex-1">
                                              <div className="text-white text-sm font-medium">{kr.title}</div>
                                              <div className="text-blue-200 text-xs">
                                                {kr.currentValue} / {kr.targetValue}
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                              <div className="text-right">
                                                <div className="text-white font-semibold text-sm">{kr.progress}%</div>
                                                <div className="w-16 bg-white/10 rounded-full h-1 mt-1">
                                                  <div 
                                                    className={`h-1 rounded-full ${getProgressColor(kr.progress)}`}
                                                    style={{ width: `${kr.progress}%` }}
                                                  />
                                                </div>
                                              </div>
                                              {(isAdmin || objective.userId === user?.id) && (
                                                <div className="flex space-x-1">
                                                  <button 
                                                    onClick={() => handleEditKeyResult(kr)}
                                                    disabled={loading}
                                                    className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                  >
                                                    <Edit2 className="w-3 h-3" />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleDeleteKeyResult(kr.id, objective.teamId, objective.id)}
                                                    disabled={loading}
                                                    className="p-1 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <div className="text-blue-200 mb-2">No objectives yet</div>
                        <div className="text-blue-200/60 text-sm">Create your first objective to get started</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <Building className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <div className="text-white text-xl mb-2">No teams found</div>
            <div className="text-blue-200">You don't have access to any teams yet.</div>
          </div>
        )}
      </div>
    </div>
  )
}