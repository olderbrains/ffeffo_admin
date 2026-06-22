'use client';

import { DollarSign, Package, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api/client';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  avgOrderValue: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: { firstName: string; lastName: string };
  total: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, ordersData] = await Promise.all([
          api.get<DashboardStats>('/analytics/dashboard'),
          api.get<{ data: Order[]; pagination: unknown }>('/orders?limit=5&sortBy=createdAt&sortOrder=desc'),
        ]);
        setStats(dashData);
        setRecentOrders(ordersData.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statItems = stats
    ? [
        { name: 'Revenue', value: `₹${(stats.totalRevenue / 100).toLocaleString('en-IN')}`, icon: DollarSign, sub: `Avg: ₹${(stats.avgOrderValue / 100).toLocaleString('en-IN')}` },
        { name: 'Orders', value: String(stats.totalOrders), icon: ShoppingCart, sub: 'Total orders' },
        { name: 'Customers', value: String(stats.totalCustomers), icon: Users, sub: 'Active customers' },
        { name: 'Products', value: String(stats.totalProducts), icon: Package, sub: `${stats.lowStockCount} low stock` },
      ]
    : [];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of your store performance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-7 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))
          : statItems.map((stat) => (
              <div key={stat.name} className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <div className="mt-4 space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                ))
              : recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.userId?.firstName} {order.userId?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        ₹{(order.total / 100).toLocaleString('en-IN')}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/products/new" className="rounded-md border p-3 text-center text-sm transition-colors hover:bg-accent">
              Add Product
            </Link>
            <Link href="/orders" className="rounded-md border p-3 text-center text-sm transition-colors hover:bg-accent">
              View Orders
            </Link>
            <Link href="/inventory" className="rounded-md border p-3 text-center text-sm transition-colors hover:bg-accent">
              Manage Stock
            </Link>
            <Link href="/coupons" className="rounded-md border p-3 text-center text-sm transition-colors hover:bg-accent">
              Create Coupon
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
