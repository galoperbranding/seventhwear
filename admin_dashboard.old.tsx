'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalSubscribers: number;
  avgOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
}

interface Trends {
  thisMonth: { revenue: number; orders: number };
  lastMonth: { revenue: number; orders: number };
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
}

interface DayData { day: string; total: number; orders: number }
interface MonthData { month: string; total: number; orders: number }
interface StatusData { status: string; count: number }
interface TopProduct { name: string; image: string; units_sold: number; revenue: number }
interface CategoryData { category: string; orders: number; revenue: number }

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  first_name: string;
  last_name: string;
  user_email: string;
  payment_status: string;
}

interface Product { id: string; name: string; stock: number }

interface DashboardData {
  stats: Stats;
  trends: Trends;
  today: { count: number; revenue: number };
  charts: {
    revenueLast7Days: DayData[];
    revenueLast6Months: MonthData[];
    ordersByStatus: StatusData[];
    topProducts: TopProduct[];
    topCategories: CategoryData[];
  };
  recentOrders: Order[];
  lowStock: Product[];
}

function trendPercent(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

function MiniChart({ data, height = 48 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="crm-mini-chart" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="crm-mini-chart-bar" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

function RevenueChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const monthNames: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  };
  return (
    <div className="crm-chart">
      <div className="crm-chart-bars">
        {data.map((d, i) => (
          <div key={i} className="crm-chart-col">
            <div className="crm-chart-bar-wrap">
              <div className="crm-chart-bar" style={{ height: `${(d.total / max) * 100}%` }}
                title={`€${d.total.toFixed(2)} — ${d.orders} pedidos`} />
            </div>
            <span className="crm-chart-label">{monthNames[d.month.split('-')[1]] || d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBreakdown({ data }: { data: StatusData[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const statusColors: Record<string, string> = {
    pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
    shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
  };
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };
  return (
    <div className="crm-status-breakdown">
      {data.map((d, i) => (
        <div key={i} className="crm-status-row">
          <span className="crm-status-dot" style={{ background: statusColors[d.status] || '#999' }} />
          <span className="crm-status-name">{statusLabels[d.status] || d.status}</span>
          <span className="crm-status-bar-wrap">
            <span className="crm-status-bar" style={{ width: `${(d.count / total) * 100}%`, background: statusColors[d.status] || '#999' }} />
          </span>
          <span className="crm-status-val">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin')
        .then(res => res.json())
        .then(d => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const revenueTrend = useMemo(() => {
    if (!data) return { value: 0, direction: 'flat' as const };
    return trendPercent(data.trends.thisMonth.revenue, data.trends.lastMonth.revenue);
  }, [data]);

  const ordersTrend = useMemo(() => {
    if (!data) return { value: 0, direction: 'flat' as const };
    return trendPercent(data.trends.thisMonth.orders, data.trends.lastMonth.orders);
  }, [data]);

  const customersTrend = useMemo(() => {
    if (!data) return { value: 0, direction: 'flat' as const };
    return trendPercent(data.trends.newCustomersThisMonth, data.trends.newCustomersLastMonth);
  }, [data]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="crm-loading-page"><div className="crm-spinner" /></div>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };

  return (
    <>
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">Dashboard</h1>
          <p className="crm-page-subtitle">Vista general de tu negocio</p>
        </div>
        <div className="crm-topbar-actions">
          {data && data.stats.pendingOrders > 0 && (
            <Link href="/admin/pedidos" className="crm-topbar-alert">
              <span className="crm-alert-pulse" />
              {data.stats.pendingOrders} pendiente{data.stats.pendingOrders !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="crm-loading-page"><div className="crm-spinner" /></div>
      ) : data && (
        <div className="crm-dashboard">

          {data.today.count > 0 && (
            <div className="crm-today-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Hoy: <strong>{data.today.count} pedido{data.today.count !== 1 ? 's' : ''}</strong> por <strong>€{data.today.revenue.toFixed(2)}</strong></span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="crm-kpi-grid">
            <div className="crm-kpi-card">
              <div className="crm-kpi-header">
                <span className="crm-kpi-label">Ingresos totales</span>
                <div className={`crm-kpi-trend ${revenueTrend.direction}`}>
                  {revenueTrend.direction !== 'flat' && <>{revenueTrend.direction === 'up' ? '↑' : '↓'} {revenueTrend.value.toFixed(1)}%</>}
                </div>
              </div>
              <div className="crm-kpi-value">€{data.stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
              <div className="crm-kpi-sub">Este mes: €{data.trends.thisMonth.revenue.toFixed(2)}</div>
              {data.charts.revenueLast7Days.length > 0 && <MiniChart data={data.charts.revenueLast7Days.map(d => d.total)} />}
            </div>

            <div className="crm-kpi-card">
              <div className="crm-kpi-header">
                <span className="crm-kpi-label">Pedidos</span>
                <div className={`crm-kpi-trend ${ordersTrend.direction}`}>
                  {ordersTrend.direction !== 'flat' && <>{ordersTrend.direction === 'up' ? '↑' : '↓'} {ordersTrend.value.toFixed(1)}%</>}
                </div>
              </div>
              <div className="crm-kpi-value">{data.stats.totalOrders}</div>
              <div className="crm-kpi-sub">Este mes: {data.trends.thisMonth.orders}</div>
              {data.charts.revenueLast7Days.length > 0 && <MiniChart data={data.charts.revenueLast7Days.map(d => d.orders)} />}
            </div>

            <div className="crm-kpi-card">
              <div className="crm-kpi-header">
                <span className="crm-kpi-label">Clientes</span>
                <div className={`crm-kpi-trend ${customersTrend.direction}`}>
                  {customersTrend.direction !== 'flat' && <>{customersTrend.direction === 'up' ? '↑' : '↓'} {customersTrend.value.toFixed(1)}%</>}
                </div>
              </div>
              <div className="crm-kpi-value">{data.stats.totalUsers}</div>
              <div className="crm-kpi-sub">Nuevos este mes: {data.trends.newCustomersThisMonth}</div>
            </div>

            <div className="crm-kpi-card">
              <div className="crm-kpi-header">
                <span className="crm-kpi-label">Ticket medio</span>
              </div>
              <div className="crm-kpi-value">€{data.stats.avgOrderValue.toFixed(2)}</div>
              <div className="crm-kpi-sub">Conversión: {data.stats.conversionRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Charts */}
          <div className="crm-charts-grid">
            <div className="crm-card crm-card-chart">
              <div className="crm-card-header">
                <h3>Ingresos mensuales</h3>
                <span className="crm-card-badge">Últimos 6 meses</span>
              </div>
              {data.charts.revenueLast6Months.length > 0 ? (
                <RevenueChart data={data.charts.revenueLast6Months} />
              ) : (
                <p className="crm-empty-chart">Sin datos de ingresos aún</p>
              )}
            </div>

            <div className="crm-card">
              <div className="crm-card-header">
                <h3>Estado de pedidos</h3>
                <span className="crm-card-badge">{data.stats.totalOrders} total</span>
              </div>
              {data.charts.ordersByStatus.length > 0 ? (
                <StatusBreakdown data={data.charts.ordersByStatus} />
              ) : (
                <p className="crm-empty-chart">Sin pedidos aún</p>
              )}
            </div>
          </div>

          {/* Top Products + Recent Orders */}
          <div className="crm-bottom-grid">
            <div className="crm-card">
              <div className="crm-card-header">
                <h3>Productos top</h3>
              </div>
              {data.charts.topProducts.length > 0 ? (
                <div className="crm-top-products">
                  {data.charts.topProducts.map((p, i) => (
                    <div key={i} className="crm-top-product-row">
                      <span className="crm-top-product-rank">#{i + 1}</span>
                      {p.image && <img src={p.image} alt="" className="crm-top-product-img" />}
                      <div className="crm-top-product-info">
                        <span className="crm-top-product-name">{p.name}</span>
                        <span className="crm-top-product-units">{p.units_sold} uds.</span>
                      </div>
                      <span className="crm-top-product-revenue">€{p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="crm-empty-chart">Sin ventas aún</p>
              )}
            </div>

            <div className="crm-card">
              <div className="crm-card-header">
                <h3>Pedidos recientes</h3>
                <Link href="/admin/pedidos" className="crm-card-link">Ver todos →</Link>
              </div>
              {data.recentOrders.length > 0 ? (
                <div className="crm-recent-orders">
                  {data.recentOrders.slice(0, 8).map(order => (
                    <div key={order.id} className="crm-recent-order-row">
                      <div className="crm-recent-order-info">
                        <span className="crm-recent-order-num">#{order.order_number}</span>
                        <span className="crm-recent-order-name">{order.first_name} {order.last_name}</span>
                      </div>
                      <span className={`crm-badge crm-badge-${order.status}`}>{statusLabels[order.status] || order.status}</span>
                      <span className="crm-recent-order-amount">€{order.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="crm-empty-chart">No hay pedidos aún</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="crm-alerts-grid">
            {data.lowStock.length > 0 && (
              <div className="crm-card crm-card-alert">
                <div className="crm-card-header">
                  <h3>⚠ Stock bajo</h3>
                  <Link href="/admin/productos" className="crm-card-link">Gestionar →</Link>
                </div>
                <div className="crm-low-stock-list">
                  {data.lowStock.map(p => (
                    <div key={p.id} className="crm-low-stock-row">
                      <span>{p.name}</span>
                      <span className={`crm-stock-badge ${p.stock < 3 ? 'critical' : p.stock < 5 ? 'warning' : 'low'}`}>
                        {p.stock} uds.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="crm-card">
              <div className="crm-card-header">
                <h3>Resumen rápido</h3>
              </div>
              <div className="crm-quick-stats">
                <div className="crm-quick-stat">
                  <span className="crm-quick-stat-icon">📦</span>
                  <div><span className="crm-quick-stat-value">{data.stats.totalProducts}</span><span className="crm-quick-stat-label">Productos</span></div>
                </div>
                <div className="crm-quick-stat">
                  <span className="crm-quick-stat-icon">📧</span>
                  <div><span className="crm-quick-stat-value">{data.stats.totalSubscribers}</span><span className="crm-quick-stat-label">Suscriptores</span></div>
                </div>
                <div className="crm-quick-stat">
                  <span className="crm-quick-stat-icon">🎯</span>
                  <div><span className="crm-quick-stat-value">{data.stats.conversionRate.toFixed(1)}%</span><span className="crm-quick-stat-label">Conversión</span></div>
                </div>
                {data.charts.topCategories.length > 0 && (
                  <div className="crm-quick-stat">
                    <span className="crm-quick-stat-icon">🏷️</span>
                    <div><span className="crm-quick-stat-value">{data.charts.topCategories[0].category}</span><span className="crm-quick-stat-label">Categoría top</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
