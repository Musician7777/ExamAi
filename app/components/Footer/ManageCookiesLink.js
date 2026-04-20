'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useConsent } from '@/app/providers/ConsentProvider';

export default function ManageCookiesLink() {
  const { data: session } = useSession();
  const { resetConsent } = useConsent();
  const router = useRouter();

  function handleClick() {
    if (!session) {
      resetConsent(); // Re-show the cookie consent banner
    } else {
      router.push('/dashboard/profile#cookie-preferences'); // Client-side navigation
    }
  }

  return (
    <button
      type="button"
      className="hover:text-foreground transition-colors cursor-pointer text-sm text-muted-foreground focus-visible:outline-none focus-visible:underline"
      onClick={handleClick}
    >
      Manage cookies
    </button>
  );
}
