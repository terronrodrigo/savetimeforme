import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaveTimeForME | Tempo recuperável com IA",
  description: "Calcule quanto tempo a inteligência artificial pode ajudar você a recuperar na sua rotina e registre sua estimativa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
