import type { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { demoUser, isDemoMode } from '@/lib/demo-mode';

type AuthRequestHeaders = Awaited<ReturnType<typeof headers>>;

export interface AppUser {
  id: string;
  email: string | null;
  name: string | null;
  image?: string | null;
}

export const getCurrentUser = async (requestHeaders: AuthRequestHeaders): Promise<AppUser | null> => {
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session?.user) {
    return session.user;
  }

  if (isDemoMode()) {
    return demoUser;
  }

  return null;
};
