'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData { name: string; email: string; phone: string }
interface QRData {
  qrUrl: string
  bankAccount: string
  bankCode: string
  accountName: string
  amount: number
  content: string
  paymentRef: string
}
type Step = 'idle' | 'loading' | 'success' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function useCountdown(hours = 24) {
  const [time, setTime] = useState({ h: hours, m: 0, s: 0 })
  useEffect(() => {
    const stored = localStorage.getItem('haco_countdown')
    let end: number
    if (stored) {
      end = parseInt(stored)
    } else {
      end = Date.now() + hours * 3600 * 1000
      localStorage.setItem('haco_countdown', String(end))
    }
    const tick = () => {
      const diff = Math.max(0, end - Date.now())
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [hours])
  return time
}

// ─── Form Component ───────────────────────────────────────────────────────────
function LeadForm({
  title,
  subtitle,
  ctaText,
  ctaColor,
  onSuccess,
}: {
  title: string
  subtitle: string
  ctaText: string
  ctaColor: string
  onSuccess: (data: FormData) => void
}) {
  const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '' })
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Vui lòng điền đầy đủ 3 thông tin')
      return
    }
    setStep('loading')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi')
      setStep('success')
      onSuccess({ ...form, ...data })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
      setStep('error')
    }
  }

  const endpoint = ctaColor === 'red' ? '/api/course-form' : '/api/gift-form'

  return (
    <form onSubmit={(e) => handleSubmit(e, endpoint)} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
      {(['name', 'email', 'phone'] as const).map((field) => (
        <div key={field}>
          <input
            name={field}
            type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
            placeholder={field === 'name' ? '👤 Họ và tên *' : field === 'email' ? '📧 Email *' : '📞 Số điện thoại *'}
            value={form[field]}
            onChange={handleChange}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-amber-400 focus:outline-none transition-colors placeholder-gray-400"
          />
        </div>
      ))}
      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={step === 'loading'}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all transform active:scale-95 disabled:opacity-60 ${
          ctaColor === 'red'
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200'
        }`}
      >
        {step === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang xử lý...
          </span>
        ) : ctaText}
      </button>
      <p className="text-xs text-gray-400 text-center">🔒 Thông tin của bạn được bảo mật tuyệt đối</p>
    </form>
  )
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ qr, onClose, onPaid }: { qr: QRData; onClose: () => void; onPaid: () => void }) {
  const [checking, setChecking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 min
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  // Poll for payment confirmation
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment?ref=${qr.paymentRef}`)
        if (res.ok) {
          const data = await res.json()
          if (data.paid) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            onPaid()
          }
        }
      } catch { /* silent */ }
    }, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [qr.paymentRef, onPaid])

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Thanh toán chuyển khoản</h3>
            <p className="text-green-100 text-sm">Quét mã QR hoặc chuyển khoản thủ công</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {/* Countdown */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
              <span className="text-amber-600 text-sm">⏱ Hết hạn sau:</span>
              <span className="font-mono font-bold text-amber-700 text-lg">{mins}:{secs}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr.qrUrl}
                alt="QR thanh toán"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`STK:${qr.bankAccount} NH:${qr.bankCode} ${formatPrice(qr.amount)} ND:${qr.content}`)}`
                }}
              />
            </div>
          </div>

          {/* Bank info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ngân hàng</span>
              <span className="font-semibold text-gray-800">{qr.bankCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tài khoản</span>
              <button
                className="font-mono font-bold text-blue-600 hover:text-blue-700"
                onClick={() => navigator.clipboard?.writeText(qr.bankAccount)}
                title="Nhấn để sao chép"
              >
                {qr.bankAccount} 📋
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chủ TK</span>
              <span className="font-semibold text-gray-800 uppercase">{qr.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-bold text-green-600 text-base">{formatPrice(qr.amount)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-500">Nội dung CK</span>
              <button
                className="font-mono font-bold text-red-600 hover:text-red-700 text-right"
                onClick={() => navigator.clipboard?.writeText(qr.content)}
                title="Nhấn để sao chép"
              >
                {qr.content} 📋
              </button>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 text-center">
            ⚠️ <strong>Quan trọng:</strong> Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận
          </div>

          <button
            onClick={() => { setChecking(true); setTimeout(onPaid, 1000) }}
            disabled={checking}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {checking ? 'Đang kiểm tra...' : '✅ Tôi đã chuyển khoản xong'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Hệ thống sẽ tự động xác nhận và gửi thông tin qua email trong vài phút
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ type, name, onClose }: { type: 'gift' | 'course'; name: string; onClose: () => void }) {
  const courseGroupLink = process.env.NEXT_PUBLIC_COURSE_GROUP_LINK || '#'
  const communityGroupLink = process.env.NEXT_PUBLIC_COMMUNITY_GROUP_LINK || '#'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-center">
        <div className={`px-6 py-8 ${type === 'course' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'}`}>
          <div className="text-6xl mb-3">{type === 'course' ? '🎉' : '🎁'}</div>
          <h2 className="text-white text-2xl font-bold">
            {type === 'course' ? 'Thanh toán thành công!' : 'Đã gửi quà cho bạn!'}
          </h2>
          <p className="text-white/90 mt-2">Xin chào {name} 👋</p>
        </div>
        <div className="p-6">
          {type === 'course' ? (
            <>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Chúc mừng bạn đã tham gia <strong>Khóa học Dưa Cà Muối Chuyên Sâu!</strong><br />
                Cô Hạ đã gửi thông tin chi tiết qua email của bạn.
              </p>
              <a
                href={courseGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
              >
                👥 Vào Group Học Viên Ngay
              </a>
              <p className="text-xs text-gray-400 mt-3">Toàn bộ video bài giảng có trong group Facebook</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Cô Hạ đã gửi <strong>công thức & video Cà Muối Mắm</strong> vào email của bạn.<br />
                Kiểm tra hộp thư nhé (kể cả spam)! 📬
              </p>
              <a
                href={communityGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
              >
                👥 Vào Group Cộng Đồng Miễn Phí
              </a>
              <p className="text-xs text-gray-400 mt-3">Group có thêm nhiều video hướng dẫn hay từ Cô Hạ</p>
            </>
          )}
          <button onClick={onClose} className="mt-4 text-gray-400 text-sm hover:text-gray-600 underline">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function KhoaHocDuaCaMuoi() {
  const countdown = useCountdown(24)
  const [giftSuccess, setGiftSuccess] = useState(false)
  const [giftName, setGiftName] = useState('')
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [courseSuccess, setCourseSuccess] = useState(false)
  const [courseName, setCourseName] = useState('')
  const courseSectionRef = useRef<HTMLDivElement>(null)

  const scrollToCourse = () => {
    courseSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#fdf6ee] font-sans">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-repeat" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-block bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6 animate-bounce">
            🔥 Ưu đãi đặc biệt – Chỉ hôm nay!
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Bí Quyết Làm<br />
            <span className="text-amber-300">Dưa Cà Muối Ngon</span><br />
            Chuẩn Vị Từ Cô Hạ
          </h1>
          <p className="text-amber-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Từ dưa cải bẹ, dưa góp, cà muối mắm đến sung cà muối – học một lần, làm ngon mãi mãi.
            Dùng cho gia đình hoặc kinh doanh đều được!
          </p>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: '👩‍🍳', text: '149+ học viên' },
              { icon: '⭐', text: '5.0 đánh giá' },
              { icon: '📹', text: '20+ video bài học' },
              { icon: '🔄', text: 'Học trọn đời' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm">
                <span>{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Hero image collage */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto rounded-2xl overflow-hidden">
            <div className="col-span-2 aspect-[4/3] bg-amber-200 rounded-xl overflow-hidden">
              <img src="/images/hero-jars.jpg" alt="Các lọ dưa cà" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
              <div className="w-full h-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-6xl">🥒</div>
            </div>
            <div className="aspect-square bg-amber-200 rounded-xl overflow-hidden relative">
              <img src="/images/dua-cai.jpg" alt="Dưa cải" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
              <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-4xl">🥬</div>
            </div>
            <div className="aspect-square bg-amber-200 rounded-xl overflow-hidden">
              <img src="/images/ca-muoi.jpg" alt="Cà muối" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
              <div className="w-full h-full bg-gradient-to-br from-orange-300 to-red-400 flex items-center justify-center text-4xl">🌶️</div>
            </div>
          </div>

          <button
            onClick={scrollToCourse}
            className="mt-10 bg-white text-amber-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:bg-amber-50 transition-colors"
          >
            Xem khóa học ngay →
          </button>
        </div>
      </section>

      {/* ── FLOW 1: GIFT FORM ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block text-4xl mb-3">🎁</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-3">
              Nhận Ngay Quà Tặng <span className="text-amber-600">MIỄN PHÍ</span> Từ Cô Hạ
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
              Điền thông tin bên dưới – Cô Hạ sẽ gửi ngay vào email bạn:<br />
              <strong>📹 Video làm Cà Muối Mắm + 📄 Công thức chi tiết</strong>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
            {/* What you get */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: '🎬', title: 'Video hướng dẫn', desc: 'Cà muối mắm từ A-Z' },
                { icon: '📋', title: 'Công thức chi tiết', desc: 'Tỷ lệ chuẩn, dễ làm' },
                { icon: '👥', title: 'Group cộng đồng', desc: '149+ chị em chia sẻ' },
                { icon: '🆓', title: 'Hoàn toàn miễn phí', desc: 'Không điều kiện' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 bg-amber-50 rounded-xl p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <LeadForm
              title=""
              subtitle=""
              ctaText="🎁 Gửi quà cho tôi ngay!"
              ctaColor="amber"
              onSuccess={(data) => {
                setGiftName(data.name)
                setGiftSuccess(true)
              }}
            />
          </div>
        </div>
      </section>

      {/* ── SEPARATOR ── */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-300" />
          <div className="text-2xl">🌟</div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-300" />
        </div>
      </div>

      {/* ── FLOW 2: COURSE SECTION ── */}
      <section ref={courseSectionRef} id="khoa-hoc" className="py-16 px-4 scroll-mt-8">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-red-100 text-red-600 font-bold text-sm px-4 py-1.5 rounded-full mb-4">
              KHÓA HỌC CHUYÊN SÂU
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-4">
              Dưa Cà Muối Chuyên Sâu –<br />
              <span className="text-red-600">Từ Gia Đình Đến Kinh Doanh</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-lg">
              Khóa học bài bản nhất về dưa cà muối. Cô Hạ dạy từng bước, từng công thức –
              bạn học xong là làm được ngay, ngon như hàng bán.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: Course content */}
            <div className="space-y-6">
              {/* What's included */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg mb-4">📚 Bạn sẽ học được gì?</h3>
                <ul className="space-y-3">
                  {[
                    ['🥬', 'Dưa cải bẹ muối chua', 'Đúng chuẩn, không bị nhớt, ăn giòn'],
                    ['🥒', 'Dưa góp', 'Màu đẹp, chua ngọt vừa miệng'],
                    ['🍅', 'Sung cà muối chua ngọt', 'Bí quyết giữ được lâu không hỏng'],
                    ['🥕', 'Dưa củ cải cà rốt', 'Đủ màu sắc, làm quà biếu rất sang'],
                    ['🌶️', 'Cà muối mắm', 'Thơm đậm đà, chuẩn vị Nam Bộ'],
                    ['🐦', 'Trứng cút ngâm sốt cay', 'Món nhậu hot trend, bán rất chạy'],
                    ['💼', 'Kinh doanh dưa cà', 'Định giá, đóng gói, tìm mối'],
                  ].map(([icon, title, desc]) => (
                    <li key={title} className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{title}</p>
                        <p className="text-gray-500 text-xs">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bonuses */}
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="font-bold text-amber-800 text-lg mb-4">🎁 Bonus đi kèm</h3>
                <ul className="space-y-2">
                  {[
                    'Công thức nước ngâm chuẩn tỷ lệ',
                    'Hướng dẫn chọn nguyên liệu tươi ngon',
                    'Bí quyết bảo quản để bán được lâu',
                    'Group hỗ trợ học viên 24/7',
                    'Cập nhật thêm công thức mới mãi mãi',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-amber-900">
                      <span className="text-green-500 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testimonials */}
              <div className="space-y-4">
                {[
                  { name: 'Chị Lan – Hà Nội', text: 'Học xong là làm được ngay, cả nhà khen nức nở! Mấy hũ dưa cải của tôi giờ không đủ bán 😄', avatar: '👩' },
                  { name: 'Chị Mai – TP.HCM', text: 'Công thức chi tiết lắm, cô Hạ giải thích rõ ràng từng bước. Đáng tiền lắm chị em ơi!', avatar: '👩‍🦱' },
                  { name: 'Chị Hương – Đà Nẵng', text: 'Tôi mở hàng bán dưa cà sau khi học khóa này, khách hàng phản hồi rất tốt 🙏', avatar: '👩‍🦳' },
                ].map((t) => (
                  <div key={t.name} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{t.avatar}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                        <div className="flex text-amber-400 text-xs">★★★★★</div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm italic">"{t.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Pricing + Form */}
            <div className="sticky top-4">
              {/* Countdown */}
              <div className="bg-red-600 text-white rounded-2xl p-4 mb-4 text-center">
                <p className="text-sm font-medium text-red-100 mb-2">⏰ Giá ưu đãi kết thúc sau:</p>
                <div className="flex justify-center gap-3">
                  {[
                    { value: countdown.h.toString().padStart(2, '0'), label: 'Giờ' },
                    { value: countdown.m.toString().padStart(2, '0'), label: 'Phút' },
                    { value: countdown.s.toString().padStart(2, '0'), label: 'Giây' },
                  ].map(({ value, label }) => (
                    <div key={label} className="bg-white/20 rounded-lg px-3 py-2 min-w-[52px]">
                      <div className="font-mono text-2xl font-bold">{value}</div>
                      <div className="text-xs text-red-200">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price card */}
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-center">
                  <p className="text-white/80 text-sm line-through mb-1">Giá gốc: 999.000đ</p>
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-white text-4xl font-extrabold">138.000đ</span>
                  </div>
                  <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full mt-2">
                    Tiết kiệm 861.000đ – Giảm 86%!
                  </div>
                </div>

                <div className="p-6">
                  <LeadForm
                    title="Đăng ký học ngay"
                    subtitle="Điền thông tin để chuyển sang trang thanh toán"
                    ctaText="🎓 Đăng ký học – 138.000đ"
                    ctaColor="red"
                    onSuccess={(data: FormData & { qr?: QRData; paymentRef?: string }) => {
                      setCourseName(data.name)
                      if (data.qr) {
                        setQrData({ ...data.qr, paymentRef: data.paymentRef || '' })
                      }
                    }}
                  />

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: '🔒', text: 'Thanh toán an toàn' },
                        { icon: '📱', text: 'Học online mọi lúc' },
                        { icon: '🔄', text: 'Xem lại không giới hạn' },
                        { icon: '💬', text: 'Hỗ trợ 24/7' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{item.icon}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantee */}
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <p className="font-semibold text-green-800 text-sm">Cam kết hoàn tiền 100%</p>
                <p className="text-green-600 text-xs mt-1">Nếu bạn học xong không hài lòng trong 7 ngày đầu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">❓ Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Khóa học này học ở đâu?',
                a: 'Sau khi đăng ký thành công, bạn sẽ được mời vào nhóm Facebook riêng của học viên. Toàn bộ video bài giảng có trong group, xem được trên điện thoại hoặc máy tính.',
              },
              {
                q: 'Tôi không biết nấu ăn có học được không?',
                a: 'Hoàn toàn được! Cô Hạ dạy từng bước từ cơ bản nhất. Chưa biết nấu ăn vẫn học được, thậm chí còn học nhanh hơn vì không bị ảnh hưởng bởi thói quen cũ.',
              },
              {
                q: 'Thanh toán như thế nào?',
                a: 'Bạn chuyển khoản qua QR code hoặc chuyển khoản ngân hàng thủ công theo thông tin hiển thị. Sau khi chuyển khoản, hệ thống tự động xác nhận và gửi link group qua email trong vòng vài phút.',
              },
              {
                q: 'Học xong có thể kinh doanh không?',
                a: 'Rất được! Khóa học có phần riêng hướng dẫn kinh doanh dưa cà: cách định giá, đóng gói, bảo quản để bán lâu dài, cách tìm mối bán hàng.',
              },
              {
                q: 'Tôi có thể học lại nhiều lần không?',
                a: 'Có, bạn xem lại video không giới hạn số lần. Group học viên luôn mở và Cô Hạ tiếp tục cập nhật thêm công thức mới miễn phí.',
              },
            ].map((item) => (
              <details key={item.q} className="bg-gray-50 rounded-xl border border-gray-200 group">
                <summary className="px-5 py-4 font-semibold text-gray-800 cursor-pointer flex justify-between items-center hover:text-amber-700 transition-colors">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-700 to-amber-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🥒</div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
            Bắt đầu hành trình làm dưa cà ngon cùng Cô Hạ ngay hôm nay!
          </h2>
          <p className="text-amber-100 mb-8 text-lg">
            Chỉ <strong className="text-yellow-300 text-2xl">138.000đ</strong> – ít hơn một bữa ăn ngoài –<br />
            bạn có cả kho bí quyết làm dưa cà ngon cho cả đời!
          </p>
          <button
            onClick={scrollToCourse}
            className="bg-white text-amber-700 font-extrabold text-xl px-10 py-5 rounded-2xl shadow-xl hover:bg-amber-50 transition-colors"
          >
            🎓 Đăng ký ngay – 138.000đ
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 px-4 text-sm">
        <p>© 2024 Bếp Cô Hạ – <a href="https://hacofood.vn" className="text-amber-400 hover:underline">Hacofood.vn</a></p>
        <p className="mt-1">Chuyên đào tạo dưa cà muối & ẩm thực truyền thống Việt Nam</p>
      </footer>

      {/* ── MODALS ── */}
      {qrData && !courseSuccess && (
        <PaymentModal
          qr={qrData}
          onClose={() => setQrData(null)}
          onPaid={() => {
            setQrData(null)
            setCourseSuccess(true)
          }}
        />
      )}
      {courseSuccess && (
        <SuccessScreen type="course" name={courseName} onClose={() => setCourseSuccess(false)} />
      )}
      {giftSuccess && (
        <SuccessScreen type="gift" name={giftName} onClose={() => setGiftSuccess(false)} />
      )}
    </div>
  )
}
