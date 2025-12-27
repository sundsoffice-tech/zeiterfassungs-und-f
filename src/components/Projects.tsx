import { useState } from 'react'
import { Plus, PencilSimple, Trash, FolderOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Project, TimeEntry, Task, Phase, AuditMetadata } from '@/lib/types'
import { getTotalHoursByProject, formatDuration } from '@/lib/helpers'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { EmptyProjects } from '@/components/EmptyStates'

interface ProjectsProps {
  projects: Project[]
  setProjects: (value: Project[] | ((oldValue?: Project[]) => Project[])) => void
  tasks: Task[]
  setTasks: (value: Task[] | ((oldValue?: Task[]) => Task[])) => void
  phases: Phase[]
  setPhases: (value: Phase[] | ((oldValue?: Phase[]) => Phase[])) => void
  timeEntries: TimeEntry[]
}

export function Projects({ projects, setProjects, tasks, setTasks, phases, setPhases, timeEntries }: ProjectsProps) {
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a project name')
      return
    }

    if (editingProject) {
      setProjects((prev = []) => 
        prev.map(proj => proj.id === editingProject.id 
          ? { 
              ...proj, 
              name: formData.name, 
              description: formData.description
            }
          : proj
        )
      )
      toast.success('Project updated successfully')
    } else {
      const audit: AuditMetadata = createAuditMetadata('admin', 'Browser')
      const newProject: Project = {
        id: `proj_${Date.now()}`,
        tenantId: 'default',
        name: formData.name,
        description: formData.description,
        active: true,
        audit
      }
      setProjects((prev = []) => [...prev, newProject])
      toast.success('Project added successfully')
    }

    setFormData({ name: '', description: '' })
    setEditingProject(null)
    setOpen(false)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({ 
      name: project.name, 
      description: project.description || ''
    })
    setOpen(true)
  }

  const handleDelete = (projectId: string) => {
    setProjects((prev = []) => prev.filter(proj => proj.id !== projectId))
    toast.success('Project deleted')
  }

  const handleClose = () => {
    setOpen(false)
    setEditingProject(null)
    setFormData({ name: '', description: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track time</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleClose()}>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Website Redesign"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief project description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? 'Update' : 'Add'} Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <EmptyProjects onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => {
            const totalHours = getTotalHoursByProject(timeEntries, project.id)
            const entryCount = timeEntries.filter(e => e.projectId === project.id).length
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{project.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Hours:</span>
                        <span className="font-mono font-medium text-primary">
                          {formatDuration(totalHours)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time Entries:</span>
                        <span className="font-mono font-medium">{entryCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
