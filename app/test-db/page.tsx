"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDBPage() {
  const [status, setStatus] = useState('Testing database connection...')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()

        // Test basic connection
        setStatus('Testing Supabase connection...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session)

        // Test table access
        setStatus('Testing table access...')
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, name')
          .limit(5)

        if (error) {
          setStatus(`Database error: ${error.message}`)
          setDetails(error)
        } else {
          setStatus(`Success! Found ${restaurants?.length || 0} restaurants`)
          setDetails(restaurants)
        }

      } catch (error) {
        setStatus(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setDetails(error)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="font-medium">Status: {status}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded">
        <h2 className="font-medium mb-2">Details:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <h2 className="font-medium mb-2">Environment Check:</h2>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
        <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  )
}