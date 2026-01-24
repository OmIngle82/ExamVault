import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
}

export default function Skeleton({ width, height, borderRadius, style, className, ...props }: SkeletonProps) {
    return (
        <div
            className={className}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius || '8px',
                backgroundColor: '#e2e8f0', // Slate-200
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                ...style
            }}
            {...props}
        >
            <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
