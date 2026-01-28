import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'ExamVault - Future of Assessment';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Logo Shield Icon */}
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                        <path d="M9 12l2 2 4-4" stroke="none" fill="#4F46E5" />
                    </svg>
                    <h1 style={{ fontSize: 100, fontWeight: 'bold', margin: 0 }}>ExamVault</h1>
                </div>
                <p style={{ fontSize: 40, marginTop: 20, opacity: 0.9 }}>The Future of Secure Assessment</p>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
