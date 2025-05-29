"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Mail, Send, UserPlus, AlertCircle, CheckCircle, Search } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { config } from "../../config/config"

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
}

interface EmailValidationStatus {
  email: string
  status: 'unchecked' | 'valid' | 'invalid' | 'exists'
  message?: string
}

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    teamId: "",
    emails: "",
    message: "I am inviting you to MyOKR, OKR management tool, where you can add, create, manage, and track your OKRs.",
  })
  const { user }: { user: any } = useAuth();
  //@ts-ignore
  const [teams, setTeams] = useState( user?.role === "ADMIN" ? user?.organization?.departments?.flatMap(department => department.teams) || [] : user?.team);
  console.log(teams)
  
  const [loading, setLoading] = useState(false)
  const [emailList, setEmailList] = useState<string[]>([])
  const [emailValidationStatuses, setEmailValidationStatuses] = useState<EmailValidationStatus[]>([])
  const [validatingEmails, setValidatingEmails] = useState(false)
  const [emailsChecked, setEmailsChecked] = useState(false)

  useEffect(() => {
    // Parse emails
    const emails = formData.emails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
    setEmailList(emails)
    
    // Reset validation statuses when emails change
    if (emails.length > 0) {
      setEmailValidationStatuses(emails.map(email => ({
        email,
        status: 'unchecked'
      })))
      setEmailsChecked(false)
    } else {
      setEmailValidationStatuses([])
      setEmailsChecked(false)
    }
  }, [formData.emails])

  const validateEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCheckEmails = async () => {
    if (emailList.length === 0) return
    
    setValidatingEmails(true)
    
    try {
      const validationPromises = emailList.map(async (email) => {
        // First check email format
        if (!validateEmailFormat(email)) {
          return {
            email,
            status: 'invalid' as const,
            message: 'Invalid email format'
          }
        }

        try {
          // Check if user exists in system
          const response = await fetch(`${config.apiUrl}/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email })
          })

          if (response.status === 404) {
            // User doesn't exist - this is good for invitation
            return {
              email,
              status: 'valid' as const,
              message: 'Ready to invite'
            }
          } else if (response.status === 200) {
            // User exists and has connections - can't invite
            return {
              email,
              status: 'exists' as const,
              message: 'User already exists in another organization'
            }
          } else if (response.status === 400) {
            // User exists but not assigned to team - this might be okay
            const data = await response.json()
            if (data.message === "User is not assigned to a team.") {
              return {
                email,
                status: 'valid' as const,
                message: 'User exists but can be invited'
              }
            } else {
              return {
                email,
                status: 'exists' as const,
                message: data.message || 'User has existing connections'
              }
            }
          } else {
            // Other errors
            return {
              email,
              status: 'invalid' as const,
              message: 'Error validating email'
            }
          }
        } catch (error) {
          console.error('Email validation error:', error)
          return {
            email,
            status: 'invalid' as const,
            message: 'Network error during validation'
          }
        }
      })

      const results = await Promise.all(validationPromises)
      setEmailValidationStatuses(results)
      setEmailsChecked(true)
    } catch (error) {
      console.error('Email validation error:', error)
    } finally {
      setValidatingEmails(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const getValidEmails = () => {
    return emailValidationStatuses
      .filter(status => status.status === 'valid')
      .map(status => status.email)
  }

  const hasInvalidEmails = () => {
    return emailValidationStatuses.some(status => status.status === 'invalid' || status.status === 'exists')
  }

  const hasUncheckedEmails = () => {
    return emailList.length > 0 && !emailsChecked
  }

  const getEmailStatusIcon = (status: EmailValidationStatus['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'invalid':
      case 'exists':
        return <AlertCircle className="w-3 h-3 text-red-400" />
      case 'unchecked':
        return <div className="w-3 h-3 border border-gray-400 rounded-full" />
      default:
        return null
    }
  }

  const getEmailStatusColor = (status: EmailValidationStatus['status']) => {
    switch (status) {
      case 'valid':
        return "bg-green-500/20 text-green-300 border border-green-500/30"
      case 'invalid':
      case 'exists':
        return "bg-red-500/20 text-red-300 border border-red-500/30"
      case 'unchecked':
        return "bg-gray-500/20 text-gray-300 border border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border border-gray-500/30"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teamId) {
      alert("Please select a team")
      return
    }

    if (emailList.length === 0) {
      alert("Please enter at least one email address")
      return
    }

    if (hasUncheckedEmails()) {
      alert("Please check emails before sending invitations")
      return
    }

    if (hasInvalidEmails()) {
      alert("Please resolve email validation issues before proceeding")
      return
    }

    setLoading(true)

    try {
      const validEmails = getValidEmails()
      const payload = {
        teamId: formData.teamId,
        emails: validEmails,
        message: formData.message,
      }

      const response = await fetch(`${config.apiUrl}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send invitations')
      }

      alert(`Invitations sent to ${validEmails.length} email(s) successfully!`)
      
      // Reset form
      setFormData({
        teamId: "",
        emails: "",
        message: "I am inviting you to MyOKR, OKR management tool, where you can add, create, manage, and track your OKRs.",
      })
      setEmailList([])
      setEmailValidationStatuses([])
      setEmailsChecked(false)
      
      onClose()
    } catch (error) {
      console.error("Error sending invites:", error)
      alert(`Failed to send invitations: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invite Users</h2>
              <p className="text-blue-200 text-sm">Invite team members to join MyOKR</p>
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
          {/* Team Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Select Team</label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Choose a team...</option>
              { user?.role === "ADMIN" ? teams.map((team: any) => (
                <option key={team.id} value={team.id} className="bg-gray-800 text-white">
                  {team.name}
                </option>
              )) : <option value={teams.id} className="bg-gray-800 text-white">
                {teams.name}
              </option>}
            </select>
          </div>

          {/* Email Addresses */}
          <div>
            <label className="block text-white font-medium mb-2">Invite Members</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
              <textarea
                name="emails"
                value={formData.emails}
                onChange={handleInputChange}
                placeholder="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
                rows={4}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                required
              />
            </div>
            
            {/* Check Emails Button */}
            {emailList.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleCheckEmails}
                  disabled={validatingEmails}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  <span>
                    {validatingEmails ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                        Checking Emails...
                      </>
                    ) : (
                      `Check ${emailList.length} Email${emailList.length > 1 ? 's' : ''}`
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {/* Email Validation Status */}
            {emailValidationStatuses.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-sm font-medium">Email Status:</span>
                  {emailsChecked && (
                    <span className="text-green-300 text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Emails Checked
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {emailValidationStatuses.map((validation, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${getEmailStatusColor(validation.status)}`}
                    >
                      {getEmailStatusIcon(validation.status)}
                      <div>
                        <div>{validation.email}</div>
                        {validation.message && validation.status !== 'unchecked' && (
                          <div className="text-xs opacity-75 mt-1">{validation.message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                {emailsChecked && (
                  <div className="text-sm space-y-1">
                    <div className="text-green-300">
                      ✅ {emailValidationStatuses.filter(s => s.status === 'valid').length} valid email(s)
                    </div>
                    {emailValidationStatuses.filter(s => s.status === 'invalid' || s.status === 'exists').length > 0 && (
                      <div className="text-red-300">
                        ❌ {emailValidationStatuses.filter(s => s.status === 'invalid' || s.status === 'exists').length} invalid email(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Warning for unchecked emails */}
            {hasUncheckedEmails() && (
              <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please check emails before sending invitations</span>
                </div>
              </div>
            )}

            <p className="text-blue-200 text-sm mt-2">{emailList.length} email(s) entered</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-white font-medium mb-2">Message to Members</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
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
              disabled={loading || validatingEmails || emailList.length === 0 || (emailList.length > 0 && (hasUncheckedEmails() || hasInvalidEmails()))}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Sending..." : "Send Invites"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}