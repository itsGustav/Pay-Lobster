import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'initial';
    const score = searchParams.get('score') || '300';
    const tier = searchParams.get('tier') || '🔴 New Lobster';
    const txs = searchParams.get('txs') || '0';

    let content;
    let bgGradient;

    switch (type) {
      case 'initial':
        bgGradient = '#0a0a0a';
        content = (
          <>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🦞</div>
            <div style={{ fontSize: '60px', marginBottom: '10px', color: '#e5e5e5' }}>Check Your</div>
            <div style={{ fontSize: '80px', color: '#ea580c', marginBottom: '20px', fontWeight: 'bold' }}>LOBSTER Score</div>
            <div style={{ fontSize: '36px', color: '#a3a3a3' }}>Your credit score on Base</div>
          </>
        );
        break;

      case 'no-wallet':
        bgGradient = '#0a0a0a';
        content = (
          <>
            <div style={{ fontSize: '80px', marginBottom: '40px' }}>⚠️</div>
            <div style={{ fontSize: '60px', fontWeight: 'bold', marginBottom: '20px', color: '#ea580c' }}>
              No Wallet Connected
            </div>
            <div style={{ fontSize: '36px', color: '#a3a3a3' }}>Please connect a wallet</div>
          </>
        );
        break;

      case 'not-registered':
        bgGradient = '#0a0a0a';
        content = (
          <>
            <div style={{ fontSize: '80px', marginBottom: '40px' }}>🦞</div>
            <div style={{ fontSize: '60px', fontWeight: 'bold', marginBottom: '20px', color: '#ea580c' }}>
              Not Registered Yet
            </div>
            <div style={{ fontSize: '32px', color: '#a3a3a3' }}>
              Register at paylobster.com to start building your score!
            </div>
          </>
        );
        break;

      case 'error':
        bgGradient = '#0a0a0a';
        content = (
          <>
            <div style={{ fontSize: '80px', marginBottom: '40px' }}>❌</div>
            <div style={{ fontSize: '60px', fontWeight: 'bold', marginBottom: '20px', color: '#ea580c' }}>Error</div>
            <div style={{ fontSize: '36px', color: '#a3a3a3' }}>
              Unable to fetch score. Please try again.
            </div>
          </>
        );
        break;

      case 'score':
        bgGradient = '#0a0a0a';
        content = (
          <>
            <div style={{ fontSize: '50px', fontWeight: 'bold', marginBottom: '20px', color: '#e5e5e5' }}>
              Your LOBSTER Score
            </div>
            <div style={{ fontSize: '120px', fontWeight: 'bold', color: '#ea580c', marginBottom: '20px' }}>
              {score}
            </div>
            <div style={{ fontSize: '45px', fontWeight: 'bold', marginBottom: '20px', color: '#e5e5e5' }}>
              {tier}
            </div>
            <div style={{ fontSize: '35px', color: '#a3a3a3' }}>
              {txs} transaction{txs !== '1' ? 's' : ''} completed
            </div>
          </>
        );
        break;

      default:
        bgGradient = '#0a0a0a';
        content = <div style={{ fontSize: '60px', color: '#ea580c' }}>🦞 LOBSTER Score</div>;
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: bgGradient,
            color: 'white',
            fontSize: '48px',
            textAlign: 'center',
            padding: '60px',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle orange radial glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, transparent 70%)',
              display: 'flex',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {content}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
