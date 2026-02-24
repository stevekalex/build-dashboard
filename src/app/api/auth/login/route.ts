import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import { captureError } from '@/lib/sentry'

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

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

    // Verify password (supports bcrypt hash or plaintext with timing-safe compare)
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const isBcryptHash = adminPassword.startsWith('$2')
    const isValid = isBcryptHash
      ? await bcrypt.compare(password, adminPassword)
      : timingSafeCompare(password, adminPassword)

    if (!isValid) {
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
    // JSON parse errors → 400 (malformed body). Everything else → 500.
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    captureError(error, { action: 'loginRoute' })
    console.error('Login route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
