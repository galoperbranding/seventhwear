'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/home/Newsletter';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  images: string[];
  colors: string[];
  category: string;
  collection: string;
}

const CATEGORIES = [
  { value: 'tees', label: 'Tees' },
  { value: 'hoodies', label: 'Hoodies & Sweaters' },
  { value: 'pants', label: 'Pants' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'ridewear', label: 'Ridewear' },
];

const COLLECTIONS = [
  { value: 'street-collection', label: 'Street Collection' },
  { value: 'ride-collection', label: 'Ride Collection' },
  { value: 'essentials', label: 'Essentials' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  { value: '#000000', label: 'Negro' },
  { value: '#ffffff', label: 'Blanco', border: true },
  { value: '#4a5d3a', label: 'Olive' },
  { value: '#c9b99a', label: 'Sand' },
  { value: '#888888', label: 'Gris' },
  { value: '#2e5090', label: 'Azul' },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(false);

  // Read filters from URL
  const urlCategory = searchParams.get('category') || '';
  const urlCollection = searchParams.get('collection') || '';
  const urlBadge = searchParams.get('badge') || '';
  const urlSearch = searchParams.get('search') || '';

  const [selectedCategories, setSelectedCategories] = useState<string[]>(urlCategory ? [urlCategory] : []);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(urlCollection ? [urlCollection] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [badge, setBadge] = useState(urlBadge);

  // Update state when URL params change
  useEffect(() => {
    if (urlCategory) setSelectedCategories([urlCategory]);
    if (urlCollection) setSelectedCollections([urlCollection]);
    setBadge(urlBadge);
  }, [urlCategory, urlCollection, urlBadge]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategories.length === 1) params.set('category', selectedCategories[0]);
    if (selectedCollections.length === 1) params.set('collection', selectedCollections[0]);
    if (badge) params.set('badge', badge);
    if (urlSearch) params.set('search', urlSearch);
    if (sort !== 'featured') params.set('sort', sort === 'name' ? 'name-asc' : sort);
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      let filtered = data.products || [];

      // Client-side filtering for multi-select
      if (selectedCategories.length > 1) {
        filtered = filtered.filter((p: Product) => selectedCategories.includes(p.category));
      }
      if (selectedCollections.length > 1) {
        filtered = filtered.filter((p: Product) => selectedCollections.includes(p.collection));
      }

      setProducts(filtered);
      setTotal(filtered.length);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategories, selectedCollections, badge, urlSearch, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function toggleFilter(arr: string[], value: string, setter: (v: string[]) => void) {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  // Title logic
  let pageTitle = 'Todos los productos';
  let pageDesc = 'Explora nuestra colección completa de StreetRideWear';
  if (urlSearch) {
    pageTitle = `Resultados para "${urlSearch}"`;
    pageDesc = `${total} producto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
  } else if (selectedCollections.length === 1) {
    const collectionNames: Record<string, string> = {
      'street-collection': 'Street Collection',
      'ride-collection': 'Ride Collection',
      'essentials': 'Essentials',
    };
    pageTitle = collectionNames[selectedCollections[0]] || selectedCollections[0];
  } else if (selectedCategories.length === 1) {
    const categoryNames: Record<string, string> = {
      tees: 'Camisetas',
      hoodies: 'Hoodies',
      pants: 'Pantalones',
      jerseys: 'Jerseys',
      jackets: 'Chaquetas',
      ridewear: 'Ridewear',
    };
    pageTitle = categoryNames[selectedCategories[0]] || selectedCategories[0];
  } else if (badge === 'sale') {
    pageTitle = 'Sale';
    pageDesc = 'Descuentos especiales en productos seleccionados';
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setBadge('');
    window.history.replaceState(null, '', '/shop');
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p>{pageDesc}</p>
      </div>

      <div className="container">
        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="shop-toolbar-left">
            <button className="filter-btn" onClick={() => setFilterOpen(true)}>
              <svg viewBox="0 0 24 24" strokeWidth="1.5"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line><circle cx="8" cy="6" r="2" fill="currentColor"></circle><circle cx="16" cy="12" r="2" fill="currentColor"></circle><circle cx="10" cy="18" r="2" fill="currentColor"></circle></svg>
              Filtros
            </button>
            <span className="results-count">{total} producto{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="shop-toolbar-right">
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="featured">Destacados</option>
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre: A-Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No se encontraron productos</p>
            <button onClick={clearFilters} className="btn btn-outline">
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="product-grid reveal-stagger" key={products.map(p => p.id).join(',')}>
            {products.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: '80px' }}></div>

      <Newsletter />

      {/* Filter Sidebar */}
      <div className={`filter-overlay${filterOpen ? ' open' : ''}`} onClick={() => setFilterOpen(false)}></div>
      <div className={`filter-sidebar${filterOpen ? ' open' : ''}`}>
        <button className="filter-sidebar-close" onClick={() => setFilterOpen(false)}>×</button>

        <div className="filter-group">
          <h4>Categoría</h4>
          {CATEGORIES.map(cat => (
            <label className="filter-option" key={cat.value}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.value)}
                onChange={() => toggleFilter(selectedCategories, cat.value, setSelectedCategories)}
              /> {cat.label}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <h4>Colección</h4>
          {COLLECTIONS.map(col => (
            <label className="filter-option" key={col.value}>
              <input
                type="checkbox"
                checked={selectedCollections.includes(col.value)}
                onChange={() => toggleFilter(selectedCollections, col.value, setSelectedCollections)}
              /> {col.label}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <h4>Talla</h4>
          <div className="size-options">
            {SIZES.map(size => (
              <span
                key={size}
                className={`size-option${selectedSizes.includes(size) ? ' active' : ''}`}
                onClick={() => toggleFilter(selectedSizes, size, setSelectedSizes)}
              >{size}</span>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>Color</h4>
          <div className="color-options">
            {COLORS.map(color => (
              <span
                key={color.value}
                className={`color-swatch${selectedColors.includes(color.value) ? ' active' : ''}`}
                style={{
                  background: color.value,
                  ...(color.border ? { border: '1px solid #333' } : {}),
                }}
                title={color.label}
                onClick={() => toggleFilter(selectedColors, color.value, setSelectedColors)}
              ></span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
