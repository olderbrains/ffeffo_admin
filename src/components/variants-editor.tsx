'use client';

import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { api, ApiError } from '@/lib/api/client';

const COLOR_MAP: Record<string, string> = {
  black: '#1C1C1C', white: '#FBFAF6', red: '#C0392B', blue: '#2C5F8A',
  green: '#2E7D32', yellow: '#F9C02A', orange: '#D9651A', pink: '#E87F9A',
  purple: '#6B3FA0', brown: '#795548', grey: '#9E9E9E', gray: '#9E9E9E',
  navy: '#2A3650', teal: '#00796B', coral: '#E8735A', beige: '#D6C4A1',
  maroon: '#7B2246', sage: '#9CAF88', olive: '#6B6B47', sand: '#D8C4A0',
  clay: '#B5663F', charcoal: '#3A3A3A', cream: '#F3EBDD', slate: '#5A6470',
  forest: '#39492F', mustard: '#C99A2E', sky: '#A7C4D6', rust: '#A8552E',
  khaki: '#B3A179', indigo: '#3B4A6B', oatmeal: '#D9CFBC', ecru: '#E4DBCA',
  'dusty rose': '#C08A86', stone: '#B8AE9C', burgundy: '#6D1E3A',
  ivory: '#F8F4E9', lavender: '#B59DC8', mint: '#A8D8B9', peach: '#FFCBA4',
  camel: '#C19A6B', tan: '#D2B48C', mauve: '#B08A90', rose: '#C07080',
  wine: '#722F37', gold: '#C9A84C', silver: '#C0C0C0', copper: '#B87333',
  turquoise: '#40B4C0', lilac: '#C8A2C8', blush: '#DE9BAE', cobalt: '#1640A8',
  denim: '#3E5C8A', taupe: '#8B7D6B', mocha: '#7B5B45', terracotta: '#C1440E',
  emerald: '#2ECC71', crimson: '#DC143C', amber: '#FFC107', ochre: '#CC7700',
  'off white': '#F3EBDD', 'off-white': '#F3EBDD', nude: '#E3C19F',
  'bottle green': '#1B5E20', 'dark green': '#1B5E20', 'dark blue': '#1A2D45',
  'light blue': '#82B4D0', 'royal blue': '#2044A0', 'light pink': '#F0AABB',
  'hot pink': '#D63178', 'light grey': '#D4D4D4', 'dark grey': '#555555',
  'forest green': '#39492F', 'olive green': '#6B6B47', 'army green': '#4B5320',
  champagne: '#F7E7CE', pearl: '#F5F0E8', chocolate: '#5C3317',
};

function resolveColor(name: string): string {
  if (!name.trim()) return '#B8AE9C';
  const lower = name.trim().toLowerCase();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower]!;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(name.trim())) return name.trim();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return hex;
  }
  const words = lower.split(/[\s\-_]+/);
  for (const w of words) if (COLOR_MAP[w]) return COLOR_MAP[w]!;
  return '#B8AE9C';
}

function isColorAttr(name: string): boolean {
  return /^colou?r$/i.test(name.trim());
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface Variant {
  _id: string;
  sku: string;
  attributes: VariantAttribute[];
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
  sortOrder: number;
}

interface VariantFormState {
  sku: string;
  attributes: VariantAttribute[];
  price: string;
  salePrice: string;
  stock: string;
  images: string[];
  isActive: boolean;
}

// Preset templates per product category
const VARIANT_PRESETS = [
  { label: 'Clothing', attrs: [{ name: 'Color', value: '' }, { name: 'Size', value: '' }] },
  { label: 'Footwear', attrs: [{ name: 'Color', value: '' }, { name: 'UK Size', value: '' }] },
  { label: 'Perfume / Fragrance', attrs: [{ name: 'Volume (ml)', value: '' }, { name: 'Type', value: '' }] },
  { label: 'Size only', attrs: [{ name: 'Size', value: '' }] },
  { label: 'Color only', attrs: [{ name: 'Color', value: '' }] },
  { label: 'Custom', attrs: [{ name: '', value: '' }] },
] as const;

const emptyForm = (): VariantFormState => ({
  sku: '',
  attributes: [{ name: 'Color', value: '' }, { name: 'Size', value: '' }],
  price: '',
  salePrice: '',
  stock: '0',
  images: [],
  isActive: true,
});

interface VariantsEditorProps {
  productId: string;
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  productImages: string[];
}

export function VariantsEditor({ productId, variants, onVariantsChange, productImages }: VariantsEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickStockId, setQuickStockId] = useState<string | null>(null);
  const [quickStockVal, setQuickStockVal] = useState('');
  const [showImages, setShowImages] = useState(false);

  const inputCls =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary';

  const openCreate = (presetAttrs?: VariantAttribute[]) => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      attributes: presetAttrs ?? [{ name: 'Color', value: '' }, { name: 'Size', value: '' }],
    });
    setShowForm(true);
  };

  const openEdit = (v: Variant) => {
    setEditingId(v._id);
    setForm({
      sku: v.sku,
      attributes: v.attributes.length > 0 ? [...v.attributes] : [{ name: 'Color', value: '' }],
      price: String(v.price),
      salePrice: v.salePrice != null ? String(v.salePrice) : '',
      stock: String(v.stock),
      images: v.images ?? [],
      isActive: v.isActive,
    });
    setShowForm(true);
    setShowImages(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setShowImages(false);
  };

  const setAttr = (index: number, field: 'name' | 'value', value: string) =>
    setForm((f) => {
      const attrs = [...f.attributes];
      attrs[index] = { ...attrs[index]!, [field]: value };
      return { ...f, attributes: attrs };
    });

  const addAttr = () =>
    setForm((f) => ({ ...f, attributes: [...f.attributes, { name: '', value: '' }] }));

  const removeAttr = (index: number) =>
    setForm((f) => ({ ...f, attributes: f.attributes.filter((_, i) => i !== index) }));

  const toggleImage = (url: string) =>
    setForm((f) => ({
      ...f,
      images: f.images.includes(url) ? f.images.filter((u) => u !== url) : [...f.images, url],
    }));

  const handleSave = async () => {
    if (!form.price || form.stock === '') {
      toast.error('Price and stock are required');
      return;
    }
    if (!editingId && !form.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    const validAttrs = form.attributes.filter((a) => a.name.trim() && a.value.trim());
    if (validAttrs.length === 0) {
      toast.error('At least one attribute with both name and value is required');
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...(editingId ? {} : { sku: form.sku.trim() }),
        attributes: validAttrs,
        price: Number(form.price),
        ...(form.salePrice ? { salePrice: Number(form.salePrice) } : {}),
        stock: Number(form.stock),
        images: form.images,
        isActive: form.isActive,
      };

      if (editingId) {
        const updated = await api.patch<Variant>(`/products/${productId}/variants/${editingId}`, body);
        onVariantsChange(variants.map((v) => (v._id === editingId ? updated : v)));
        toast.success('Variant updated');
      } else {
        const created = await api.post<Variant>(`/products/${productId}/variants`, body);
        onVariantsChange([...variants, created]);
        toast.success('Variant added');
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!window.confirm('Delete this variant? This cannot be undone.')) return;
    setDeletingId(variantId);
    try {
      await api.delete(`/products/${productId}/variants/${variantId}`);
      onVariantsChange(variants.filter((v) => v._id !== variantId));
      toast.success('Variant deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete variant');
    } finally {
      setDeletingId(null);
    }
  };

  const commitQuickStock = async (variantId: string) => {
    const newStock = parseInt(quickStockVal, 10);
    if (isNaN(newStock) || newStock < 0) {
      setQuickStockId(null);
      return;
    }
    try {
      const updated = await api.patch<Variant>(`/products/${productId}/variants/${variantId}`, {
        stock: newStock,
      });
      onVariantsChange(variants.map((v) => (v._id === variantId ? updated : v)));
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setQuickStockId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Variant cards */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => {
            const firstImage = v.images[0] ?? productImages[0];
            const colorAttr = v.attributes.find((a) => isColorAttr(a.name));
            const colorHex = colorAttr ? resolveColor(colorAttr.value) : null;
            const isEditing = editingId === v._id && showForm;
            const onSale = v.salePrice != null && v.salePrice < v.price;

            return (
              <div
                key={v._id}
                className={`rounded-lg border bg-card transition-colors ${isEditing ? 'border-primary/40 bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-secondary" />
                    )}
                  </div>

                  {/* Attributes */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {colorHex && (
                        <span
                          className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: colorHex }}
                          title={colorAttr?.value}
                        />
                      )}
                      {v.attributes.map((a, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80"
                        >
                          {a.name}: {a.value}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{v.sku}</p>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right">
                    {onSale ? (
                      <>
                        <p className="text-sm font-semibold text-green-700">₹{v.salePrice}</p>
                        <p className="text-xs text-muted-foreground line-through">₹{v.price}</p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold">₹{v.price}</p>
                    )}
                  </div>

                  {/* Stock — inline edit */}
                  <div className="shrink-0 text-center">
                    {quickStockId === v._id ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        value={quickStockVal}
                        onChange={(e) => setQuickStockVal(e.target.value)}
                        onBlur={() => void commitQuickStock(v._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void commitQuickStock(v._id);
                          if (e.key === 'Escape') setQuickStockId(null);
                        }}
                        className="w-16 rounded border px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setQuickStockId(v._id); setQuickStockVal(String(v.stock)); }}
                        className={`rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-muted ${
                          v.stock === 0
                            ? 'text-destructive'
                            : v.stock <= 10
                              ? 'text-amber-600'
                              : 'text-foreground'
                        }`}
                        title="Click to edit stock"
                      >
                        {v.stock} pcs
                      </button>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      v.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {v.isActive ? 'Active' : 'Off'}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Edit variant"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(v._id)}
                      disabled={deletingId === v._id}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                      title="Delete variant"
                    >
                      {deletingId === v._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {variants.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium text-foreground">No variants yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a preset below or click Add Variant to get started.
          </p>
        </div>
      )}

      {/* Preset quick-start buttons */}
      {!showForm && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {VARIANT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => openCreate([...preset.attrs.map((a) => ({ ...a }))])}
                className="rounded-full border px-3 py-1 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {editingId ? 'Edit Variant' : 'New Variant'}
            </h3>
            <button type="button" onClick={closeForm} className="rounded p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* SKU (create only) */}
          {!editingId && (
            <div>
              <label className="text-sm font-medium">SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                className={inputCls}
                placeholder="e.g. TSHIRT-BLK-M or PERF-50ML-EDP"
              />
            </div>
          )}

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Attributes *</label>
              <button
                type="button"
                onClick={addAttr}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add attribute
              </button>
            </div>
            <div className="space-y-2">
              {form.attributes.map((attr, i) => {
                const isColor = isColorAttr(attr.name);
                const pickerHex = isColor
                  ? /^#[0-9a-f]{6}$/i.test(attr.value)
                    ? attr.value
                    : resolveColor(attr.value)
                  : null;

                return (
                  <div key={i} className="flex gap-2 items-start">
                    {/* Attribute name */}
                    <div className="flex-1">
                      <input
                        value={attr.name}
                        onChange={(e) => setAttr(i, 'name', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Attribute name"
                        list="attr-name-suggestions"
                      />
                    </div>

                    {/* Attribute value */}
                    <div className="flex-1">
                      {isColor ? (
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 h-[38px]">
                          <input
                            type="color"
                            value={pickerHex ?? '#000000'}
                            onChange={(e) => setAttr(i, 'value', e.target.value)}
                            className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <span className="font-mono text-sm text-foreground/80">
                            {attr.value || pickerHex}
                          </span>
                        </div>
                      ) : (
                        <input
                          value={attr.value}
                          onChange={(e) => setAttr(i, 'value', e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Value"
                          list={attr.name === 'Size' ? 'size-suggestions' : attr.name === 'Volume (ml)' || attr.name === 'Volume' ? 'volume-suggestions' : attr.name === 'Type' ? 'type-suggestions' : undefined}
                        />
                      )}
                    </div>

                    {form.attributes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttr(i)}
                        className="mt-2 rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Datalists for common values */}
            <datalist id="attr-name-suggestions">
              <option value="Color" />
              <option value="Size" />
              <option value="UK Size" />
              <option value="EU Size" />
              <option value="US Size" />
              <option value="Volume (ml)" />
              <option value="Volume" />
              <option value="Weight" />
              <option value="Type" />
              <option value="Scent" />
              <option value="Material" />
              <option value="Style" />
              <option value="Finish" />
              <option value="Flavour" />
            </datalist>
            <datalist id="size-suggestions">
              <option value="XS" /><option value="S" /><option value="M" />
              <option value="L" /><option value="XL" /><option value="XXL" />
              <option value="3XL" /><option value="Free Size" />
              <option value="6" /><option value="7" /><option value="8" />
              <option value="9" /><option value="10" /><option value="11" /><option value="12" />
            </datalist>
            <datalist id="volume-suggestions">
              <option value="10ml" /><option value="15ml" /><option value="20ml" />
              <option value="30ml" /><option value="50ml" /><option value="75ml" />
              <option value="100ml" /><option value="150ml" /><option value="200ml" />
              <option value="250ml" /><option value="500ml" />
            </datalist>
            <datalist id="type-suggestions">
              <option value="Eau de Parfum (EDP)" />
              <option value="Eau de Toilette (EDT)" />
              <option value="Eau de Cologne (EDC)" />
              <option value="Parfum" />
              <option value="Body Mist" />
              <option value="Roll-on" />
            </datalist>
          </div>

          {/* Pricing + Stock in one row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputCls}
                placeholder="999"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sale Price (₹)</label>
              <input
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stock *</label>
              <div className="mt-1 flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-primary overflow-hidden">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, Number(f.stock) - 1)) }))}
                  className="px-2.5 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full bg-transparent px-2 py-2 text-center text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, stock: String(Number(f.stock) + 1) }))}
                  className="px-2.5 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Assign images (collapsed by default) */}
          {productImages.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowImages((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                {showImages ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Assign product images to this variant
                {form.images.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {form.images.length}
                  </span>
                )}
              </button>
              {showImages && (
                <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {productImages.map((url) => {
                    const selected = form.images.includes(url);
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => toggleImage(url)}
                        className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                          selected ? 'border-primary shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        {selected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border"
            />
            <span className="text-sm font-medium">Active (visible in store)</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Update Variant' : 'Save Variant'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
