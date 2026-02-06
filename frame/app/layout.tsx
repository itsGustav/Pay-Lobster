import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LOBSTER Score Checker - Pay Lobster',
  description: 'Check your LOBSTER credit score on Base',
  openGraph: {
    title: 'LOBSTER Score Checker',
    description: 'Check your LOBSTER credit score on Base',
    images: ['/og.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://paylobster.com/og.png',
    'fc:frame:button:1': 'Check My Score',
  },
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
