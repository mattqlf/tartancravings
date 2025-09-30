"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AdminGuardProps {
  children: React.ReactNode
}

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

export function AdminGuard({ children }: AdminGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null

      setUser(currentUser)

      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        if (currentUser) {
          // User is logged in but not admin
          router.push('/')
        } else {
          // User not logged in
          router.push('/auth/signin')
        }
      }

      setLoading(false)
    }

    checkAdminAccess()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser && currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          if (currentUser) {
            router.push('/')
          } else {
            router.push('/auth/signin')
          }
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cmu-red mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This area is restricted to administrators only.
          </p>
          <p className="text-sm text-gray-500">
            Current user: {user?.email || 'Not logged in'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}