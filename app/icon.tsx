import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    background: '#4F46E5',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '128px', // Rounded square like native apps
                }}
            >
                <svg width="300" height="300" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    );
}
