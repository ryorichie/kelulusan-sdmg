'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

async function checkAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
}

export async function toggleGraduationStatus(id: string, currentStatus: boolean) {
  await checkAuth()
  await prisma.student.update({
    where: { id },
    data: { isGraduated: !currentStatus }
  })
  revalidatePath('/admin')
}

export async function addStudent(formData: FormData) {
  await checkAuth()
  const nis = formData.get('nis') as string
  const name = formData.get('name') as string
  const quote = formData.get('quote') as string
  const isGraduated = formData.get('isGraduated') === 'true'

  await prisma.student.create({
    data: {
      nis,
      name,
      quote,
      isGraduated
    }
  })
  revalidatePath('/admin')
}

export async function deleteStudent(id: string) {
  await checkAuth()
  await prisma.student.delete({
    where: { id }
  })
  revalidatePath('/admin')
}

export async function updateSettings(formData: FormData) {
  await checkAuth()
  const schoolName = formData.get('schoolName') as string
  const schoolLogo = formData.get('schoolLogo') as string

  await prisma.setting.upsert({
    where: { key: 'school_name' },
    update: { value: schoolName },
    create: { key: 'school_name', value: schoolName }
  })

  await prisma.setting.upsert({
    where: { key: 'school_logo' },
    update: { value: schoolLogo },
    create: { key: 'school_logo', value: schoolLogo }
  })

  revalidatePath('/')
  revalidatePath('/admin')
}
