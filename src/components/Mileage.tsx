import { useState } from 'react'
import { Plus, Car, Trash, Download } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MileageEntry, Employee } from '@/lib/types'
import { getEmployeeName } from '@/lib/helpers'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportMileageEntriesToCSV } from '@/lib/csv-export'

interface MileageProps {
  mileageEntries: MileageEntry[]
  setMileageEntries: (updateFn: (prev: MileageEntry[]) => MileageEntry[]) => void
  employees: Employee[]
}

export function Mileage({ mileageEntries, setMileageEntries, employees }: MileageProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startLocation: '',
    endLocation: '',
    distance: '',
    purpose: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employeeId || !formData.startLocation || !formData.endLocation || !formData.distance || !formData.purpose) {
      toast.error('Please fill in all required fields')
      return
    }

    const distance = parseFloat(formData.distance)
    if (isNaN(distance) || distance <= 0) {
      toast.error('Please enter a valid distance')
      return
    }

    const newEntry: MileageEntry = {
      id: `mileage_${Date.now()}`,
      employeeId: formData.employeeId,
      date: formData.date,
      startLocation: formData.startLocation,
      endLocation: formData.endLocation,
      distance: distance,
      purpose: formData.purpose,
      createdAt: new Date().toISOString()
    }

    setMileageEntries((prev) => [...prev, newEntry])
    toast.success('Mileage entry added successfully')

    setFormData({
      employeeId: formData.employeeId,
      date: new Date().toISOString().split('T')[0],
      startLocation: '',
      endLocation: '',
      distance: '',
      purpose: ''
    })
    setOpen(false)
  }

  const handleDelete = (entryId: string) => {
    setMileageEntries((prev) => prev.filter(entry => entry.id !== entryId))
    toast.success('Mileage entry deleted')
  }

  const handleExport = () => {
    exportMileageEntriesToCSV(mileageEntries, employees)
    toast.success('Mileage entries exported to CSV')
  }

  const sortedEntries = [...mileageEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalMileage = mileageEntries.reduce((sum, entry) => sum + entry.distance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Mileage Log</h1>
          <p className="text-muted-foreground">
            Total: <span className="font-mono font-semibold text-accent">{totalMileage.toLocaleString('de-DE')} km</span>
          </p>
        </div>
        <div className="flex gap-2">
          {mileageEntries.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" weight="bold" />
              Export CSV
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={employees.length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Add Mileage
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mileage Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startLocation">Start Location *</Label>
                  <Input
                    id="startLocation"
                    value={formData.startLocation}
                    onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                    placeholder="Office, Home, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endLocation">End Location *</Label>
                  <Input
                    id="endLocation"
                    value={formData.endLocation}
                    onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                    placeholder="Client site, Meeting location, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km) *</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="15.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Client meeting, Site visit, etc."
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Add Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-16 w-16 text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add employees to start tracking mileage
            </p>
          </CardContent>
        </Card>
      ) : mileageEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-16 w-16 text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No mileage entries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start logging trips by adding your first entry
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="group"
                    >
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>{getEmployeeName(employees, entry.employeeId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{entry.startLocation}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{entry.endLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-accent">
                        {entry.distance.toLocaleString('de-DE')} km
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.purpose}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
