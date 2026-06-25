'use client';

import {
  BarChart3, Box, ChevronLeft, FileText, Grid3X3,
  History, Home, Image, Layers, Package, Percent,
  RefreshCw, RotateCcw, Settings, ShoppingCart, Tag, Upload, Users,
} from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/',          icon: Home },
      { name: 'Products',  href: '/products',  icon: Package },
      { name: 'Categories',href: '/categories',icon: Grid3X3 },
      { name: 'Brands',    href: '/brands',    icon: Tag },
      { name: 'Inventory', href: '/inventory', icon: Box },
    ],
  },
  {
    label: 'Fulfillment',
    items: [
      { name: 'Orders',   href: '/orders',  icon: ShoppingCart },
      { name: 'Returns',  href: '/returns', icon: RotateCcw },
      { name: 'Refunds',  href: '/refunds', icon: RefreshCw },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Coupons',   href: '/coupons',   icon: Percent },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'CMS Pages', href: '/cms/pages',   icon: FileText },
      { name: 'Banners',   href: '/cms/banners', icon: Image },
    ],
  },
  {
    label: 'Reports',
    items: [
      { name: 'Analytics',  href: '/analytics',  icon: BarChart3 },
      { name: 'Audit Logs', href: '/audit-logs', icon: History },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Bulk Ops', href: '/bulk',     icon: Upload },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center select-none">
            <NextImage
              src="/logo.png"
              alt="Speffo"
              width={88}
              height={28}
              className="h-6 w-auto object-contain"
              priority
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section) => (
          <div key={section.label ?? 'main'} className="mb-1">
            {section.label && !collapsed && (
              <p className="mb-0.5 mt-3 px-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                {section.label}
              </p>
            )}
            {section.label && collapsed && <div className="mt-3" />}

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'relative mx-2 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                    collapsed && 'justify-center px-0 mx-2',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-foreground/60 hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon className={cn('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-[15px] w-[15px]')} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
          {!collapsed && <span className="text-[11px] text-muted-foreground/40">v1.0.0</span>}
        </div>
      </div>
    </aside>
  );
}
