'use client'

import { useEffect } from 'react'

export function UserActivityTracker() {
  useEffect(() => {
    // Fungsi untuk ping API
    const pingActivity = () => {
      fetch('/api/ping', { method: 'POST' })
        .catch(err => console.error('Ping activity failed:', err))
    }

    // Ping pertama kali saat komponen di-mount (saat user buka aplikasi)
    pingActivity()

    // Ping setiap 10 menit (agar selalu update)
    const interval = setInterval(pingActivity, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Komponen ini tidak merender apapun (invisible)
  return null
}
