import { NextRequest, NextResponse } from 'next/server'
import { initDb, getAllGiftLeads, getAllCourseLeads } from '@/lib/db'

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'hacofood2024'
  return req.headers.get('x-admin-password') === adminPassword
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await initDb()
  const giftLeads = await getAllGiftLeads()
  const courseLeads = await getAllCourseLeads()

  return NextResponse.json({
    giftLeads,
    courseLeads,
    stats: {
      totalGiftLeads: giftLeads.length,
      totalCourseLeads: courseLeads.length,
      paidLeads: courseLeads.filter((l) => l.payment_status === 'paid').length,
      revenue: courseLeads.filter((l) => l.payment_status === 'paid').length * 138000,
    },
  })
}
