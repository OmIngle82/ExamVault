import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#F0F9FF',
            color: '#075985',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found 🔍</h2>
            <p style={{ maxWidth: '400px', marginBottom: '2rem', color: '#0369A1' }}>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                style={{
                    background: '#0284C7',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '99px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(2, 132, 199, 0.2)'
                }}
            >
                Return Home
            </Link>
        </div>
    );
}
