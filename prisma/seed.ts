import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Seed Admin
  const admin = await prisma.pengguna.upsert({
    where: { email: 'admin@albasyariah.com' },
    update: {},
    create: {
      email: 'admin@albasyariah.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Seed Tata Usaha
  const tu = await prisma.pengguna.upsert({
    where: { email: 'tu@albasyariah.com' },
    update: {},
    create: {
      email: 'tu@albasyariah.com',
      name: 'Tata Usaha',
      password: hashedPassword,
      role: 'TATA_USAHA',
    },
  })

  // Seed default School Unit
  const school = await prisma.unitSekolah.create({
    data: {
      name: 'SMK Al Basyariah',
      level: 'SMK',
    }
  })

  // Seed default Academic Year
  await prisma.tahunAkademik.create({
    data: {
      name: '2025/2026',
      isActive: true,
      unitSekolahId: school.id,
    }
  })

  // Seed Akun Keuangan Dasar
  const klasifikasiHarta = await prisma.klasifikasiAkun.create({
    data: { name: 'HARTA', unitSekolahId: school.id }
  })
  
  const subKas = await prisma.subKlasifikasiAkun.create({
    data: { name: 'Kas & Bank', code: '11', klasifikasiAkunId: klasifikasiHarta.id }
  })

  await prisma.akunDetail.create({
    data: { name: 'Kas Tunai Utama', code: '1101', subKlasifikasiAkunId: subKas.id }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
