import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentProfileClient } from './AgentProfileClient';
import { isValidAddress } from '@/lib/agent-utils';

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { address } = await params;
  
  if (!isValidAddress(address)) {
    return {
      title: 'Invalid Address | Pay Lobster',
      description: 'The provided address is invalid.',
    };
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return {
    title: `Agent ${shortAddress} | Pay Lobster`,
    description: `View the Pay Lobster profile for agent ${shortAddress}. Check their LOBSTER score, transaction history, and trust metrics.`,
    openGraph: {
      title: `Agent ${shortAddress} | Pay Lobster`,
      description: `View the Pay Lobster profile for agent ${shortAddress}`,
      type: 'profile',
      url: `https://paylobster.com/agent/${address}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Agent ${shortAddress} | Pay Lobster`,
      description: `View the Pay Lobster profile for agent ${shortAddress}`,
    },
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { address } = await params;

  // Validate address format
  if (!isValidAddress(address)) {
    notFound();
  }

  return <AgentProfileClient address={address} />;
}
