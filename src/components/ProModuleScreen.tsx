import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, CalendarCheck, MapPin, Package, Receipt, Users } from '@phosphor-icons/react'
import { GPSMileageScreen } from './GPSMileageScreen'
import { ShiftPlanningScreen } from './ShiftPlanningScreen'
import { GeoFencingScreen } from './GeoFencingScreen'
import { MaterialToolScreen } from './MaterialToolScreen'
import { InvoicingScreen } from './InvoicingScreen'
import { CustomerPortalScreen } from './CustomerPortalScreen'
import { Employee, Project, Client } from '@/lib/types'

interface ProModuleScreenProps {
  employees: Employee[]
  setEmployees: (updateFn: (prev: Employee[]) => Employee[]) => void
  projects: Project[]
  setProjects: (updateFn: (prev: Project[]) => Project[]) => void
}

export function ProModuleScreen({ employees, setEmployees, projects, setProjects }: ProModuleScreenProps) {
  const [activeTab, setActiveTab] = useState('gps-mileage')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pro Module</h2>
        <p className="text-muted-foreground mt-2">
          Erweiterte Funktionen für Fahrtzeiten, Schichtplanung, Geo-Fencing, Materialverwaltung, Rechnungsstellung und Kundenportal
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="gps-mileage" className="gap-2">
            <Car className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">GPS-Fahrtzeiten</span>
          </TabsTrigger>
          <TabsTrigger value="shift-planning" className="gap-2">
            <CalendarCheck className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Schichtplanung</span>
          </TabsTrigger>
          <TabsTrigger value="geo-fencing" className="gap-2">
            <MapPin className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Geo-Fencing</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2">
            <Package className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Material/Werkzeug</span>
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2">
            <Receipt className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Rechnungen</span>
          </TabsTrigger>
          <TabsTrigger value="customer-portal" className="gap-2">
            <Users className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Kundenportal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gps-mileage" className="mt-6">
          <GPSMileageScreen employees={employees} projects={projects} />
        </TabsContent>

        <TabsContent value="shift-planning" className="mt-6">
          <ShiftPlanningScreen employees={employees} projects={projects} />
        </TabsContent>

        <TabsContent value="geo-fencing" className="mt-6">
          <GeoFencingScreen projects={projects} />
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <MaterialToolScreen employees={employees} projects={projects} />
        </TabsContent>

        <TabsContent value="invoicing" className="mt-6">
          <InvoicingScreen projects={projects} />
        </TabsContent>

        <TabsContent value="customer-portal" className="mt-6">
          <CustomerPortalScreen projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
