import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ExamVault',
        short_name: 'ExamVault',
        description: 'Advanced timed testing platform with automated scheduling.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4F46E5',
        icons: [
            {
                src: '/icon',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
