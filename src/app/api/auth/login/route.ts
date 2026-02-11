import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, name } = body

    // Validate required fields
    if (!password || !name) {
      return NextResponse.json(
        { error: 'Password and name are required' },
        { status: 400 }
      )
    }

    // Trim whitespace from name
    const trimmedName = name.trim()

    // Verify password
    const adminPassword = process.env.ADMIN_PASSWORD
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Create session cookie with name
    const response = NextResponse.json({ success: true })
    response.cookies.set('session', JSON.stringify({ name: trimmedName }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
