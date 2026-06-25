'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ImageUpload, type ProductImage } from '@/components/image-upload';
import { PageHeader } from '@/components/layout/page-header';
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cats, brs] = await Promise.all([
          api.get<{ categories: Category[] }>('/categories'),
          api.get<{ data: Brand[] }>('/brands?limit=100'),
        ]);
        setCategories(cats.categories ?? []);
        setBrands(brs.data ?? []);
      } catch {
        toast.error('Failed to load categories and brands');
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim() || !description.trim() || !categoryId || !basePrice) {
      toast.error('Name, description, category, and base price are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slugify(name),
        description: description.trim(),
        ...(shortDescription.trim() && { shortDescription: shortDescription.trim() }),
        categoryId,
        ...(brandId && { brandId }),
        images,
        basePrice: Number(basePrice),
        ...(salePrice && { salePrice: Number(salePrice) }),
        status,
        isFeatured,
        ...(tags.trim() && {
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
        ...((seoTitle || seoDescription) && {
          seo: {
            ...(seoTitle && { title: seoTitle }),
            ...(seoDescription && { description: seoDescription }),
          },
        }),
      };

      const created = await api.post<{ _id: string }>('/products', payload);
      toast.success('Product created! Add variants now.');
      router.push(`/products/${created._id}/edit`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader title="New Product" description="Add a new product to your catalog" />

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
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Images</h2>
            <div className="mt-4">
              <ImageUpload images={images} onChange={setImages} folder="products" />
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
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'active')}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputClass}
                  placeholder="Comma-separated, e.g. organic, summer"
                />
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
            {submitting ? 'Creating…' : 'Create Product & Add Variants'}
          </button>
        </div>
      </div>
    </form>
  );
}
