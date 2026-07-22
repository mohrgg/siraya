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
      akunDetail: { include: { subKlasifikasiAkun: true } },
      createdBy: { select: { name: true } },
      divisi: { select: { name: true } },
      items: {
        include: { akunDetail: { include: { subKlasifikasiAkun: true } } }
      }
    },
    orderBy: { date: "desc" }
  })

  return rawData.map(d => ({
    ...d,
    totalAmount: Number(d.totalAmount),
    items: d.items.map(item => ({
      ...item,
      amount: Number(item.amount)
    }))
  }))
}

export async function tambahTransaksiKas(data: {
  type: "IN" | "OUT",
  akunDetailId: string,
  unitSekolahId: string,
  totalAmount: number,
  date: Date,
  description?: string,
  studentName?: string,
  classroomName?: string,
  recipientName?: string,
  formNo?: string,
  divisiId?: string,
  items: { akunDetailId: string, amount: number, description?: string }[]
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

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
      type: data.type,
      akunDetailId: data.akunDetailId,
      unitSekolahId: data.unitSekolahId,
      totalAmount: new Prisma.Decimal(data.totalAmount),
      date: data.date,
      description: data.description,
      studentName: data.studentName,
      classroomName: data.classroomName,
      recipientName: data.recipientName,
      formNo: data.formNo,
      divisiId: data.divisiId || null,
      referenceNo,
      createdById: session.user.id,
      items: {
        create: data.items.map(item => ({
          akunDetailId: item.akunDetailId,
          amount: new Prisma.Decimal(item.amount),
          description: item.description
        }))
      }
    },
    include: {
      akunDetail: { include: { subKlasifikasiAkun: true } },
      createdBy: { select: { name: true } },
      items: true
    }
  })
  
  revalidatePath("/transaksi")
  revalidatePath("/")
  return { ...result, totalAmount: Number(result.totalAmount) }
}

export async function editTransaksiKas(id: string, data: {
  akunDetailId?: string,
  totalAmount?: number,
  date?: Date,
  description?: string,
  studentName?: string,
  classroomName?: string,
  recipientName?: string,
  formNo?: string,
  divisiId?: string,
  editReason: string,
  items?: { id?: string, akunDetailId: string, amount: number, description?: string }[]
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const updateData: any = { 
    akunDetailId: data.akunDetailId,
    date: data.date,
    description: data.description,
    studentName: data.studentName,
    classroomName: data.classroomName,
    recipientName: data.recipientName,
    formNo: data.formNo,
    divisiId: data.divisiId,
    isEdited: true,
    editReason: data.editReason
  }
  
  if (data.totalAmount !== undefined) updateData.totalAmount = new Prisma.Decimal(data.totalAmount)

  // Clean up undefined properties
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

  // Use interactive transaction to handle item replacement
  const result = await prisma.$transaction(async (tx) => {
    // If items are provided, delete old ones and insert new ones (safest way to sync)
    if (data.items) {
      await tx.itemTransaksiKas.deleteMany({ where: { transaksiKasId: id } })
      updateData.items = {
        create: data.items.map(item => ({
          akunDetailId: item.akunDetailId,
          amount: new Prisma.Decimal(item.amount),
          description: item.description
        }))
      }
    }
    
    return await tx.transaksiKas.update({
      where: { id },
      data: updateData,
      include: {
        akunDetail: { include: { subKlasifikasiAkun: true } },
        createdBy: { select: { name: true } },
        items: true
      }
    })
  })

  revalidatePath("/transaksi")
  revalidatePath("/")
  return { ...result, totalAmount: Number(result.totalAmount) }
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
