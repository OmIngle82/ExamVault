'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#FFF1F2',
                    color: '#881337',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong! 😵</h2>
                    <p style={{ maxWidth: '500px', marginBottom: '2rem', color: '#9F1239' }}>
                        We apologize for the inconvenience. An unexpected error has occurred.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            background: '#BE123C',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '99px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(190, 18, 60, 0.2)'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
