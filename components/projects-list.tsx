'use client'

import React, { useState, useEffect } from 'react'
import { Briefcase, MoreVertical } from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  progress: number
  budget: number | null
  spent: number | null
  priority: string
  owner_name: string
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-50'
    case 'planning':
      return 'bg-purple-50'
    case 'completed':
      return 'bg-green-50'
    case 'on_hold':
      return 'bg-yellow-50'
    default:
      return 'bg-gray-50'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'text-red-600 bg-red-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'low':
      return 'text-green-600 bg-green-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-amber-600 h-2 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading projects...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`p-4 rounded-lg border border-gray-100 ${getStatusColor(project.status)} hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600 rounded-lg">
                <Briefcase size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{project.owner_name}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <MoreVertical size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
              <span className="text-xs text-gray-600">{project.status}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
              </div>
              <ProgressBar progress={project.progress} />
            </div>

            {project.budget && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Spent</p>
                  <p className="text-sm font-semibold text-gray-900">${project.spent?.toLocaleString() || '0'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
