/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog';
import { handle } from 'frog/next';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import {
  CONTRACTS,
  REPUTATION_ABI,
  IDENTITY_ABI,
  getTier,
  formatScore,
  BASE_RPC,
} from '@/lib/contracts';

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'LOBSTER Score Checker',
});

// Create Viem client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC),
});

// Helper to get base URL
function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

// Initial frame
app.frame('/', (c) => {
  const baseUrl = getBaseUrl(c.req.raw);
  return c.res({
    image: `${baseUrl}/api/og?type=initial`,
    intents: [
      <Button action="/score">Check My Score</Button>,
      <Button.Link href="https://paylobster.com">Visit PayLobster.com</Button.Link>,
    ],
  });
});

// Score checking frame
app.frame('/score', async (c) => {
  const baseUrl = getBaseUrl(c.req.raw);
  
  try {
    const { frameData } = c;
    const userAddress = frameData?.fid ? frameData.address : null;

    if (!userAddress) {
      return c.res({
        image: `${baseUrl}/api/og?type=no-wallet`,
        intents: [
          <Button action="/">Back</Button>,
          <Button.Link href="https://paylobster.com">Register</Button.Link>,
        ],
      });
    }

    const isRegistered = await publicClient.readContract({
      address: CONTRACTS.IDENTITY,
      abi: IDENTITY_ABI,
      functionName: 'isRegistered',
      args: [userAddress as `0x${string}`],
    });

    if (!isRegistered) {
      return c.res({
        image: `${baseUrl}/api/og?type=not-registered`,
        intents: [
          <Button action="/">Back</Button>,
          <Button.Link href="https://paylobster.com">Register Now</Button.Link>,
        ],
      });
    }

    const [trustScore, txCount] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.REPUTATION,
        abi: REPUTATION_ABI,
        functionName: 'getTrustScore',
        args: [userAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: CONTRACTS.REPUTATION,
        abi: REPUTATION_ABI,
        functionName: 'getTransactionCount',
        args: [userAddress as `0x${string}`],
      }),
    ]);

    const score = Number(trustScore);
    const transactions = Number(txCount);
    const tier = getTier(score);
    const displayScore = formatScore(score);

    return c.res({
      image: `${baseUrl}/api/og?type=score&score=${displayScore}&tier=${encodeURIComponent(tier)}&txs=${transactions}`,
      intents: [
        <Button action="/">Check Again</Button>,
        <Button.Link href="https://paylobster.com">View Dashboard</Button.Link>,
      ],
    });
  } catch (error) {
    console.error('Error fetching score:', error);
    return c.res({
      image: `${baseUrl}/api/og?type=error`,
      intents: [
        <Button action="/">Try Again</Button>,
        <Button.Link href="https://paylobster.com">Visit Site</Button.Link>,
      ],
    });
  }
});

export const GET = handle(app);
export const POST = handle(app);
