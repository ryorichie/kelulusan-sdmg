'use server'

import { prisma } from '@/lib/prisma'

export async function checkNis(nis: string) {
  // Add a small delay for dramatic effect / perceived processing time
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const student = await prisma.student.findUnique({
    where: { nis }
  })

  return student
}
