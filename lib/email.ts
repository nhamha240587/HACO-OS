import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')
}
const FROM_EMAIL = process.env.FROM_EMAIL || 'Bếp Cô Hạ <no-reply@hacofood.vn>'

export async function sendGiftEmail(to: { name: string; email: string }) {
  const driveLink = process.env.DRIVE_LINK_GIFT || '#'
  const communityGroupLink = process.env.COMMUNITY_GROUP_LINK || '#'

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: [to.email],
    subject: '🎁 Quà tặng từ Bếp Cô Hạ – Công thức Cà Muối Mắm & Link Group!',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fef9f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#d97706,#92400e);padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">🥒 Bếp Cô Hạ</h1>
      <p style="color:#fde68a;margin:8px 0 0;font-size:16px;">Hacofood.vn</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#92400e;font-size:22px;margin-top:0;">Xin chào ${to.name}! 👋</h2>
      <p style="color:#4b5563;line-height:1.8;font-size:16px;">
        Cảm ơn bạn đã quan tâm đến khóa học của Cô Hạ. Đây là phần quà đặc biệt Cô Hạ dành riêng cho bạn:
      </p>

      <div style="background:#fef3c7;border-left:4px solid #d97706;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <h3 style="color:#92400e;margin-top:0;font-size:18px;">🎁 Quà tặng của bạn</h3>
        <p style="margin:8px 0;color:#4b5563;">
          <strong>1. Công thức & Video hướng dẫn Cà Muối Mắm:</strong>
        </p>
        <a href="${driveLink}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0;">
          📥 Nhận công thức ngay
        </a>
        <p style="margin:16px 0 8px;color:#4b5563;">
          <strong>2. Tham gia Group cộng đồng miễn phí:</strong><br>
          Cùng hàng trăm chị em chia sẻ kinh nghiệm làm dưa cà muối!
        </p>
        <a href="${communityGroupLink}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0;">
          👥 Vào Group ngay
        </a>
      </div>

      <div style="background:#f0fdf4;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <h3 style="color:#166534;margin-top:0;font-size:16px;">💡 Bạn muốn học chuyên sâu hơn?</h3>
        <p style="color:#4b5563;margin:8px 0;line-height:1.7;">
          Khóa học <strong>Dưa Cà Muối Chuyên Sâu</strong> của Cô Hạ đang có giá ưu đãi chỉ
          <strong style="color:#dc2626;font-size:20px;">138.000đ</strong>
          <del style="color:#9ca3af;">(gốc 999.000đ)</del>
        </p>
        <a href="https://hacofood.vn/khoahocduacamuoi#khoa-hoc" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">
          🎓 Xem khóa học ngay
        </a>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:24px;">
        Nếu có câu hỏi gì, bạn cứ nhắn thẳng vào group nhé! Cô Hạ luôn sẵn sàng hỗ trợ. 🌸
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        © 2024 Bếp Cô Hạ – Hacofood.vn<br>
        Bạn nhận được email này vì đã đăng ký nhận quà tại website của chúng tôi.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  })
}

export async function sendCourseConfirmEmail(to: { name: string; email: string }) {
  const courseGroupLink = process.env.COURSE_GROUP_LINK || '#'

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: [to.email],
    subject: '✅ Đăng ký thành công – Khóa học Dưa Cà Muối Chuyên Sâu!',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fef9f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#16a34a,#166534);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">Thanh toán thành công!</h1>
      <p style="color:#bbf7d0;margin:8px 0 0;font-size:16px;">Chào mừng bạn đến với Khóa học Dưa Cà Muối Chuyên Sâu</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#166534;font-size:22px;margin-top:0;">Xin chào ${to.name}! 🎉</h2>
      <p style="color:#4b5563;line-height:1.8;font-size:16px;">
        Cô Hạ rất vui khi bạn đã tham gia khóa học! Dưới đây là thông tin bước tiếp theo:
      </p>

      <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="color:#166534;margin-top:0;font-size:18px;">📚 Bước tiếp theo của bạn</h3>
        <ol style="color:#4b5563;line-height:2;padding-left:20px;margin:0;">
          <li>Nhấn vào nút bên dưới để <strong>tham gia Group học viên</strong></li>
          <li>Trong group sẽ có đầy đủ video bài giảng và tài liệu</li>
          <li>Cô Hạ và team sẽ hỗ trợ bạn trong suốt quá trình học</li>
        </ol>
        <a href="${courseGroupLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:18px;margin-top:16px;width:100%;text-align:center;box-sizing:border-box;">
          👥 Vào Group Học Viên Ngay
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <h3 style="color:#92400e;margin-top:0;font-size:16px;">📋 Thông tin đơn hàng</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Khóa học:</td>
            <td style="color:#1f2937;font-weight:600;text-align:right;">Dưa Cà Muối Chuyên Sâu</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Hình thức:</td>
            <td style="color:#1f2937;text-align:right;">Online – Group Facebook</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Giá trị:</td>
            <td style="color:#dc2626;font-weight:800;text-align:right;font-size:18px;">138.000đ</td>
          </tr>
        </table>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        Nếu có bất kỳ câu hỏi nào, hãy nhắn tin trong group học viên hoặc liên hệ Cô Hạ nhé! 🌸
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        © 2024 Bếp Cô Hạ – Hacofood.vn
      </p>
    </div>
  </div>
</body>
</html>
    `,
  })
}
