"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Plus, Target, Trash2, Lightbulb, LightbulbOff } from "lucide-react"
import { useDebounce } from "../../hooks/use-debounce"
import { config } from "../../config/config"

interface KeyResult {
  id?: string
  title: string
  targetValue: number
  currentValue: number
}

interface CreateOKRFormProps {
  user: any
  onBack: () => void
}

interface AISuggestion {
  text: string
  field: string
  index?: number
}

export default function CreateOKRForm({ user, onBack }: CreateOKRFormProps) {
 
  const [keyResults, setKeyResults] = useState<KeyResult[]>([{ title: "", targetValue: 0, currentValue: 0 }])
  const [loading, setLoading] = useState(false)
  //@ts-ignore
  const [teams, setTeams] = useState(
   user.role === "ADMIN" ? user.departments?.flatMap((department: any) => department.teams) || [] : user?.team || []
  ) 
  //@ts-ignore
  const [users, setUsers] = useState(user.role === "ADMIN" ? user?.organization?.departments?.flatMap((department: any) => department?.teams?.flatMap((team: any) => team?.users)) || [] : [...user?.team?.users, user?.team?.department?.organization?.user] || []);

  console.log(users)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    teamId: "",
    userId: "",
  })

  // AI suggestion states
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  // Refs for input elements to position suggestions
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const keyResultRefs = useRef<(HTMLInputElement | null)[]>([])
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Debounced values for API calls
  const debouncedTitle = useDebounce(formData.title, 500)
  const debouncedDescription = useDebounce(formData.description, 500)
  const debouncedKeyResults = useDebounce(keyResults, 500)

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Track active field for suggestions
    setActiveField(name)
    setActiveIndex(null)
  }

  const handleKeyResultChange = (index: number, field: keyof KeyResult, value: string | number) => {
    setKeyResults((prev) => prev.map((kr, i) => (i === index ? { ...kr, [field]: value } : kr)))

    if (field === "title") {
      setActiveField("keyResultTitle")
      setActiveIndex(index)
    }
  }

  // Handle key press for accepting suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && aiSuggestion && aiEnabled) {
      e.preventDefault()

      if (aiSuggestion.field === "title") {
        setFormData((prev) => ({ ...prev, title: aiSuggestion.text }))
      } else if (aiSuggestion.field === "description") {
        setFormData((prev) => ({ ...prev, description: aiSuggestion.text }))
      } else if (aiSuggestion.field === "keyResultTitle" && aiSuggestion.index !== undefined) {
        setKeyResults((prev) =>
          prev.map((kr, i) => (i === aiSuggestion.index ? { ...kr, title: aiSuggestion.text } : kr)),
        )
      }

      setAiSuggestion(null)
    }
  }

  // Fetch AI suggestions based on active field
  useEffect(() => {
    if (!aiEnabled) return

    const fetchSuggestions = async () => {
      if (activeField === "title" && debouncedTitle.length > 3) {
        setIsFetchingSuggestion(true)
        try {
          const response = await fetch( config.apiUrl + "/ai/generate-okr-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              field: "title",
              text: debouncedTitle,
              context: { description: formData.description, keyResults },
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setAiSuggestion({ field: "title", text: data.suggestion })
          }
        } catch (error) {
          console.error("Error fetching AI suggestions:", error)
        } finally {
          setIsFetchingSuggestion(false)
        }
      } else if (activeField === "description" && debouncedDescription.length > 5) {
        setIsFetchingSuggestion(true)
        try {
          const response = await fetch( config.apiUrl + "/ai/generate-okr-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              field: "description",
              text: debouncedDescription,
              context: { title: formData.title, keyResults },
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setAiSuggestion({ field: "description", text: data.suggestion })
          }
        } catch (error) {
          console.error("Error fetching AI suggestions:", error)
        } finally {
          setIsFetchingSuggestion(false)
        }
      } else if (activeField === "keyResultTitle" && activeIndex !== null) {
        const currentKeyResult = debouncedKeyResults[activeIndex]
        if (currentKeyResult?.title && currentKeyResult.title.length > 3) {
          setIsFetchingSuggestion(true)
          try {
            const response = await fetch( config.apiUrl + "/ai/generate-okr-suggestion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                field: "keyResultTitle",
                text: currentKeyResult.title,
                context: {
                  title: formData.title,
                  description: formData.description,
                  keyResults: debouncedKeyResults,
                  currentIndex: activeIndex,
                },
              }),
            })

            if (response.ok) {
              const data = await response.json()
              setAiSuggestion({
                field: "keyResultTitle",
                text: data.suggestion,
                index: activeIndex,
              })
            }
          } catch (error) {
            console.error("Error fetching AI suggestions:", error)
          } finally {
            setIsFetchingSuggestion(false)
          }
        }
      }
    }

    fetchSuggestions()
  }, [debouncedTitle, debouncedDescription, debouncedKeyResults, activeField, activeIndex, aiEnabled])

  // Clear suggestion when changing fields
  useEffect(() => {
    setAiSuggestion(null)
  }, [activeField, activeIndex])

  const addKeyResult = () => {
    setKeyResults((prev) => [...prev, { title: "", targetValue: 0, currentValue: 0 }])
    // Update refs array size
    keyResultRefs.current = keyResultRefs.current.slice(0, keyResults.length + 1)
  }

  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults((prev) => prev.filter((_, i) => i !== index))
      // Update refs array
      keyResultRefs.current = keyResultRefs.current.filter((_, i) => i !== index)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        keyResults: keyResults.filter((kr) => kr.title.trim() !== ""),
      }

      const response = await fetch(config.apiUrl + "/okrs/create",{
        method: "POST",
        credentials: "include",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 201) {
        alert("OKR created successfully!")
        onBack()
      } else {
        alert("Failed to create OKR. Please try again.")
      }
    } catch (error) {
      console.error("Error creating OKR:", error)
      alert("Failed to create OKR. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Render AI suggestion overlay
  const renderSuggestion = () => {
    if (!aiEnabled || !aiSuggestion) return null

    let targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement> | null = null

    if (aiSuggestion.field === "title") {
      //@ts-ignore  
      targetRef = titleInputRef
    } else if (aiSuggestion.field === "description") {
      //@ts-ignore
      targetRef = descriptionInputRef
    } else if (aiSuggestion.field === "keyResultTitle" && aiSuggestion.index !== undefined) {
      //@ts-ignore
      targetRef = { current: keyResultRefs.current[aiSuggestion.index] }
    }

    if (!targetRef?.current) return null

    const currentValue =
      aiSuggestion?.field === "title"
        ? formData.title
        : aiSuggestion?.field === "description"
          ? formData.description
          : aiSuggestion?.index !== undefined
            ? keyResults[aiSuggestion.index].title
            : ""

    const suggestionText = aiSuggestion?.text?.startsWith(currentValue)
      ? aiSuggestion?.text?.slice(currentValue.length)
      : aiSuggestion?.text

    if (!suggestionText) return null

    return (
      <div className="absolute left-0 right-0 pointer-events-none text-gray-400 flex items-center px-4 py-3">
        <span className="invisible">{currentValue}</span>
        <span>{suggestionText}</span>
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 lg:p-6 z-30">
      <div className="max-w-4xl mx-auto">
        {/* Header with AI Toggle */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white">Create New OKR</h2>
                  <p className="text-blue-200">Define your objectives and key results</p>
                </div>
              </div>

              <div className="relative">
                <div 
                  className="flex items-center space-x-2 cursor-pointer"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={() => setAiEnabled(!aiEnabled)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`flex items-center space-x-1 ${aiEnabled ? 'text-white' : 'text-gray-400'}`}>
                    {aiEnabled ? (
                      <>
                        <Lightbulb className="w-4 h-4 text-blue-300" />
                        <span>AI Suggestions</span>
                      </>
                    ) : (
                      <>
                        <LightbulbOff className="w-4 h-4" />
                        <span>AI Disabled</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Custom Tooltip */}
                {showTooltip && (
                  <div 
                    ref={tooltipRef}
                    className="absolute z-50 w-48 p-2 mt-2 text-sm text-white bg-gray-800 rounded-md shadow-lg right-0"
                  >
                    <p>Toggle AI-powered suggestions as you type</p>
                    <p className="text-xs text-gray-400 mt-1">Press Tab to accept suggestions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-white font-medium mb-2">Objective Title</label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    ref={titleInputRef}
                    value={formData.title}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setActiveField("title")
                      setActiveIndex(null)
                    }}
                    placeholder="Enter your objective title..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {aiEnabled && activeField === "title" && aiSuggestion?.field === "title" && renderSuggestion()}
                  {aiEnabled && isFetchingSuggestion && activeField === "title" && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-pulse">
                        <Lightbulb className="w-4 h-4 text-blue-300" />
                      </div>
                    </div>
                  )}
                </div>
                {aiEnabled && <p className="text-xs text-blue-300 mt-1">Press Tab to accept AI suggestions</p>}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-white font-medium mb-2">Description</label>
                <div className="relative">
                  <textarea
                    name="description"
                    ref={descriptionInputRef}
                    value={formData.description}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setActiveField("description")
                      setActiveIndex(null)
                    }}
                    placeholder="Describe your objective in detail..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {aiEnabled &&
                    activeField === "description" &&
                    aiSuggestion?.field === "description" &&
                    renderSuggestion()}
                  {aiEnabled && isFetchingSuggestion && activeField === "description" && (
                    <div className="absolute right-3 top-6">
                      <div className="animate-pulse">
                        <Lightbulb className="w-4 h-4 text-blue-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Team Selection */}
           <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Team Selection</h3>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Select Team</label>
                <select
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>
                    Select a team
                  </option>
                  { user.role === "ADMIN" ? teams?.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  )) : <option value={teams.id}>{teams.name}</option>}
                </select>
              </div>
            </div>
          </div>

          {/* Level and Assignment */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Assignment & Timeline</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                   <label htmlFor="userId" className="block text-white font-medium mb-2">Assign to</label>
                   <select name="userId" value={formData.userId} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select a user</option>
                    {user.role === "ADMIN" ? users?.map((user: any) => (
                      <option key={user.id} value={user.id} className="text-black">{user.name}</option>
                    )) : users?.map((user: any) => (
                      <option key={user.id} value={user.id}>{user.name} {user.role === "ADMIN" ? "(Admin)" : "(Member)"}</option>
                    ))}
                   </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Key Results */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Key Results</h3>
              <button
                type="button"
                onClick={addKeyResult}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key Result</span>
              </button>
            </div>

            <div className="space-y-4">
              {keyResults.map((kr, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Key Result {index + 1}</h4>
                    {keyResults.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyResult(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                      <label className="block text-white/70 text-sm mb-2">Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={kr.title}
                          //@ts-ignore
                          ref={(el) => (keyResultRefs.current[index] = el)}
                          onChange={(e) => handleKeyResultChange(index, "title", e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => {
                            setActiveField("keyResultTitle")
                            setActiveIndex(index)
                          }}
                          placeholder="Key result title..."
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {aiEnabled &&
                          activeField === "keyResultTitle" &&
                          activeIndex === index &&
                          aiSuggestion?.field === "keyResultTitle" &&
                          aiSuggestion.index === index &&
                          renderSuggestion()}
                        {aiEnabled &&
                          isFetchingSuggestion &&
                          activeField === "keyResultTitle" &&
                          activeIndex === index && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-pulse">
                                <Lightbulb className="w-4 h-4 text-blue-300" />
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Target Value</label>
                      <input
                        type="number"
                        value={kr.targetValue}
                        onChange={(e) =>
                          handleKeyResultChange(index, "targetValue", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="100"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Current Value</label>
                      <input
                        type="number"
                        value={kr.currentValue}
                        onChange={(e) =>
                          handleKeyResultChange(index, "currentValue", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Creating..." : "Create OKR"}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
