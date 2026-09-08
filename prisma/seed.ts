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

  // Seed Kepala Sekolah
  await prisma.pengguna.upsert({
    where: { email: 'kepsek@albasyariah.com' },
    update: {},
    create: {
      email: 'kepsek@albasyariah.com',
      name: 'Kepala Sekolah',
      password: hashedPassword,
      role: 'KEPALA_SEKOLAH',
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
    }
  })
  // Seed Akun Keuangan Dasar (Per Unit)
  const klasifikasiData = [
    { kode: '1', nama: 'HARTA (ASET)' },
    { kode: '2', nama: 'KEWAJIBAN (LIABILITAS)' },
    { kode: '3', nama: 'MODAL (EKUITAS)' },
    { kode: '4', nama: 'PENDAPATAN' },
    { kode: '5', nama: 'BEBAN (BIAYA)' },
  ];

  for (const k of klasifikasiData) {
    await prisma.klasifikasiAkun.upsert({
      where: { 
        kode_unitSekolahId: { 
          kode: k.kode, 
          unitSekolahId: school.id 
        } 
      },
      update: {},
      create: {
        kode: k.kode,
        nama: k.nama,
        unitSekolahId: school.id
      }
    });
  }
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
