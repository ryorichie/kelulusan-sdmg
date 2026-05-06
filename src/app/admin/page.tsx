import { prisma } from '@/lib/prisma'
import { AdminClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const rawSettings = await prisma.setting.findMany()
  const settings = rawSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)

  return <AdminClientPage students={students} settings={settings} />
}
