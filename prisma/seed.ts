import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

import { prisma } from '../src/lib/prisma'

async function main() {
  // Create admin user
  const password = await hash('admin123', 12)
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password,
    },
  })
  console.log({ user })

  // Create sample students
  const student1 = await prisma.student.upsert({
    where: { nis: '12345' },
    update: {},
    create: {
      nis: '12345',
      name: 'John Doe',
      isGraduated: true,
      quote: 'The future belongs to those who believe in the beauty of their dreams.',
    },
  })

  const student2 = await prisma.student.upsert({
    where: { nis: '67890' },
    update: {},
    create: {
      nis: '67890',
      name: 'Jane Smith',
      isGraduated: false,
      quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    },
  })

  console.log({ student1, student2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
