"use server"

import prisma from "@/lib/prisma"

export async function getPaginatedAuditLogs(params: {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  modul?: string;
  search?: string;
}) {
  const { page, limit, startDate, endDate, modul, search } = params
  
  const where: any = {}
  
  if (modul && modul !== "ALL") {
    where.modul = modul
  }
  
  if (search) {
    where.OR = [
      { keterangan: { contains: search, mode: 'insensitive' } },
      { aksi: { contains: search, mode: 'insensitive' } },
      { pengguna: { name: { contains: search, mode: 'insensitive' } } }
    ]
  }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      where.createdAt.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const [total, rawLogs] = await Promise.all([
    prisma.logAktivitas.count({ where }),
    prisma.logAktivitas.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        aksi: true,
        modul: true,
        keterangan: true,
        createdAt: true,
        pengguna: { select: { name: true } }
      }
    })
  ])

  const logs = rawLogs.map(l => ({
    id: l.id,
    aksi: l.aksi,
    modul: l.modul,
    keterangan: l.keterangan,
    createdAt: l.createdAt.toISOString(),
    penggunaName: l.pengguna?.name || "Sistem"
  }))

  return {
    data: logs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getAllAuditLogsForExport(params: {
  startDate?: string;
  endDate?: string;
  modul?: string;
  search?: string;
}) {
  const { startDate, endDate, modul, search } = params
  const where: any = {}
  
  if (modul && modul !== "ALL") {
    where.modul = modul
  }
  
  if (search) {
    where.OR = [
      { keterangan: { contains: search, mode: 'insensitive' } },
      { aksi: { contains: search, mode: 'insensitive' } },
      { pengguna: { name: { contains: search, mode: 'insensitive' } } }
    ]
  }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      where.createdAt.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const rawLogs = await prisma.logAktivitas.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      aksi: true,
      modul: true,
      keterangan: true,
      createdAt: true,
      pengguna: { select: { name: true } }
    }
  })

  return rawLogs.map(l => ({
    id: l.id,
    aksi: l.aksi,
    modul: l.modul,
    keterangan: l.keterangan,
    createdAt: l.createdAt.toISOString(),
    penggunaName: l.pengguna?.name || "Sistem"
  }))
}
