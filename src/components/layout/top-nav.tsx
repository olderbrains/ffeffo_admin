'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { logout as performLogout } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

export function TopNav() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    await performLogout();
    router.replace('/login');
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || '?';

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search…"
          className="h-8 w-60 rounded-md border border-border bg-secondary/60 pl-8 pr-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white select-none">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
