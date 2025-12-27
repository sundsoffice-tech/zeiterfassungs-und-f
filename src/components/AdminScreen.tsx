import { useState } from 'react'
import { Employee, UserRole, AuditMetadata } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { UserCircleGear, Plus, PencilSimple, Trash, ShieldCheck } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createAuditMetadata } from '@/lib/data-model-helpers'

interface AdminScreenProps {
  employees: Employee[]
  setEmployees: (value: Employee[] | ((oldValue?: Employee[]) => Employee[])) => void
}

export function AdminScreen({ employees, setEmployees }: AdminScreenProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    hourlyRate: ''
  })

  const handleAdd = () => {
    setEditingEmployee(null)
    setFormData({
      name: '',
      email: '',
      role: UserRole.EMPLOYEE,
      hourlyRate: ''
    })
    setDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email || '',
      role: employee.role,
      hourlyRate: employee.hourlyRate?.toString() || ''
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Name ist erforderlich')
      return
    }

    const audit: AuditMetadata = editingEmployee
      ? { ...editingEmployee.audit, updatedBy: 'admin', updatedAt: new Date().toISOString() }
      : createAuditMetadata('admin', 'Browser')

    if (editingEmployee) {
      setEmployees((current = []) =>
        current.map(e =>
          e.id === editingEmployee.id
            ? {
                ...e,
                name: formData.name,
                email: formData.email || undefined,
                role: formData.role,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
                audit
              }
            : e
        )
      )
      toast.success('Mitarbeiter aktualisiert')
    } else {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        tenantId: 'default',
        name: formData.name,
        email: formData.email || undefined,
        role: formData.role,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        active: true,
        audit
      }
      setEmployees((current = []) => [...current, newEmployee])
      toast.success('Mitarbeiter hinzugefügt')
    }

    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      setEmployees((current = []) => current.filter(e => e.id !== id))
      toast.success('Mitarbeiter gelöscht')
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'default'
      case UserRole.PROJECT_MANAGER:
        return 'secondary'
      case UserRole.EMPLOYEE:
        return 'outline'
      case UserRole.EXTERNAL:
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator'
      case UserRole.PROJECT_MANAGER:
        return 'Projektleiter'
      case UserRole.EMPLOYEE:
        return 'Mitarbeiter'
      case UserRole.EXTERNAL:
        return 'Extern'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCircleGear className="h-5 w-5" weight="duotone" />
                Benutzerverwaltung
              </CardTitle>
              <CardDescription>Rollen und Berechtigungen verwalten</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Mitarbeiter hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
                  </DialogTitle>
                  <DialogDescription>
                    Geben Sie die Mitarbeiterinformationen und Rolle ein
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="max@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                        <SelectItem value={UserRole.PROJECT_MANAGER}>Projektleiter</SelectItem>
                        <SelectItem value={UserRole.EMPLOYEE}>Mitarbeiter</SelectItem>
                        <SelectItem value={UserRole.EXTERNAL}>Extern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Stundensatz (€)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="50.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave}>Speichern</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserCircleGear className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine Mitarbeiter vorhanden</p>
              </div>
            )}
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{employee.name}</span>
                      <Badge variant={getRoleBadgeVariant(employee.role)}>
                        {employee.role === UserRole.ADMIN && <ShieldCheck className="h-3 w-3 mr-1" weight="fill" />}
                        {getRoleLabel(employee.role)}
                      </Badge>
                      {!employee.active && (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      {employee.email && <span>{employee.email}</span>}
                      {employee.hourlyRate && <span>€{employee.hourlyRate.toFixed(2)}/h</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(employee)}
                    className="gap-2"
                  >
                    <PencilSimple className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(employee.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rollenberechtigungen</CardTitle>
          <CardDescription>Übersicht der Berechtigungen nach Rolle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
                  <h3 className="font-bold">Administrator</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Vollständiger Systemzugriff</li>
                  <li>Benutzer und Rollen verwalten</li>
                  <li>Alle Zeiteinträge genehmigen</li>
                  <li>Projekte erstellen und bearbeiten</li>
                  <li>Berichte und Exporte</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircleGear className="h-5 w-5 text-secondary-foreground" weight="fill" />
                  <h3 className="font-bold">Projektleiter</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Zeiteinträge des Teams genehmigen</li>
                  <li>Eigene Projekte verwalten</li>
                  <li>Teamdaten einsehen</li>
                  <li>Projektberichte erstellen</li>
                  <li>Eigene Zeit erfassen</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircleGear className="h-5 w-5 text-muted-foreground" weight="fill" />
                  <h3 className="font-bold">Mitarbeiter</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Eigene Zeit erfassen</li>
                  <li>Eigene Zeiteinträge einsehen</li>
                  <li>Zeiteinträge einreichen</li>
                  <li>Projekte einsehen</li>
                  <li>Eigene Berichte exportieren</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircleGear className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  <h3 className="font-bold">Extern</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Nur eigene Zeit erfassen</li>
                  <li>Eingeschränkte Sichtbarkeit</li>
                  <li>Keine anderen Mitarbeiter sehen</li>
                  <li>Nur zugewiesene Projekte</li>
                  <li>Basis-Export der eigenen Daten</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
