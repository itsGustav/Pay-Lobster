'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { signIn } from 'next-auth/react';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setError('');
    setResendSuccess(false);
    setIsResending(true);

    try {
      const result = await signIn('resend', {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to resend email. Please try again.');
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Check Your Email</h1>
          <p className="text-gray-400">
            We sent a sign-in link to
          </p>
          {email && (
            <p className="text-orange-600 font-medium break-all">
              {email}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-3 text-sm text-gray-400 text-left bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">1.</span>
            <span>Open the email we just sent you</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">2.</span>
            <span>Click the sign-in link inside</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">3.</span>
            <span>You'll be automatically signed in</span>
          </p>
        </div>

        {/* Messages */}
        {resendSuccess && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Email sent! Check your inbox.
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Resend */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Didn't receive the email?
          </p>
          <Button
            onClick={handleResend}
            disabled={isResending}
            variant="outline"
            size="lg"
            className="w-full"
          >
            {isResending ? 'Sending...' : 'Resend Email'}
          </Button>
        </div>

        {/* Back Link */}
        <div className="pt-4 border-t border-gray-800">
          <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-gray-300">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </Card>
  );
}
