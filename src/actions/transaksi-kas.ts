"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function getTransaksiKas(unitSekolahId: string, type?: "IN" | "OUT") {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const rawData = await prisma.transaksiKas.findMany({
    where: {
      unitSekolahId,
      isDeleted: false,
      ...(type ? { type } : {})
    },
    include: {
      akunDetail: {
        include: {
          subKlasifikasiAkun: true
        }
      },
      createdBy: {
        select: { name: true }
      }
    },
    orderBy: {
      date: "desc"
    }
  })

  return rawData.map(d => ({
    ...d,
    amount: Number(d.amount)
  }))
}

export async function tambahTransaksiKas(data: {
  type: "IN" | "OUT",
  akunDetailId: string,
  unitSekolahId: string,
  amount: number,
  date: Date,
  description?: string,
  studentName?: string,
  classroomName?: string,
  recipientName?: string,
  formNo?: string,
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Generate Reference No (e.g. KM-20250716-0001 for Kas Masuk, KK for Kas Keluar)
  const prefix = data.type === "IN" ? "KM" : "KK"
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const count = await prisma.transaksiKas.count({
    where: {
      type: data.type,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }
  })
  const referenceNo = `${prefix}-${dateStr}-${String(count + 1).padStart(4, "0")}`

  const result = await prisma.transaksiKas.create({
    data: {
      ...data,
      amount: new Prisma.Decimal(data.amount),
      referenceNo,
      createdById: session.user.id
    },
    include: {
      akunDetail: {
        include: { subKlasifikasiAkun: true }
      },
      createdBy: { select: { name: true } }
    }
  })
  
  revalidatePath("/transaksi")
  revalidatePath("/") // update dashboard
  return {
    ...result,
    amount: Number(result.amount)
  }
}

export async function editTransaksiKas(id: string, data: {
  akunDetailId?: string,
  amount?: number,
  date?: Date,
  description?: string,
  studentName?: string,
  classroomName?: string,
  recipientName?: string,
  formNo?: string,
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const updateData: any = { ...data }
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount)
  }

  const result = await prisma.transaksiKas.update({
    where: { id },
    data: updateData,
    include: {
      akunDetail: {
        include: { subKlasifikasiAkun: true }
      },
      createdBy: { select: { name: true } }
    }
  })

  revalidatePath("/transaksi")
  revalidatePath("/")
  return {
    ...result,
    amount: Number(result.amount)
  }
}

export async function hapusTransaksiKas(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await prisma.transaksiKas.update({
    where: { id },
    data: { isDeleted: true }
  })

  revalidatePath("/transaksi")
  revalidatePath("/")
}
