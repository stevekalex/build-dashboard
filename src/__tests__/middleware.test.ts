import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

describe('Auth Middleware - Happy Path', () => {
  it('should allow access to login page without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/login')
    const response = await middleware(request)

    expect(response.status).not.toBe(307) // Not redirecting
  })

  it('should allow access to dashboard with valid session', async () => {
    const request = new NextRequest('http://localhost:3000/')
    request.cookies.set('session', JSON.stringify({ name: 'John Doe' }))

    const response = await middleware(request)

    // Should continue to page (NextResponse.next())
    expect(response.status).not.toBe(307) // Not redirecting
  })
})

describe('Auth Middleware - Edge Cases', () => {
  it('should redirect to login if no session cookie on protected route', async () => {
    const request = new NextRequest('http://localhost:3000/')

    const response = await middleware(request)

    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toContain('/login')
  })

  it('should redirect to login if session cookie is invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/')
    request.cookies.set('session', 'invalid-json')

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('should redirect to login if session has no name', async () => {
    const request = new NextRequest('http://localhost:3000/')
    request.cookies.set('session', JSON.stringify({}))

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('should allow access to API routes without redirect', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })

  it('should allow access to static files without redirect', async () => {
    const request = new NextRequest('http://localhost:3000/_next/static/file.js')

    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })
})
