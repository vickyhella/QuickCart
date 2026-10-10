/** @type {import('next').NextConfig} */
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig = {
    trailingSlash: true,
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
