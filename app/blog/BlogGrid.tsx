'use client';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}

export default function BlogGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '40px' }}>
      {posts.map((post) => (
        <article key={post.slug} style={{ cursor: 'pointer' }}>
          <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: 'var(--color-bg-secondary)', marginBottom: '1.5rem' }}>
            <img
              src={post.image}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-medium)' }}
              loading="lazy"
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            <span>{post.category}</span>
            <span>•</span>
            <span>{post.date}</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: 500 }}>{post.title}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
