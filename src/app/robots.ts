import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard',
          '/chat',
          '/interview',
          '/editor',
          '/design',
          '/export',
          '/profile',
          '/settings',
          '/onboarding',
          '/payment/',
          '/welcome',
          '/magic-frame/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://leafnote.co.kr/sitemap.xml',
  }
}
