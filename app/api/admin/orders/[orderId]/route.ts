import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const orderId = params.orderId
    const body = await request.json()
    const supabase = await createClient()

    const updateData: any = { status: body.status }

    // Set timestamps based on status
    if (body.status === 'confirmed' && !body.confirmed_at) {
      updateData.confirmed_at = new Date().toISOString()
    } else if (body.status === 'ready' && !body.ready_at) {
      updateData.ready_at = new Date().toISOString()
    } else if (body.status === 'delivered' && !body.delivered_at) {
      updateData.delivered_at = new Date().toISOString()
    }

    if (body.cancellation_reason) {
      updateData.cancellation_reason = body.cancellation_reason
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        user:users(id, full_name, email, andrew_id),
        restaurant:restaurants(id, name, logo_url),
        order_items:order_items(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to update order: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: order, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}