/** @type {import('next').NextConfig} */
import { withPayload } from '@payloadcms/next/withPayload';

const mediaImageBases = [...new Set([
    process.env.R2_PUBLIC_URL,
    process.env.R2_PUBLIC_URL_DEVELOPMENT,
    process.env.R2_PUBLIC_URL_PREVIEW,
].filter(Boolean))].map((value) => {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('R2_PUBLIC_URL must use HTTPS');
    return url.origin + url.pathname.replace(/\/$/, '') + '/';
});

const nextConfig = {
    env: { NEXT_PUBLIC_MEDIA_IMAGE_BASES: JSON.stringify(mediaImageBases) },
    trailingSlash: true,
    outputFileTracingIncludes: { '/*': ['./content/pages/*.md'] },
    // heic-convert loads its WASM bundle with a runtime require that webpack cannot statically analyze.
    // Keep this Node-only image decoder external to the Next.js server bundle.
    serverExternalPackages: ['heic-convert', 'heic-decode', 'libheif-js'],
    images: {
        remotePatterns: [
            ...mediaImageBases.map((base) => {
                const url = new URL(base);
                return { protocol: 'https', hostname: url.hostname, port: url.port, pathname: url.pathname + '**' };
            }),
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
    },
};

export default withPayload(nextConfig);
