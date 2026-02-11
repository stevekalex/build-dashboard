import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

describe('Login API Route - Happy Path', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'testpassword')
  })

  it('should return 200 for correct password', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpassword', name: 'John Doe' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should set session cookie on successful login', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpassword', name: 'John Doe' }),
    })

    const response = await POST(request)
    const setCookieHeader = response.headers.get('set-cookie')

    expect(setCookieHeader).toBeTruthy()
    expect(setCookieHeader).toContain('session=')
  })
})

describe('Login API Route - Edge Cases', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'testpassword')
  })

  it('should return 401 for incorrect password', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrongpassword', name: 'John Doe' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid password')
  })

  it('should return 400 for missing password', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name: 'John Doe' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing name', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpassword' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should trim whitespace from name', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpassword', name: '  John Doe  ' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain('John%20Doe') // URL encoded
  })
})
