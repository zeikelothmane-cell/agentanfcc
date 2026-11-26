import { describe, it, expect, vi } from 'vitest'
import { authenticate } from './security.js'
import type { Request, Response } from 'express'
describe('API authentication', () => {
  it.each([undefined, '', 'Basic abc', 'Bearer '])('rejects missing or malformed credentials: %s', async authorization => {
    const req = { headers: { authorization } } as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn()
    await authenticate(req,res,next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
