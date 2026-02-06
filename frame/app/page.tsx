import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* Subtle orange glow behind content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, rgba(234, 88, 12, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: '600px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Lobster emoji with orange glow */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(234, 88, 12, 0.3) 0%, rgba(234, 88, 12, 0) 70%)',
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />
          <h1
            style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            🦞
          </h1>
        </div>

        <h2
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: 'white',
          }}
        >
          LOBSTER Score Checker
        </h2>
        <p
          style={{
            fontSize: '1.25rem',
            marginBottom: '3rem',
            color: '#a3a3a3',
          }}
        >
          A Farcaster Frame to check your LOBSTER credit score on Base
        </p>

        {/* Card-style container */}
        <div
          style={{
            background: '#171717',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid #262626',
          }}
        >
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: '#ea580c',
            }}
          >
            How to Use
          </h3>
          <ol
            style={{
              textAlign: 'left',
              fontSize: '1.1rem',
              lineHeight: '2',
              listStylePosition: 'inside',
              color: '#d4d4d4',
            }}
          >
            <li>Share this frame in Warpcast</li>
            <li>Click "Check My Score"</li>
            <li>View your LOBSTER score (300-850)</li>
            <li>See your tier and transaction count</li>
          </ol>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
        >
          <Link
            href="https://paylobster.com"
            style={{
              padding: '1rem 2rem',
              background: '#ea580c',
              color: 'white',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '1.1rem',
              transition: 'transform 0.2s',
            }}
          >
            Visit PayLobster.com
          </Link>
          <Link
            href="https://warpcast.com/~/developers/frames"
            style={{
              padding: '1rem 2rem',
              background: '#262626',
              color: 'white',
              border: '1px solid #404040',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '1.1rem',
              transition: 'transform 0.2s',
            }}
          >
            Frame Validator
          </Link>
        </div>

        <div
          style={{
            padding: '1.5rem',
            background: '#171717',
            border: '1px solid #262626',
            borderRadius: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: '#ea580c',
            }}
          >
            Test the Frame
          </h4>
          <p style={{ fontSize: '1rem', color: '#a3a3a3', marginBottom: '0.5rem' }}>
            Frame endpoint: <code style={{ background: '#262626', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>/api</code>
          </p>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#737373',
            }}
          >
            Use the Warpcast Frame Validator to test before deploying
          </p>
        </div>
      </div>
    </main>
  );
}
