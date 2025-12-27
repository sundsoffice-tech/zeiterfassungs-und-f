import { useState } from 'react'
import { Plus, PencilSimple, Trash, Users as UsersIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Employee, TimeEntry, MileageEntry, UserRole } from '@/lib/types'
import { getTotalHoursByEmployee, getTotalMileageByEmployee, formatDuration } from '@/lib/helpers'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createAuditMetadata } from '@/lib/data-model-helpers'

interface EmployeesProps {
  employees: Employee[]
  setEmployees: (updateFn: (prev: Employee[]) => Employee[]) => void
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
}

export function Employees({ employees, setEmployees, timeEntries, mileageEntries }: EmployeesProps) {
  const [open, setOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a name')
      return
    }

    if (editingEmployee) {
      setEmployees((prev) => 
        prev.map(emp => emp.id === editingEmployee.id 
          ? { ...emp, name: formData.name, email: formData.email }
          : emp
        )
      )
      toast.success('Employee updated successfully')
    } else {
      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        tenantId: 'default',
        name: formData.name,
        email: formData.email,
        role: UserRole.EMPLOYEE,
        active: true,
        audit: createAuditMetadata('admin')
      }
      setEmployees((prev) => [...prev, newEmployee])
      toast.success('Employee added successfully')
    }

    setFormData({ name: '', email: '' })
    setEditingEmployee(null)
    setOpen(false)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({ name: employee.name, email: employee.email || '' })
    setOpen(true)
  }

  const handleDelete = (employeeId: string) => {
    setEmployees((prev) => prev.filter(emp => emp.id !== employeeId))
    toast.success('Employee deleted')
  }

  const handleClose = () => {
    setOpen(false)
    setEditingEmployee(null)
    setFormData({ name: '', email: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleClose()}>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UsersIcon className="h-16 w-16 text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first employee to start tracking time
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee, index) => {
            const totalHours = getTotalHoursByEmployee(timeEntries, employee.id)
            const totalMileage = getTotalMileageByEmployee(mileageEntries, employee.id)
            
            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{employee.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employee.email && (
                      <p className="text-sm text-muted-foreground mb-3">{employee.email}</p>
                    )}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Hours:</span>
                        <span className="font-mono font-medium">{formatDuration(totalHours)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Mileage:</span>
                        <span className="font-mono font-medium">{totalMileage.toLocaleString('de-DE')} km</span>
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
