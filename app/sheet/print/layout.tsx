import type { Metadata } from "next";
import "../../print-sheet.css";

export const metadata: Metadata = {
  title: "Imprimir hoja de tarifa",
  description: "Vista de impresión y PDF de la hoja de tarifa",
};

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
