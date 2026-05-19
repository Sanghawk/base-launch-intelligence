import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base Launch Intelligence',
  description: 'Private Base launch intelligence console MVP'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
