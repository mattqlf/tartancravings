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
  context: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const categoryId = params?.categoryId
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required.' },
        { status: 400 }
      )
    }
    const body = await request.json()
    const supabase = await createClient()

    const { data: category, error } = await supabase
      .from('menu_categories')
      .update({
        name: body.name,
        description: body.description,
        display_order: body.display_order,
        is_active: body.is_active
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to update category: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: category, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const categoryId = params?.categoryId
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required.' },
        { status: 400 }
      )
    }
    const supabase = await createClient()

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to delete category: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
