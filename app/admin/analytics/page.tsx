'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Segment { key: string; label: string; color: string }
interface Insight { type: 'warning' | 'success' | 'info' | 'action'; title: string; description: string }
interface CLVCustomer { id: string; name: string; email: string; clv: number; totalSpent: number; orderCount: number; segment: string }
interface CustomerRow {
  id: string; name: string; email: string;
  r: number; f: number; m: number;
  segment: string; label: string; color: string;
  churnRisk: string; churnScore: number; churnColor: string;
  clv: number; totalSpent: number; orderCount: number;
  daysSinceLastOrder: number | null; avgOrderValue: number;
}
interface MonthlyActivity { month: string; active_customers: number; orders: number; revenue: number }
interface CategoryAffinity { category: string; unique_buyers: number; total_units: number; total_revenue: number }

interface AnalyticsData {
  summary: {
    totalCustomers: number; buyingCustomers: number;
    avgClv: number; totalRevenue: number; avgOrderValue: number; repeatRate: number;
  };
  rfm: { segmentCounts: Record<string, number>; segments: Segment[] };
  churn: { low: number; medium: number; high: number; critical: number };
  insights: Insight[];
  topClvCustomers: CLVCustomer[];
  customers: CustomerRow[];
  charts: {
    monthlyActivity: MonthlyActivity[];
    frequencyDistribution: Record<string, number>;
    categoryAffinity: CategoryAffinity[];
  };
}

const insightIcons: Record<string, string> = {
  warning: '⚠️', success: '✅', info: '💡', action: '🎯',
};

const churnLabels: Record<string, string> = {
  low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico',
};

const churnColors: Record<string, string> = {
  low: '#10b981', medium: '#f97316', high: '#f59e0b', critical: '#ef4444',
};

const monthNames: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'customers'>('overview');
  const [sortBy, setSortBy] = useState<'clv' | 'churn' | 'spent'>('clv');
  const [filterSegment, setFilterSegment] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/analytics')
        .then(res => res.json())
        .then(d => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="crm-loading-page"><div className="crm-spinner" /></div>;
  }

  const filteredCustomers = data ? data.customers
    .filter(c => filterSegment === 'all' || c.segment === filterSegment)
    .sort((a, b) => {
      if (sortBy === 'clv') return b.clv - a.clv;
      if (sortBy === 'churn') return b.churnScore - a.churnScore;
      return b.totalSpent - a.totalSpent;
    }) : [];

  return (
    <>
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">IA & Analítica</h1>
          <p className="crm-page-subtitle">Análisis predictivo e insights inteligentes</p>
        </div>
        <div className="crm-topbar-actions">
          <button
            onClick={() => setActiveView('overview')}
            className={`crm-action-btn ${activeView === 'overview' ? 'crm-action-btn-active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Overview
          </button>
          <button
            onClick={() => setActiveView('customers')}
            className={`crm-action-btn ${activeView === 'customers' ? 'crm-action-btn-active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Clientes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="crm-loading-page"><div className="crm-spinner" /></div>
      ) : data && activeView === 'overview' ? (
        <div className="ai-analytics">

          {/* AI Insights Banner */}
          {data.insights.length > 0 && (
            <div className="ai-insights-section">
              <div className="ai-section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H10a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
                <h2>Insights de IA</h2>
                <span className="ai-insight-badge">{data.insights.length} recomendaciones</span>
              </div>
              <div className="ai-insights-grid">
                {data.insights.map((insight, i) => (
                  <div key={i} className={`ai-insight-card ai-insight-${insight.type}`}>
                    <div className="ai-insight-icon">{insightIcons[insight.type]}</div>
                    <div className="ai-insight-content">
                      <h4>{insight.title}</h4>
                      <p>{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPI Summary */}
          <div className="ai-kpi-row">
            <div className="ai-kpi">
              <span className="ai-kpi-label">CLV Promedio</span>
              <span className="ai-kpi-value">S/{data.summary.avgClv.toFixed(2)}</span>
              <span className="ai-kpi-sub">Valor de vida estimado a 2.5 años</span>
            </div>
            <div className="ai-kpi">
              <span className="ai-kpi-label">Tasa de repetición</span>
              <span className="ai-kpi-value">{data.summary.repeatRate.toFixed(1)}%</span>
              <span className="ai-kpi-sub">Clientes con más de 1 compra</span>
            </div>
            <div className="ai-kpi">
              <span className="ai-kpi-label">Clientes compradores</span>
              <span className="ai-kpi-value">{data.summary.buyingCustomers} <span className="ai-kpi-of">/ {data.summary.totalCustomers}</span></span>
              <span className="ai-kpi-sub">Tasa de conversión: {data.summary.totalCustomers > 0 ? ((data.summary.buyingCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="ai-kpi">
              <span className="ai-kpi-label">Ticket medio</span>
              <span className="ai-kpi-value">S/{data.summary.avgOrderValue.toFixed(2)}</span>
              <span className="ai-kpi-sub">Ingresos totales: S/{data.summary.totalRevenue.toFixed(2)}</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="ai-grid-2">

            {/* RFM Segmentation */}
            <div className="ai-card">
              <h3 className="ai-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                Segmentación RFM
              </h3>
              <p className="ai-card-desc">Clasificación basada en Recencia, Frecuencia y Valor Monetario</p>
              <div className="ai-rfm-segments">
                {data.rfm.segments.map(seg => {
                  const count = data.rfm.segmentCounts[seg.key] || 0;
                  const pct = data.summary.totalCustomers > 0 ? (count / data.summary.totalCustomers) * 100 : 0;
                  return (
                    <div key={seg.key} className="ai-rfm-row">
                      <span className="ai-rfm-dot" style={{ background: seg.color }} />
                      <span className="ai-rfm-label">{seg.label}</span>
                      <span className="ai-rfm-bar-wrap">
                        <span className="ai-rfm-bar" style={{ width: `${Math.max(pct, 2)}%`, background: seg.color }} />
                      </span>
                      <span className="ai-rfm-count">{count}</span>
                      <span className="ai-rfm-pct">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Churn Risk */}
            <div className="ai-card">
              <h3 className="ai-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Predicción de Abandono
              </h3>
              <p className="ai-card-desc">Probabilidad de que cada cliente deje de comprar</p>
              <div className="ai-churn-overview">
                {(['low', 'medium', 'high', 'critical'] as const).map(level => {
                  const count = data.churn[level];
                  const pct = data.summary.totalCustomers > 0 ? (count / data.summary.totalCustomers) * 100 : 0;
                  return (
                    <div key={level} className="ai-churn-level">
                      <div className="ai-churn-level-header">
                        <span className="ai-churn-dot" style={{ background: churnColors[level] }} />
                        <span className="ai-churn-name">Riesgo {churnLabels[level]}</span>
                        <span className="ai-churn-count">{count}</span>
                      </div>
                      <div className="ai-churn-bar-wrap">
                        <div className="ai-churn-bar" style={{ width: `${Math.max(pct, 1)}%`, background: churnColors[level] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="ai-churn-summary">
                <div className="ai-churn-stat">
                  <span className="ai-churn-stat-val" style={{ color: '#ef4444' }}>{data.churn.critical + data.churn.high}</span>
                  <span className="ai-churn-stat-label">Requieren acción</span>
                </div>
                <div className="ai-churn-stat">
                  <span className="ai-churn-stat-val" style={{ color: '#10b981' }}>{data.churn.low}</span>
                  <span className="ai-churn-stat-label">Saludables</span>
                </div>
              </div>
            </div>
          </div>

          {/* Second row */}
          <div className="ai-grid-2">

            {/* Top CLV Customers */}
            <div className="ai-card">
              <h3 className="ai-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Top 5 CLV — Clientes más valiosos
              </h3>
              <p className="ai-card-desc">Valor de vida estimado del cliente (Customer Lifetime Value)</p>
              <div className="ai-top-clv">
                {data.topClvCustomers.map((c, i) => (
                  <Link key={c.id} href={`/admin/clientes/${c.id}`} className="ai-clv-row">
                    <span className="ai-clv-rank">#{i + 1}</span>
                    <div className="ai-clv-info">
                      <span className="ai-clv-name">{c.name}</span>
                      <span className="ai-clv-meta">{c.orderCount} pedidos · S/{c.totalSpent.toFixed(2)} gastados · {c.segment}</span>
                    </div>
                    <span className="ai-clv-value">S/{c.clv.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Purchase frequency */}
            <div className="ai-card">
              <h3 className="ai-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Distribución de frecuencia de compra
              </h3>
              <p className="ai-card-desc">Cuántas compras ha hecho cada cliente</p>
              <div className="ai-freq-chart">
                {Object.entries(data.charts.frequencyDistribution).map(([label, count]) => {
                  const pct = data.summary.totalCustomers > 0 ? (count / data.summary.totalCustomers) * 100 : 0;
                  return (
                    <div key={label} className="ai-freq-row">
                      <span className="ai-freq-label">{label} compras</span>
                      <div className="ai-freq-bar-wrap">
                        <div className="ai-freq-bar" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="ai-freq-count">{count}</span>
                      <span className="ai-freq-pct">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Third row */}
          <div className="ai-grid-2">

            {/* Monthly cohort */}
            {data.charts.monthlyActivity.length > 0 && (
              <div className="ai-card">
                <h3 className="ai-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Actividad mensual
                </h3>
                <p className="ai-card-desc">Clientes activos, pedidos e ingresos por mes</p>
                <div className="ai-monthly-chart">
                  {(() => {
                    const maxRev = Math.max(...data.charts.monthlyActivity.map(m => m.revenue), 1);
                    return data.charts.monthlyActivity.map((m, i) => (
                      <div key={i} className="ai-monthly-col">
                        <div className="ai-monthly-bar-wrap">
                          <div className="ai-monthly-bar" style={{ height: `${(m.revenue / maxRev) * 100}%` }}
                            title={`S/${m.revenue.toFixed(2)} — ${m.orders} pedidos — ${m.active_customers} clientes`} />
                        </div>
                        <span className="ai-monthly-label">{monthNames[m.month.split('-')[1]] || m.month}</span>
                        <span className="ai-monthly-val">S/{m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue.toFixed(0)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Category affinity */}
            {data.charts.categoryAffinity.length > 0 && (
              <div className="ai-card">
                <h3 className="ai-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Afinidad por categoría
                </h3>
                <p className="ai-card-desc">Qué categorías atraen más compradores únicos</p>
                <div className="ai-category-list">
                  {data.charts.categoryAffinity.map((cat, i) => {
                    const maxBuyers = Math.max(...data.charts.categoryAffinity.map(c => c.unique_buyers), 1);
                    return (
                      <div key={i} className="ai-cat-row">
                        <span className="ai-cat-name">{cat.category}</span>
                        <div className="ai-cat-bar-wrap">
                          <div className="ai-cat-bar" style={{ width: `${(cat.unique_buyers / maxBuyers) * 100}%` }} />
                        </div>
                        <div className="ai-cat-stats">
                          <span>{cat.unique_buyers} compradores</span>
                          <span>S/{cat.total_revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      ) : data && activeView === 'customers' ? (
        <div className="ai-analytics">
          {/* Filters */}
          <div className="ai-customer-filters">
            <div className="ai-filter-group">
              <label>Segmento:</label>
              <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="ai-filter-select">
                <option value="all">Todos</option>
                {data.rfm.segments.map(seg => (
                  <option key={seg.key} value={seg.key}>{seg.label} ({data.rfm.segmentCounts[seg.key] || 0})</option>
                ))}
              </select>
            </div>
            <div className="ai-filter-group">
              <label>Ordenar por:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'clv' | 'churn' | 'spent')} className="ai-filter-select">
                <option value="clv">CLV (mayor primero)</option>
                <option value="churn">Riesgo de abandono</option>
                <option value="spent">Total gastado</option>
              </select>
            </div>
            <span className="ai-filter-count">{filteredCustomers.length} clientes</span>
          </div>

          {/* Customer table */}
          <div className="ai-customer-table-wrap">
            <table className="ai-customer-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th>R</th>
                  <th>F</th>
                  <th>M</th>
                  <th>Pedidos</th>
                  <th>Gastado</th>
                  <th>CLV</th>
                  <th>Riesgo</th>
                  <th>Última compra</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, 50).map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/clientes/${c.id}`} className="ai-customer-link">
                        <span className="ai-customer-name">{c.name}</span>
                        <span className="ai-customer-email">{c.email}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="ai-segment-badge" style={{ background: `${c.color}18`, color: c.color, borderColor: `${c.color}40` }}>
                        {c.label}
                      </span>
                    </td>
                    <td><span className={`ai-rfm-score ai-rfm-${c.r >= 4 ? 'high' : c.r >= 3 ? 'mid' : 'low'}`}>{c.r}</span></td>
                    <td><span className={`ai-rfm-score ai-rfm-${c.f >= 4 ? 'high' : c.f >= 3 ? 'mid' : 'low'}`}>{c.f}</span></td>
                    <td><span className={`ai-rfm-score ai-rfm-${c.m >= 4 ? 'high' : c.m >= 3 ? 'mid' : 'low'}`}>{c.m}</span></td>
                    <td>{c.orderCount}</td>
                    <td>S/{c.totalSpent.toFixed(2)}</td>
                    <td className="ai-clv-cell">S/{c.clv.toFixed(2)}</td>
                    <td>
                      <span className="ai-churn-badge" style={{ background: `${c.churnColor}18`, color: c.churnColor, borderColor: `${c.churnColor}40` }}>
                        {churnLabels[c.churnRisk] || c.churnRisk}
                      </span>
                    </td>
                    <td className="ai-last-order">
                      {c.daysSinceLastOrder !== null ? `hace ${c.daysSinceLastOrder}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length > 50 && (
            <p className="ai-table-note">Mostrando 50 de {filteredCustomers.length} clientes</p>
          )}
        </div>
      ) : null}
    </>
  );
}
