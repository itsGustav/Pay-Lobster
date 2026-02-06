'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.',
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The sign-in link is invalid or has expired.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <Card>
      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{errorInfo.title}</h1>
          <p className="text-gray-400">{errorInfo.description}</p>
        </div>

        {/* Error Code */}
        {error !== 'Default' && (
          <div className="text-xs text-gray-500 font-mono bg-gray-900/50 border border-gray-800 rounded px-3 py-2 inline-block">
            Error: {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link href="/auth/signin" className="block">
            <Button size="lg" className="w-full">
              Try Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="lg" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Help */}
        <div className="pt-6 border-t border-gray-800 text-sm text-gray-500">
          Need help?{' '}
          <a
            href="mailto:support@paylobster.com"
            className="text-orange-600 hover:text-orange-500"
          >
            Contact Support
          </a>
        </div>
      </div>
    </Card>
  );
}
