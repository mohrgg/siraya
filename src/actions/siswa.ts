"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

const cleanDash = (val: any) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === "-" || trimmed === "") return null;
    return trimmed;
  }
  return val;
};

export async function getSiswa(unitSekolahId?: string, subKelasId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: any = {
    isDeleted: false,
    ...(session.user.role !== "ADMIN" && session.user.unitSekolahId ? { unitSekolahId: session.user.unitSekolahId } : (unitSekolahId ? { unitSekolahId } : {})),
  }

  if (subKelasId) {
    const latestRiwayat = await prisma.riwayatKelas.findMany({
      orderBy: { createdAt: 'desc' },
      distinct: ['muridId'],
      select: { muridId: true, subKelasId: true }
    })
    const filteredMuridIds = latestRiwayat.filter(r => r.subKelasId === subKelasId).map(r => r.muridId)
    where.id = { in: filteredMuridIds }
  }

  return prisma.murid.findMany({
    where,
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
    ...(session.user.role !== "ADMIN" && session.user.unitSekolahId ? { unitSekolahId: session.user.unitSekolahId } : (params.unitSekolahId && params.unitSekolahId !== "all" ? { unitSekolahId: params.unitSekolahId } : {})),
  }
  
  if (params.statusFilter && params.statusFilter !== 'SEMUA') {
    if (params.statusFilter === 'NON_AKTIF') {
      where.status = { not: 'AKTIF' }
    } else {
      where.status = params.statusFilter
    }
  }

  // Filter by RiwayatKelas if there's any specific class filter (tingkat, jurusan, subKelas)
  if (params.subKelasId || params.tingkatId || params.jurusanId) {
    const latestRiwayat = await prisma.riwayatKelas.findMany({
      where: {
        ...(params.tahunAkademikId ? { tahunAkademikId: params.tahunAkademikId } : {})
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['muridId'],
      select: {
        muridId: true,
        subKelasId: true,
        subKelas: {
          select: { tingkatId: true, jurusanId: true }
        }
      }
    })

    const filteredMuridIds = latestRiwayat
      .filter(r => {
        if (params.subKelasId && r.subKelasId !== params.subKelasId) return false;
        if (params.tingkatId && r.subKelas?.tingkatId !== params.tingkatId) return false;
        if (params.jurusanId && r.subKelas?.jurusanId !== params.jurusanId) return false;
        return true;
      })
      .map(r => r.muridId)

    console.log(`[DEBUG] getSiswaPaginated params:`, params);
    console.log(`[DEBUG] filteredMuridIds length:`, filteredMuridIds.length);
    console.log(`[DEBUG] latestRiwayat length:`, latestRiwayat.length);
    const sample = latestRiwayat.find(r => r.subKelas?.name === 'Kelas 2 A');
    console.log(`[DEBUG] sample Kelas 2 A in latestRiwayat:`, sample);

    where.id = { in: filteredMuridIds }
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
          orderBy: { createdAt: 'desc' },
          take: 1,
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

    // Generate Custom Student ID
    const currentYear = new Date().getFullYear().toString();
    const unit = await tx.unitSekolah.findUnique({ where: { id: muridData.unitSekolahId } });
    const level = unit?.level?.toUpperCase() || "XX";
    
    let dobStr = "000000";
    if (birthDate) {
      const d = new Date(birthDate);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      dobStr = `${dd}${mm}${yy}`;
    }
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const customId = `${currentYear}${level}-${dobStr}-${randomStr}`;

    const murid = await tx.murid.create({
      data: {
        id: customId,
        ...muridData,
        nisn: cleanDash(muridData.nisn),
        nik: cleanDash(muridData.nik),
        fatherNik: cleanDash(muridData.fatherNik),
        motherNik: cleanDash(muridData.motherNik),
        guardianNik: cleanDash(muridData.guardianNik),
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
    const { subKelasId, studentStatus, birthDate, riwayatKelas, unitSekolah, subKelas, tagihan, summaryKeuangan, createdAt, updatedAt, id, parentName, ...muridData } = data as any;
    
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
        nisn: cleanDash(muridData.nisn),
        nik: cleanDash(muridData.nik),
        fatherNik: cleanDash(muridData.fatherNik),
        motherNik: cleanDash(muridData.motherNik),
        guardianNik: cleanDash(muridData.guardianNik),
        ...(studentStatus ? { status: studentStatus } : {}),
        ...(birthDate ? { birthDate: new Date(birthDate) } : {})
      }
    })

    // Update class assignment if subKelasId is provided
    if (subKelasId) {
      const subKelas = await tx.subKelas.findUnique({ where: { id: subKelasId } })
      if (subKelas) {
        // Check current latest RiwayatKelas for this student in this academic year
        const existingRiwayat = await tx.riwayatKelas.findFirst({
          where: {
            muridId: id,
            tahunAkademikId: subKelas.tahunAkademikId
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // Append a new history log ONLY if the subKelasId is different from the current one
        if (!existingRiwayat || existingRiwayat.subKelasId !== subKelas.id) {
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
  
  const targetSubKelas = await prisma.subKelas.findUnique({
    where: { id: newSubKelasId }
  })
  if (!targetSubKelas) throw new Error("Kelas tujuan tidak ditemukan.")

  if (session.user.role !== "ADMIN" && targetSubKelas.unitSekolahId !== session.user.unitSekolahId) {
    throw new Error("Anda tidak memiliki akses ke unit sekolah tujuan.")
  }

  // Fetch the latest class for each student
  const latestRecords = await prisma.riwayatKelas.findMany({
    where: { muridId: { in: muridIds } },
    orderBy: { createdAt: 'desc' },
    distinct: ['muridId']
  })

  // Filter out students who are already in the target subKelas
  const alreadyInTargetIds = new Set(
    latestRecords.filter(r => r.subKelasId === newSubKelasId).map(r => r.muridId)
  )

  const recordsToCreate = muridIds
    .filter(id => !alreadyInTargetIds.has(id))
    .map(id => ({
      muridId: id,
      subKelasId: newSubKelasId,
      tahunAkademikId
    }))

  if (recordsToCreate.length > 0) {
    await prisma.riwayatKelas.createMany({
      data: recordsToCreate
    })
  }

  successCount = muridIds.length

  revalidatePath("/kelas")
  return { success: successCount }
}

export async function luluskanSiswaBatch(muridIds: string[]) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  // Cek unit akses
  if (session.user.role !== "ADMIN") {
    const muridCount = await prisma.murid.count({
      where: {
        id: { in: muridIds },
        unitSekolahId: { not: session.user.unitSekolahId as string }
      }
    })
    if (muridCount > 0) {
      throw new Error("Sebagian siswa yang dipilih bukan dari unit Anda.")
    }
  }

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

export async function pindahkanSiswaBatch(muridIds: string[]) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  // Cek unit akses
  if (session.user.role !== "ADMIN") {
    const muridCount = await prisma.murid.count({
      where: {
        id: { in: muridIds },
        unitSekolahId: { not: session.user.unitSekolahId as string }
      }
    })
    if (muridCount > 0) {
      throw new Error("Sebagian siswa yang dipilih bukan dari unit Anda.")
    }
  }

  const result = await prisma.murid.updateMany({
    where: {
      id: { in: muridIds }
    },
    data: {
      status: "PINDAH",
      isActive: false
    }
  })

  revalidatePath("/kelas")
  return { success: result.count }
}

export async function reactivateSiswa(muridId: string, newSubKelasId: string, targetTahunAkademikId?: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const murid = await prisma.murid.findUnique({ where: { id: muridId } })
  if (!murid) throw new Error("Siswa tidak ditemukan")

  if (session.user.role !== "ADMIN" && murid.unitSekolahId !== session.user.unitSekolahId) {
    throw new Error("Anda tidak memiliki akses ke siswa ini.")
  }

  let tahunAkademikId = targetTahunAkademikId;
  if (!tahunAkademikId) {
    const activeTahun = await prisma.tahunAkademik.findFirst({
      where: { isActive: true },
      select: { id: true }
    })
    if (!activeTahun) throw new Error("Tahun akademik aktif tidak ditemukan")
    tahunAkademikId = activeTahun.id;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Ubah status kembali menjadi AKTIF
    await tx.murid.update({
      where: { id: muridId },
      data: { status: "AKTIF", isActive: true }
    })

    // 2. Cek riwayat kelas terakhir, jika belum ada atau berbeda kelas, buatkan
    const existing = await tx.riwayatKelas.findFirst({
      where: { muridId, tahunAkademikId },
      orderBy: { createdAt: 'desc' }
    })

    if (!existing || existing.subKelasId !== newSubKelasId) {
      await tx.riwayatKelas.create({
        data: {
          muridId,
          subKelasId: newSubKelasId,
          tahunAkademikId
        }
      })
    }
  })

  revalidatePath("/kelas")
  return { success: true }
}
