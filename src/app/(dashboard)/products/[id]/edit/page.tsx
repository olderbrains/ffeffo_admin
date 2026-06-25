'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ImageUpload, type ProductImage } from '@/components/image-upload';
import { PageHeader } from '@/components/layout/page-header';
import { VariantsEditor, type Variant } from '@/components/variants-editor';
import { api, ApiError } from '@/lib/api/client';

interface Category {
  _id: string;
  name: string;
  level?: number;
}
interface Brand {
  _id: string;
  name: string;
}

type Ref = string | { _id: string } | null | undefined;

interface ProductResponse {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  categoryId: Ref;
  brandId: Ref;
  status: 'draft' | 'active' | 'archived';
  isFeatured?: boolean;
  images: ProductImage[];
  tags?: string[];
  seo?: { title?: string; description?: string };
}

interface VariantsResponse {
  items: Variant[];
}

function refId(ref: Ref): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [variants, setVariants] = useState<Variant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [product, cats, brs, variantsRes] = await Promise.all([
          api.get<ProductResponse>(`/products/${id}`),
          api.get<{ categories: Category[] }>('/categories'),
          api.get<{ data: Brand[] }>('/brands?limit=100'),
          api.get<VariantsResponse>(`/products/${id}/variants`),
        ]);

        setCategories(cats.categories ?? []);
        setBrands(brs.data ?? []);

        setName(product.name ?? '');
        setDescription(product.description ?? '');
        setShortDescription(product.shortDescription ?? '');
        setBasePrice(product.basePrice != null ? String(product.basePrice) : '');
        setSalePrice(product.salePrice != null ? String(product.salePrice) : '');
        setCategoryId(refId(product.categoryId));
        setBrandId(refId(product.brandId));
        setStatus(product.status ?? 'draft');
        setIsFeatured(Boolean(product.isFeatured));
        setImages(Array.isArray(product.images) ? product.images : []);
        setTags((product.tags ?? []).join(', '));
        setSeoTitle(product.seo?.title ?? '');
        setSeoDescription(product.seo?.description ?? '');
        setVariants(variantsRes.items ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim() || !description.trim() || !categoryId || !basePrice) {
      toast.error('Name, description, category, and base price are required');
      return;
    }

    setSubmitting(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        categoryId,
        brandId: brandId || undefined,
        images,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        status,
        isFeatured,
        tags: tagList,
        seo: {
          title: seoTitle || undefined,
          description: seoDescription || undefined,
        },
      };

      await api.patch(`/products/${id}`, payload);
      toast.success('Product updated');
      router.push('/products');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;

    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      router.push('/products');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete product';
      toast.error(message);
      setDeleting(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Product" description="Loading product…" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
            <div className="h-48 animate-pulse rounded-lg border bg-muted/40" />
          </div>
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Product" description="Product not found" />
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            This product could not be found. It may have been deleted.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader title="Edit Product" description={name || 'Update product details'} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Product Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium">Short Description</label>
                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={inputClass}
                  placeholder="One-line summary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Base Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sale Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputClass}
                  placeholder="Comma-separated, e.g. organic, summer, bestseller"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Images</h2>
            <div className="mt-4">
              <ImageUpload images={images} onChange={setImages} folder="products" />
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Variants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add color, size, or any attribute variants with individual stock and pricing.
            </p>
            <div className="mt-4">
              <VariantsEditor
                productId={id}
                variants={variants}
                onVariantsChange={setVariants}
                productImages={images.map((i) => i.url)}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Organization</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.level ? `${'— '.repeat(c.level)}${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Brand</label>
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputClass}>
                  <option value="">No brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-medium">Featured product</span>
              </label>
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">SEO</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Meta Title</label>
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full rounded-md border border-destructive/40 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
