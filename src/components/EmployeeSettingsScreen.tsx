import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { User } from '@phosphor-icons/react'
import { Employee } from '@/lib/types'
import { NotificationSettings } from '@/components/NotificationSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmployeeSettingsScreenProps {
  employees: Employee[]
}

export function EmployeeSettingsScreen({ employees }: EmployeeSettingsScreenProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees.length > 0 ? employees[0].id : ''
  )

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter-Einstellungen</CardTitle>
          <CardDescription>Keine Mitarbeiter verfügbar</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" weight="duotone" />
            Mitarbeiter-Einstellungen
          </CardTitle>
          <CardDescription>
            Einstellungen für individuelle Mitarbeiter verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="employee-select">Mitarbeiter auswählen</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger id="employee-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} {employee.email ? `(${employee.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationSettings employee={selectedEmployee} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
