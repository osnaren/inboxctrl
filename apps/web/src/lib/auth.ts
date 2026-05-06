import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from './prisma';

const authBaseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

export const auth = betterAuth({
  baseURL: authBaseURL,
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: 'offline',
      prompt: 'select_account consent',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.modify', // Organizer mode: Read, archive, move, star, trash. No permanent delete.
        'https://www.googleapis.com/auth/gmail.settings.basic', // Settings mode: Manage filters.
        'https://www.googleapis.com/auth/gmail.labels', // Label management.
      ],
    },
  },
});
