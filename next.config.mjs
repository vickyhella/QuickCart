/** @type {import('next').NextConfig} */
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig = {
    trailingSlash: true,
    outputFileTracingIncludes: { '/*': ['./content/pages/*.md'] },
    // heic-convert loads its WASM bundle with a runtime require that webpack cannot statically analyze.
    // Keep this Node-only image decoder external to the Next.js server bundle.
    serverExternalPackages: ['heic-convert', 'heic-decode', 'libheif-js'],
    images: {
        remotePatterns: [
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
