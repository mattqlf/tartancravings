"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

export function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAdmin(session?.user?.email === ADMIN_EMAIL)
    }

    checkAdminStatus()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(session?.user?.email === ADMIN_EMAIL)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (!isAdmin) {
    return null
  }

  return (
    <Link
      href="/admin"
      className="text-gray-700 hover:text-cmu-red transition-colors font-medium flex items-center gap-1"
    >
      <span>⚙️</span>
      Admin
    </Link>
  )
}