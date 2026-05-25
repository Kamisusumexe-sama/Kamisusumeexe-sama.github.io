import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vanessa Asafo-Adjei Portfolio',
  description: 'Creative portfolio showcasing projects, games, art, and writing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
