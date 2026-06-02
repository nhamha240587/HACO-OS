import { NextRequest, NextResponse } from 'next/server'
import { initDb, getLeadByRef } from '@/lib/db'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ paid: false })
  await initDb()
  const lead = await getLeadByRef(ref)
  return NextResponse.json({ paid: lead?.payment_status === 'paid' })
}
