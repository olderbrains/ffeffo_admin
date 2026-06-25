'use client';

import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api/client';

interface Product {
  _id: string;
  name: string;
  slug: string;
  status: string;
  basePrice: number;
  totalStock: number;
  images: { url: string; isDefault: boolean }[];
  categoryId: { name: string };
  brandId: { name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{ items: Product[]; pagination: unknown }>('/products?limit=20');
        setProducts(data.items);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : products.map((product) => (
                  <tr key={product._id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          {product.images[0] && (
                            <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brandId?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.categoryId?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[product.status] || ''}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ₹{product.basePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm">{product.totalStock}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/products/${product._id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
