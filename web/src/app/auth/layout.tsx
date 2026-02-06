import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-gray-950 via-orange-950/5 to-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="block text-center mb-8">
          <div className="text-5xl mb-2">🦞</div>
          <div className="text-2xl font-bold">Pay Lobster</div>
        </Link>

        {/* Auth Card */}
        {children}
      </div>
    </div>
  );
}
