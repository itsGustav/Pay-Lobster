import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4">🦞</div>
        <h1 className="text-3xl font-bold text-white mb-4">Invalid Address</h1>
        <p className="text-gray-400 mb-6">
          The address you're looking for is not a valid Ethereum address format.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="secondary">Go Home</Button>
          </Link>
          <Link href="/discover">
            <Button variant="primary">Discover Agents</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
