"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getSiswa(unitSekolahId?: string, subKelasId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.murid.findMany({
    where: {
      ...(unitSekolahId ? { unitSekolahId } : {}),
      ...(subKelasId ? { subKelasId } : {}),
    },
    include: {
      subKelas: {
        include: {
          tingkat: true,
          jurusan: true
        }
      }
    },
    orderBy: { name: "asc" }
  })
}

export async function tambahSiswa(data: { 
  nis: string, name: string, subKelasId?: string, unitSekolahId: string, isActive?: boolean, isScholarship?: boolean,
  nisn?: string, previousSchool?: string, phone?: string, birthDate?: string, email?: string, studentStatus?: string,
  parentName?: string, parentPhone?: string, religion?: string, gender?: string, password?: string, address?: string,
  photoUrl?: string, formNo?: string, username?: string
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.murid.create({
    data: {
      nis: data.nis,
      name: data.name,
      subKelasId: data.subKelasId || null,
      unitSekolahId: data.unitSekolahId,
      isActive: data.isActive ?? true,
      isScholarship: data.isScholarship ?? false,
      nisn: data.nisn,
      previousSchool: data.previousSchool,
      phone: data.phone,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      email: data.email,
      studentStatus: data.studentStatus,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      religion: data.religion,
      gender: data.gender,
      password: data.password,
      address: data.address,
      photoUrl: data.photoUrl,
      formNo: data.formNo,
      username: data.username,
    }
  })
  revalidatePath("/data-master")
  return result
}

export async function editSiswa(id: string, data: { 
  nis?: string, name?: string, subKelasId?: string, isActive?: boolean, isScholarship?: boolean,
  nisn?: string, previousSchool?: string, phone?: string, birthDate?: string, email?: string, studentStatus?: string,
  parentName?: string, parentPhone?: string, religion?: string, gender?: string, password?: string, address?: string,
  photoUrl?: string, formNo?: string, username?: string
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.murid.update({
    where: { id },
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined
    }
  })
  revalidatePath("/data-master")
  return result
}

export async function importSiswaBulk(studentsData: any[]) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.murid.createMany({
    data: studentsData
  })

  revalidatePath("/data-master")
  return result
}

export async function hapusSiswa(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const result = await prisma.murid.delete({ where: { id } })
  revalidatePath("/data-master")
  return result
}
