'use client'

import { useEffect, useRef } from 'react'

export function UserActivityTracker() {
  const lastPingRef = useRef<number>(0)

  useEffect(() => {
    // Fungsi untuk ping API hanya jika tab browser sedang aktif dilihat
    const pingActivity = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      const now = Date.now()
      // Throttle: minimal 5 menit jarak antar ping untuk cegah spam invocations
      if (now - lastPingRef.current < 5 * 60 * 1000) {
        return
      }
      lastPingRef.current = now

      fetch('/api/ping', { method: 'POST' })
        .catch(err => console.error('Ping activity failed:', err))
    }

    // Ping pertama kali saat komponen di-mount jika tab aktif
    pingActivity()

    // Ping berkala setiap 15 menit hanya jika tab aktif (menghemat 33% pemanggilan fungsi idle)
    const interval = setInterval(pingActivity, 15 * 60 * 1000)

    // Trigger saat pengguna kembali ke tab aktif dari aplikasi lain
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pingActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Komponen ini tidak merender apapun (invisible)
  return null
}

