import { sql } from '@vercel/postgres'

// ── Schema init (gọi lần đầu hoặc khi cold start) ──────────────────────────
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS gift_leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      email_sent BOOLEAN DEFAULT FALSE
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS course_leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_ref TEXT UNIQUE,
      payment_status TEXT DEFAULT 'pending',
      amount INTEGER DEFAULT 138000,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      email_sent BOOLEAN DEFAULT FALSE,
      telegram_sent BOOLEAN DEFAULT FALSE
    );
  `
}

// ── Gift leads ──────────────────────────────────────────────────────────────
export async function insertGiftLead(data: { name: string; email: string; phone: string }) {
  const result = await sql`
    INSERT INTO gift_leads (name, email, phone)
    VALUES (${data.name}, ${data.email}, ${data.phone})
    RETURNING id
  `
  return result.rows[0].id as number
}

export async function markGiftEmailSent(id: number) {
  await sql`UPDATE gift_leads SET email_sent = TRUE WHERE id = ${id}`
}

export async function getAllGiftLeads() {
  const result = await sql`SELECT * FROM gift_leads ORDER BY created_at DESC`
  return result.rows as GiftLead[]
}

// ── Course leads ────────────────────────────────────────────────────────────
export async function insertCourseLead(data: {
  name: string; email: string; phone: string; paymentRef: string
}) {
  const result = await sql`
    INSERT INTO course_leads (name, email, phone, payment_ref)
    VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.paymentRef})
    ON CONFLICT (payment_ref) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone
    RETURNING id
  `
  return result.rows[0].id as number
}

export async function confirmPayment(paymentRef: string) {
  await sql`
    UPDATE course_leads
    SET payment_status = 'paid', paid_at = NOW()
    WHERE payment_ref = ${paymentRef}
  `
}

export async function getLeadByRef(paymentRef: string) {
  const result = await sql`
    SELECT * FROM course_leads WHERE payment_ref = ${paymentRef}
  `
  return result.rows[0] as CourseLead | undefined
}

export async function markCourseEmailSent(id: number) {
  await sql`UPDATE course_leads SET email_sent = TRUE WHERE id = ${id}`
}

export async function markTelegramSent(id: number) {
  await sql`UPDATE course_leads SET telegram_sent = TRUE WHERE id = ${id}`
}

export async function getAllCourseLeads() {
  const result = await sql`SELECT * FROM course_leads ORDER BY created_at DESC`
  return result.rows as CourseLead[]
}

// ── Compat shim để không phải sửa các file dùng markEmailSent cũ ────────────
export async function markEmailSent(table: 'gift_leads' | 'course_leads', id: number) {
  if (table === 'gift_leads') return markGiftEmailSent(id)
  return markCourseEmailSent(id)
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface GiftLead {
  id: number
  name: string
  email: string
  phone: string
  created_at: string
  email_sent: boolean
}

export interface CourseLead {
  id: number
  name: string
  email: string
  phone: string
  payment_ref: string
  payment_status: string
  amount: number
  paid_at: string | null
  created_at: string
  email_sent: boolean
  telegram_sent: boolean
}
