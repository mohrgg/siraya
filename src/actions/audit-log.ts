"use server"

import prisma from "@/lib/prisma"
import { AUDIT_DOMAINS, AuditCockpitSummary } from "@/lib/constants/audit"

export async function getAuditCockpitSummary(): Promise<AuditCockpitSummary> {
  // 1. Eksekusi ringkasan KPI tingkat tinggi
  const [
    totalAll,
    totalMutasi,
    totalDelete,
    totalUpdate,
    totalCreate,
    totalLogin,
    actorsGroup
  ] = await Promise.all([
    prisma.logAktivitas.count(),
    prisma.logAktivitas.count({ where: { aksi: { not: "LOGIN" } } }),
    prisma.logAktivitas.count({
      where: {
        OR: [
          { aksi: { contains: "DELETE", mode: "insensitive" } },
          { aksi: { contains: "HAPUS", mode: "insensitive" } },
          { aksi: { contains: "NONAKTIF", mode: "insensitive" } }
        ]
      }
    }),
    prisma.logAktivitas.count({
      where: {
        OR: [
          { aksi: { contains: "UPDATE", mode: "insensitive" } },
          { aksi: { contains: "EDIT", mode: "insensitive" } },
          { aksi: { contains: "GANTI", mode: "insensitive" } }
        ]
      }
    }),
    prisma.logAktivitas.count({
      where: {
        OR: [
          { aksi: { contains: "CREATE", mode: "insensitive" } },
          { aksi: { contains: "TAMBAH", mode: "insensitive" } },
          { aksi: { contains: "BUAT", mode: "insensitive" } }
        ]
      }
    }),
    prisma.logAktivitas.count({
      where: {
        OR: [
          { aksi: { contains: "LOGIN", mode: "insensitive" } },
          { modul: "SISTEM" }
        ]
      }
    }),
    prisma.logAktivitas.groupBy({ by: ["penggunaId"] })
  ])

  // 2. Agregasi untuk 6 kartu domain modul
  const domainCards = await Promise.all(
    AUDIT_DOMAINS.map(async (dom) => {
      const [total, creates, updates, deletes, lastLog] = await Promise.all([
        prisma.logAktivitas.count({ where: { modul: { in: [...dom.moduls] } } }),
        prisma.logAktivitas.count({
          where: {
            modul: { in: [...dom.moduls] },
            OR: [
              { aksi: { contains: "CREATE", mode: "insensitive" } },
              { aksi: { contains: "TAMBAH", mode: "insensitive" } },
              { aksi: { contains: "BUAT", mode: "insensitive" } }
            ]
          }
        }),
        prisma.logAktivitas.count({
          where: {
            modul: { in: [...dom.moduls] },
            OR: [
              { aksi: { contains: "UPDATE", mode: "insensitive" } },
              { aksi: { contains: "EDIT", mode: "insensitive" } },
              { aksi: { contains: "GANTI", mode: "insensitive" } }
            ]
          }
        }),
        prisma.logAktivitas.count({
          where: {
            modul: { in: [...dom.moduls] },
            OR: [
              { aksi: { contains: "DELETE", mode: "insensitive" } },
              { aksi: { contains: "HAPUS", mode: "insensitive" } },
              { aksi: { contains: "NONAKTIF", mode: "insensitive" } }
            ]
          }
        }),
        prisma.logAktivitas.findFirst({
          where: { modul: { in: [...dom.moduls] } },
          orderBy: { createdAt: "desc" },
          select: {
            aksi: true,
            keterangan: true,
            createdAt: true,
            pengguna: { select: { name: true } }
          }
        })
      ])

      return {
        id: dom.id,
        name: dom.name,
        description: dom.description,
        moduls: [...dom.moduls],
        total,
        breakdown: { creates, updates, deletes },
        lastLog: lastLog
          ? {
              aksi: lastLog.aksi,
              keterangan: lastLog.keterangan,
              createdAt: lastLog.createdAt.toISOString(),
              actor: lastLog.pengguna?.name || "Sistem"
            }
          : null
      }
    })
  )

  return {
    kpi: {
      totalAll,
      totalMutasi,
      totalDelete,
      totalUpdate,
      totalCreate,
      totalLogin,
      totalActors: actorsGroup.length
    },
    domainCards
  }
}

function buildAuditWhere(params: {
  startDate?: string;
  endDate?: string;
  modul?: string;
  search?: string;
  severity?: string;
  domainId?: string;
}) {
  const { startDate, endDate, modul, search, severity, domainId } = params
  const andConditions: any[] = []

  // 1. Filter Domain atau Modul Spesifik
  if (domainId && domainId !== "ALL") {
    const foundDomain = AUDIT_DOMAINS.find(d => d.id === domainId)
    if (foundDomain) {
      andConditions.push({ modul: { in: [...foundDomain.moduls] } })
    }
  } else if (modul && modul !== "ALL") {
    andConditions.push({ modul })
  }

  // 2. Filter Keparahan (Severity / Aksi)
  if (severity && severity !== "ALL") {
    if (severity === "MUTATIONS") {
      // Default rekomendasi: Hanya perubahan data, hilangkan banjir LOGIN
      andConditions.push({ aksi: { not: "LOGIN" } })
    } else if (severity === "DELETE") {
      andConditions.push({
        OR: [
          { aksi: { contains: "DELETE", mode: "insensitive" } },
          { aksi: { contains: "HAPUS", mode: "insensitive" } },
          { aksi: { contains: "NONAKTIF", mode: "insensitive" } }
        ]
      })
    } else if (severity === "UPDATE") {
      andConditions.push({
        OR: [
          { aksi: { contains: "UPDATE", mode: "insensitive" } },
          { aksi: { contains: "EDIT", mode: "insensitive" } },
          { aksi: { contains: "GANTI", mode: "insensitive" } }
        ]
      })
    } else if (severity === "CREATE") {
      andConditions.push({
        OR: [
          { aksi: { contains: "CREATE", mode: "insensitive" } },
          { aksi: { contains: "TAMBAH", mode: "insensitive" } },
          { aksi: { contains: "BUAT", mode: "insensitive" } }
        ]
      })
    } else if (severity === "AUTH") {
      andConditions.push({
        OR: [
          { aksi: { contains: "LOGIN", mode: "insensitive" } },
          { modul: "SISTEM" }
        ]
      })
    }
  }

  // 3. Filter Pencarian Teks
  if (search && search.trim()) {
    const s = search.trim()
    andConditions.push({
      OR: [
        { keterangan: { contains: s, mode: "insensitive" } },
        { aksi: { contains: s, mode: "insensitive" } },
        { modul: { contains: s, mode: "insensitive" } },
        { pengguna: { name: { contains: s, mode: "insensitive" } } }
      ]
    })
  }

  // 4. Filter Rentang Tanggal
  if (startDate || endDate) {
    const dateRange: any = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      dateRange.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateRange.lte = end
    }
    andConditions.push({ createdAt: dateRange })
  }

  return andConditions.length > 0 ? { AND: andConditions } : {}
}

export async function getPaginatedAuditLogs(params: {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  modul?: string;
  search?: string;
  severity?: string;
  domainId?: string;
}) {
  const { page, limit } = params
  const where = buildAuditWhere(params)

  const [total, rawLogs] = await Promise.all([
    prisma.logAktivitas.count({ where }),
    prisma.logAktivitas.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        aksi: true,
        modul: true,
        keterangan: true,
        createdAt: true,
        pengguna: { select: { name: true, role: true } }
      }
    })
  ])

  const logs = rawLogs.map((l) => ({
    id: l.id,
    aksi: l.aksi,
    modul: l.modul,
    keterangan: l.keterangan,
    createdAt: l.createdAt.toISOString(),
    penggunaName: l.pengguna?.name || "Sistem",
    penggunaRole: l.pengguna?.role || "SYSTEM"
  }))

  return {
    data: logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1
  }
}

export async function getAllAuditLogsForExport(params: {
  startDate?: string;
  endDate?: string;
  modul?: string;
  search?: string;
  severity?: string;
  domainId?: string;
}) {
  const where = buildAuditWhere(params)

  const rawLogs = await prisma.logAktivitas.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      aksi: true,
      modul: true,
      keterangan: true,
      createdAt: true,
      pengguna: { select: { name: true, role: true } }
    }
  })

  return rawLogs.map((l) => ({
    id: l.id,
    aksi: l.aksi,
    modul: l.modul,
    keterangan: l.keterangan,
    createdAt: l.createdAt.toISOString(),
    penggunaName: l.pengguna?.name || "Sistem",
    penggunaRole: l.pengguna?.role || "SYSTEM"
  }))
}
