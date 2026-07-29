"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getSiswa(unitSekolahId?: string, subKelasId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.murid.findMany({
    where: {
      isDeleted: false,
      ...(unitSekolahId ? { unitSekolahId } : {}),
      ...(subKelasId ? { riwayatKelas: { some: { subKelasId } } } : {}),
    },
    include: {
      riwayatKelas: {
        include: {
          subKelas: {
            include: {
              tingkat: true,
              jurusan: true
            }
          }
        }
      },
      unitSekolah: true
    },
    orderBy: { name: "asc" }
  })
}

export async function getSiswaPaginated(params: {
  unitSekolahId?: string;
  tahunAkademikId?: string; // TAMBAHAN
  subKelasId?: string;
  tingkatId?: string;
  jurusanId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusFilter?: string;
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: any = {
    isDeleted: false,
    ...(params.unitSekolahId ? { unitSekolahId: params.unitSekolahId } : {}),
  }
  
  if (params.statusFilter && params.statusFilter !== 'SEMUA') {
    if (params.statusFilter === 'NON_AKTIF') {
      where.status = { not: 'AKTIF' }
    } else {
      where.status = params.statusFilter
    }
  }

  // Filter by RiwayatKelas if there's any academic filter
  if (params.tahunAkademikId || params.subKelasId || params.tingkatId || params.jurusanId) {
    where.riwayatKelas = {
      some: {
        ...(params.tahunAkademikId ? { tahunAkademikId: params.tahunAkademikId } : {}),
        ...(params.subKelasId ? { subKelasId: params.subKelasId } : {}),
        ...(params.tingkatId || params.jurusanId ? {
          subKelas: {
            ...(params.tingkatId ? { tingkatId: params.tingkatId } : {}),
            ...(params.jurusanId ? { jurusanId: params.jurusanId } : {})
          }
        } : {})
      }
    }
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" as any } },
      { nisn: { contains: params.search, mode: "insensitive" as any } },
      { nis: { contains: params.search, mode: "insensitive" as any } },
    ]
  }
  
  const orderBy: any = {};
  if (params.sortBy) {
    if (params.sortBy === 'unitSekolah.name') {
      orderBy.unitSekolah = { name: params.sortOrder || 'asc' };
    } else {
      orderBy[params.sortBy] = params.sortOrder || 'asc';
    }
  } else {
    orderBy.name = 'asc';
  }

  const [data, total] = await Promise.all([
    prisma.murid.findMany({
      where,
      include: {
        riwayatKelas: {
          where: params.tahunAkademikId ? { tahunAkademikId: params.tahunAkademikId } : undefined,
          include: {
            subKelas: {
              include: {
                tingkat: true,
                jurusan: true
              }
            }
          }
        },
        unitSekolah: true
      },
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.murid.count({ where })
  ])

  return {
    data,
    total,
    totalPages: Math.ceil(total / params.limit)
  }
}

export async function tambahSiswa(data: any) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.$transaction(async (tx) => {
    // Handle optional NIS
    let finalNis = data.nis?.trim()
    if (!finalNis || finalNis === "-") {
      finalNis = null
    }

    if (finalNis) {
      const existingMurid = await tx.murid.findUnique({ where: { nis: finalNis } })
      if (existingMurid) {
        throw new Error(`Siswa dengan NIS / NISN (${finalNis}) sudah terdaftar di sistem.`)
      }
    }

    const { subKelasId, studentStatus, birthDate, riwayatKelas, unitSekolah, subKelas, createdAt, updatedAt, id, parentName, nis, ...muridData } = data as any;

    const murid = await tx.murid.create({
      data: {
        ...muridData,
        nis: finalNis,
        status: studentStatus || data.status || "AKTIF",
        isActive: data.isActive ?? true,
        isScholarship: data.isScholarship ?? false,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {})
      }
    })

    if (data.subKelasId) {
      const subKelas = await tx.subKelas.findUnique({ where: { id: data.subKelasId } })
      if (subKelas) {
        await tx.riwayatKelas.create({
          data: {
            muridId: murid.id,
            subKelasId: subKelas.id,
            tahunAkademikId: subKelas.tahunAkademikId
          }
        })
      }
    }
    
    return murid
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
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.$transaction(async (tx) => {
    // Exclude subKelasId and rename studentStatus -> status
    // Also exclude relation and metadata objects that might be passed from frontend
    const { subKelasId, studentStatus, birthDate, riwayatKelas, unitSekolah, subKelas, createdAt, updatedAt, id, parentName, ...muridData } = data as any;
    
    // Handle optional NIS
    let finalNis = muridData.nis?.trim()
    if (muridData.hasOwnProperty('nis')) {
      if (!finalNis || finalNis === "-") {
        finalNis = null
      }
      
      // Check NIS uniqueness if it's being updated and not null
      if (finalNis) {
        const existingMurid = await tx.murid.findUnique({ where: { nis: finalNis } })
        if (existingMurid && existingMurid.id !== id) {
          throw new Error(`Siswa dengan NIS / NISN (${finalNis}) sudah terdaftar di sistem.`)
        }
      }
      muridData.nis = finalNis
    }
    
    const murid = await tx.murid.update({
      where: { id },
      data: {
        ...muridData,
        ...(studentStatus ? { status: studentStatus } : {}),
        ...(birthDate ? { birthDate: new Date(birthDate) } : {})
      }
    })

    // Update class assignment if subKelasId is provided
    if (subKelasId) {
      const subKelas = await tx.subKelas.findUnique({ where: { id: subKelasId } })
      if (subKelas) {
        // Upsert RiwayatKelas for this student in this academic year
        const existingRiwayat = await tx.riwayatKelas.findUnique({
          where: {
            muridId_tahunAkademikId: {
              muridId: id,
              tahunAkademikId: subKelas.tahunAkademikId
            }
          }
        })

        if (existingRiwayat) {
          await tx.riwayatKelas.update({
            where: { id: existingRiwayat.id },
            data: { subKelasId: subKelas.id }
          })
        } else {
          await tx.riwayatKelas.create({
            data: {
              muridId: id,
              subKelasId: subKelas.id,
              tahunAkademikId: subKelas.tahunAkademikId
            }
          })
        }
      }
    }

    return murid;
  })

  revalidatePath("/data-master")
  return result
}

export async function importSiswaBulk(studentsData: any[]) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.murid.createMany({
    data: studentsData
  })

  revalidatePath("/data-master")
  return result
}

export async function hapusSiswa(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")
  const result = await prisma.murid.update({
    where: { id },
    data: { 
      isDeleted: true,
      isActive: false,
      status: "TERHAPUS"
    }
  })
  revalidatePath("/data-master")
  return result
}

export async function hapusSiswaBatch(ids: string[]) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")
  
  const result = await prisma.murid.updateMany({
    where: { id: { in: ids } },
    data: { 
      isDeleted: true,
      isActive: false,
      status: "TERHAPUS"
    }
  })
  
  revalidatePath("/data-master")
  return { success: result.count }
}

export async function promoteSiswaBatch(muridIds: string[], newSubKelasId: string, targetTahunAkademikId?: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  let tahunAkademikId = targetTahunAkademikId;
  if (!tahunAkademikId) {
    const activeTahun = await prisma.tahunAkademik.findFirst({
      where: { isActive: true },
      select: { id: true }
    })
    if (!activeTahun) throw new Error("Tahun akademik aktif tidak ditemukan")
    tahunAkademikId = activeTahun.id;
  }

  let successCount = 0
  
  await prisma.$transaction(async (tx) => {
    for (const muridId of muridIds) {
      const existing = await tx.riwayatKelas.findFirst({
        where: {
          muridId,
          tahunAkademikId
        }
      })

      if (existing) {
        await tx.riwayatKelas.update({
          where: { id: existing.id },
          data: { subKelasId: newSubKelasId }
        })
      } else {
        await tx.riwayatKelas.create({
          data: {
            muridId,
            subKelasId: newSubKelasId,
            tahunAkademikId
          }
        })
      }
      successCount++
    }
  })

  revalidatePath("/kelas")
  return { success: successCount }
}

export async function luluskanSiswaBatch(muridIds: string[]) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.murid.updateMany({
    where: {
      id: { in: muridIds }
    },
    data: {
      status: "ALUMNI",
      isActive: false
    }
  })

  revalidatePath("/kelas")
  return { success: result.count }
}
