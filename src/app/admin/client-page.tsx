'use client'

import { Student } from '@prisma/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toggleGraduationStatus, addStudent, deleteStudent, updateSettings } from './actions'
import { toast } from 'sonner'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LogOut, Plus, Trash2, Settings, Users } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminClientPage({ students, settings }: { students: Student[], settings: Record<string, string> }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleGraduationStatus(id, currentStatus)
      toast.success(`Status updated successfully`)
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await deleteStudent(id)
      toast.success('Student deleted')
    } catch (e) {
      toast.error('Failed to delete student')
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await addStudent(formData)
      toast.success('Student added successfully')
      setIsAddOpen(false)
    } catch (e) {
      toast.error('Failed to add student')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSavingSettings(true)
    const formData = new FormData(e.currentTarget)
    try {
      await updateSettings(formData)
      toast.success('Settings updated successfully')
    } catch (e) {
      toast.error('Failed to update settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your school's announcement platform.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students" className="gap-2"><Users className="w-4 h-4"/> Students</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4"/> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              {/* @ts-expect-error React 19 types issue with Radix */}
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2"/> Add Student</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS (Nomor Induk Siswa)</Label>
                    <Input id="nis" name="nis" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote">Motivational Quote</Label>
                    <Input id="quote" name="quote" placeholder="Optional..." />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch id="isGraduated" name="isGraduated" value="true" />
                    <Label htmlFor="isGraduated">Is Graduated?</Label>
                  </div>
                  <Button type="submit" className="w-full">Save Student</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No students found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nis}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {student.quote || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={student.isGraduated} 
                            onCheckedChange={() => handleToggle(student.id, student.isGraduated)}
                          />
                          <span className={student.isGraduated ? "text-green-600 font-medium" : "text-slate-500"}>
                            {student.isGraduated ? 'Lulus' : 'Belum'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>School Settings</CardTitle>
              <CardDescription>
                Customize the appearance of the public announcement page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input 
                    id="schoolName" 
                    name="schoolName" 
                    placeholder="e.g. SMA Negeri 1 Jakarta" 
                    defaultValue={settings['school_name'] || ''}
                    required 
                  />
                  <p className="text-sm text-muted-foreground">This will be displayed prominently on the announcement page.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schoolLogo">School Logo URL</Label>
                  <Input 
                    id="schoolLogo" 
                    name="schoolLogo" 
                    type="url"
                    placeholder="https://example.com/logo.png" 
                    defaultValue={settings['school_logo'] || ''}
                  />
                  <p className="text-sm text-muted-foreground">Provide a direct link to an image. Leave blank to show no logo.</p>
                </div>

                <Button type="submit" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
