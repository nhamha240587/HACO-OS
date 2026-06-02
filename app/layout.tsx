import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Khóa Học Dưa Cà Muối – Bếp Cô Hạ | Hacofood.vn",
  description:
    "Học làm dưa cải bẹ, dưa góp, sung cà muối, cà muối mắm chuyên sâu từ Cô Hạ. Dùng cho gia đình và kinh doanh. Chỉ 138.000đ.",
  keywords: ["dưa cà muối", "học làm dưa", "cô hạ", "hacofood", "khóa học nấu ăn"],
  openGraph: {
    title: "Khóa Học Dưa Cà Muối – Bếp Cô Hạ",
    description: "Học làm dưa cà muối chuyên sâu. Chỉ 138.000đ, giảm 86%!",
    url: "https://hacofood.vn/khoahocduacamuoi",
    siteName: "Hacofood.vn",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geist.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
