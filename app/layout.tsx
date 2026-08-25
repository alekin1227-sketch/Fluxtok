import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fluxtok", template: "%s · Fluxtok" },
  description: "Organize creators, amostras, campanhas e conteúdos da sua operação de social commerce.",
  icons: { icon: "/brand/fluxtok-icon.png" },
  openGraph: { title: "Fluxtok", description: "Creator operations, samples, collaborations and commerce.", images: ["/brand/fluxtok-brand-board.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
