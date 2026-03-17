import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// ── RFM Scoring ──────────────────────────────────────────────
// Recency: days since last purchase (lower = better)
// Frequency: total orders
// Monetary: total spent

function scoreRFM(value: number, thresholds: number[], invert = false): number {
  // Returns 1-5 score. invert=true for recency (lower value = higher score)
  const sorted = invert ? [...thresholds].reverse() : thresholds;
  if (invert) {
    if (value <= sorted[0]) return 5;
    if (value <= sorted[1]) return 4;
    if (value <= sorted[2]) return 3;
    if (value <= sorted[3]) return 2;
    return 1;
  }
  if (value >= sorted[3]) return 5;
  if (value >= sorted[2]) return 4;
  if (value >= sorted[1]) return 3;
  if (value >= sorted[0]) return 2;
  return 1;
}

function classifyCustomer(r: number, f: number, m: number): { segment: string; label: string; color: string } {
  const score = r + f + m;
  if (r >= 4 && f >= 4 && m >= 4) return { segment: 'champion', label: 'Campeón', color: '#10b981' };
  if (r >= 4 && f >= 3) return { segment: 'loyal', label: 'Leal', color: '#3b82f6' };
  if (r >= 4 && f <= 2) return { segment: 'new', label: 'Nuevo prometedor', color: '#8b5cf6' };
  if (r >= 3 && f >= 3) return { segment: 'potential', label: 'Potencial leal', color: '#06b6d4' };
  if (r <= 2 && f >= 3) return { segment: 'at_risk', label: 'En riesgo', color: '#f59e0b' };
  if (r <= 2 && f >= 4 && m >= 4) return { segment: 'cant_lose', label: 'No puedes perder', color: '#ef4444' };
  if (r <= 2 && f <= 2) return { segment: 'hibernating', label: 'Hibernando', color: '#6b7280' };
  if (score >= 10) return { segment: 'loyal', label: 'Leal', color: '#3b82f6' };
  if (score >= 7) return { segment: 'potential', label: 'Potencial leal', color: '#06b6d4' };
  return { segment: 'needs_attention', label: 'Necesita atención', color: '#f97316' };
}

// ── Churn prediction (heuristic) ─────────────────────────────
function predictChurn(daysSinceLastOrder: number, avgDaysBetweenOrders: number, totalOrders: number): {
  risk: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  color: string;
} {
  if (totalOrders === 0) return { risk: 'high', score: 75, color: '#f59e0b' };
  if (totalOrders === 1) {
    if (daysSinceLastOrder > 90) return { risk: 'high', score: 80, color: '#f59e0b' };
    if (daysSinceLastOrder > 45) return { risk: 'medium', score: 55, color: '#f97316' };
    return { risk: 'low', score: 20, color: '#10b981' };
  }
  const ratio = avgDaysBetweenOrders > 0 ? daysSinceLastOrder / avgDaysBetweenOrders : daysSinceLastOrder / 30;
  if (ratio > 3) return { risk: 'critical', score: 95, color: '#ef4444' };
  if (ratio > 2) return { risk: 'high', score: 75, color: '#f59e0b' };
  if (ratio > 1.3) return { risk: 'medium', score: 50, color: '#f97316' };
  return { risk: 'low', score: 15, color: '#10b981' };
}

// ── CLV prediction ───────────────────────────────────────────
function predictCLV(avgOrderValue: number, ordersPerYear: number, estimatedLifespanYears: number): number {
  return avgOrderValue * ordersPerYear * estimatedLifespanYears;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const db = getDb();
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(authUser.userId) as { role: string } | undefined;
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // ── Fetch customer data with order metrics ───────────────
    const customers = db.prepare(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.birth_date, u.created_at,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date,
        MIN(o.created_at) AS first_order_date
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled' AND o.payment_status = 'completed'
      WHERE u.role = 'customer'
      GROUP BY u.id
    `).all() as Array<{
      id: string; email: string; first_name: string; last_name: string;
      birth_date: string | null; created_at: string;
      order_count: number; total_spent: number;
      last_order_date: string | null; first_order_date: string | null;
    }>;

    const now = Date.now();
    const dayMs = 86400000;

    // ── Calculate RFM thresholds from data ──────────────────
    const buyingCustomers = customers.filter(c => c.order_count > 0);
    const recencies = buyingCustomers.map(c => Math.floor((now - new Date(c.last_order_date!).getTime()) / dayMs));
    const frequencies = buyingCustomers.map(c => c.order_count);
    const monetaries = buyingCustomers.map(c => c.total_spent);

    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    };

    const rThresholds = [percentile(recencies, 75), percentile(recencies, 50), percentile(recencies, 25), percentile(recencies, 10)];
    const fThresholds = [percentile(frequencies, 25), percentile(frequencies, 50), percentile(frequencies, 75), percentile(frequencies, 90)];
    const mThresholds = [percentile(monetaries, 25), percentile(monetaries, 50), percentile(monetaries, 75), percentile(monetaries, 90)];

    // ── Process each customer ────────────────────────────────
    const rfmResults: Array<{
      id: string; email: string; name: string;
      r: number; f: number; m: number;
      segment: string; label: string; color: string;
      churn: { risk: string; score: number; color: string };
      clv: number;
      totalSpent: number; orderCount: number;
      daysSinceLastOrder: number | null;
      avgOrderValue: number;
    }> = [];

    for (const c of customers) {
      const daysSinceLastOrder = c.last_order_date
        ? Math.floor((now - new Date(c.last_order_date).getTime()) / dayMs)
        : null;

      const r = c.order_count > 0 ? scoreRFM(daysSinceLastOrder!, rThresholds, true) : 1;
      const f = scoreRFM(c.order_count, fThresholds);
      const m = scoreRFM(c.total_spent, mThresholds);

      const classification = classifyCustomer(r, f, m);

      // Avg days between orders
      let avgDaysBetween = 0;
      if (c.order_count > 1 && c.first_order_date && c.last_order_date) {
        const span = (new Date(c.last_order_date).getTime() - new Date(c.first_order_date).getTime()) / dayMs;
        avgDaysBetween = span / (c.order_count - 1);
      }

      const churn = predictChurn(daysSinceLastOrder ?? 999, avgDaysBetween, c.order_count);

      const avgOrderValue = c.order_count > 0 ? c.total_spent / c.order_count : 0;
      const daysSinceRegistration = Math.max(1, (now - new Date(c.created_at).getTime()) / dayMs);
      const ordersPerYear = (c.order_count / daysSinceRegistration) * 365;
      const clv = predictCLV(avgOrderValue, ordersPerYear, 2.5);

      rfmResults.push({
        id: c.id,
        email: c.email,
        name: `${c.first_name} ${c.last_name}`.trim() || c.email,
        r, f, m,
        segment: classification.segment,
        label: classification.label,
        color: classification.color,
        churn,
        clv,
        totalSpent: c.total_spent,
        orderCount: c.order_count,
        daysSinceLastOrder,
        avgOrderValue,
      });
    }

    // ── Segment distribution ─────────────────────────────────
    const segmentCounts: Record<string, number> = {};
    for (const r of rfmResults) {
      segmentCounts[r.segment] = (segmentCounts[r.segment] || 0) + 1;
    }

    // ── Churn distribution ───────────────────────────────────
    const churnCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of rfmResults) {
      churnCounts[r.churn.risk as keyof typeof churnCounts]++;
    }

    // ── AI Insights (generated from data patterns) ──────────
    const insights: Array<{ type: 'warning' | 'success' | 'info' | 'action'; title: string; description: string; priority: number }> = [];

    // At-risk revenue
    const atRiskCustomers = rfmResults.filter(r => r.churn.risk === 'critical' || r.churn.risk === 'high');
    const atRiskRevenue = atRiskCustomers.reduce((s, c) => s + c.totalSpent, 0);
    if (atRiskCustomers.length > 0) {
      insights.push({
        type: 'warning',
        title: `${atRiskCustomers.length} clientes en riesgo de abandono`,
        description: `Representan €${atRiskRevenue.toFixed(2)} en ingresos históricos. Considera enviar campañas de reactivación con descuentos personalizados.`,
        priority: 1,
      });
    }

    // Champions
    const champions = rfmResults.filter(r => r.segment === 'champion');
    if (champions.length > 0) {
      const champRevenue = champions.reduce((s, c) => s + c.totalSpent, 0);
      const pctRevenue = customers.length > 0 ? ((champRevenue / (rfmResults.reduce((s, c) => s + c.totalSpent, 0) || 1)) * 100) : 0;
      insights.push({
        type: 'success',
        title: `${champions.length} clientes campeones generan el ${pctRevenue.toFixed(0)}% de ingresos`,
        description: 'Estos clientes son tu activo más valioso. Prioriza su retención con experiencias exclusivas y acceso anticipado a colecciones.',
        priority: 2,
      });
    }

    // New customers potential
    const newPromising = rfmResults.filter(r => r.segment === 'new');
    if (newPromising.length > 0) {
      insights.push({
        type: 'info',
        title: `${newPromising.length} nuevos clientes prometedores`,
        description: 'Han comprado recientemente por primera vez. Una segunda compra en los próximos 30 días aumenta el CLV un 200%. Envía follow-ups personalizados.',
        priority: 3,
      });
    }

    // Birthday opportunities
    const nextWeekBirthdays = customers.filter(c => {
      if (!c.birth_date) return false;
      const [, m, d] = c.birth_date.split('-').map(Number);
      const today = new Date();
      for (let i = 0; i <= 7; i++) {
        const check = new Date(today.getTime() + i * dayMs);
        if (check.getMonth() + 1 === m && check.getDate() === d) return true;
      }
      return false;
    });
    if (nextWeekBirthdays.length > 0) {
      insights.push({
        type: 'action',
        title: `${nextWeekBirthdays.length} cumpleaños en los próximos 7 días`,
        description: 'Oportunidad de enviar descuentos de cumpleaños. Los emails de cumpleaños tienen un 45% más de apertura que emails regulares.',
        priority: 2,
      });
    }

    // Avg CLV
    const avgClv = rfmResults.length > 0 ? rfmResults.reduce((s, c) => s + c.clv, 0) / rfmResults.length : 0;
    const topClvCustomers = [...rfmResults].sort((a, b) => b.clv - a.clv).slice(0, 5);

    // Hibernating customers recoverability
    const hibernating = rfmResults.filter(r => r.segment === 'hibernating');
    if (hibernating.length > 3) {
      insights.push({
        type: 'action',
        title: `${hibernating.length} clientes hibernando`,
        description: 'Estos clientes no han comprado en mucho tiempo. Un descuento del 20%+ podría reactivar al 10-15% de ellos.',
        priority: 4,
      });
    }

    // Revenue concentration
    const totalRevenue = rfmResults.reduce((s, c) => s + c.totalSpent, 0);
    if (buyingCustomers.length > 0) {
      const sortedBySpent = [...buyingCustomers].sort((a, b) => b.total_spent - a.total_spent);
      const top20pct = sortedBySpent.slice(0, Math.max(1, Math.ceil(sortedBySpent.length * 0.2)));
      const top20Revenue = top20pct.reduce((s, c) => s + c.total_spent, 0);
      const concentration = totalRevenue > 0 ? (top20Revenue / totalRevenue) * 100 : 0;
      if (concentration > 60) {
        insights.push({
          type: 'warning',
          title: `Alta concentración de ingresos: el 20% de clientes genera el ${concentration.toFixed(0)}%`,
          description: 'Diversifica tu base de clientes. Si pierdes clientes top, el impacto sería significativo. Invierte en retención y en crecer el segmento medio.',
          priority: 3,
        });
      }
    }

    // Sort insights by priority
    insights.sort((a, b) => a.priority - b.priority);

    // ── Monthly cohort retention (simplified) ────────────────
    const monthlyOrders = db.prepare(`
      SELECT 
        strftime('%Y-%m', o.created_at) AS month,
        COUNT(DISTINCT o.user_id) AS active_customers,
        COUNT(o.id) AS orders,
        SUM(o.total) AS revenue
      FROM orders o
      WHERE o.status != 'cancelled' AND o.payment_status = 'completed'
        AND o.created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `).all() as Array<{ month: string; active_customers: number; orders: number; revenue: number }>;

    // ── Purchase frequency distribution ──────────────────────
    const freqDist = { '0': 0, '1': 0, '2-3': 0, '4-5': 0, '6+': 0 };
    for (const c of customers) {
      if (c.order_count === 0) freqDist['0']++;
      else if (c.order_count === 1) freqDist['1']++;
      else if (c.order_count <= 3) freqDist['2-3']++;
      else if (c.order_count <= 5) freqDist['4-5']++;
      else freqDist['6+']++;
    }

    // ── Category affinity (for recommendations) ─────────────
    const categoryAffinity = db.prepare(`
      SELECT 
        p.category,
        COUNT(DISTINCT o.user_id) AS unique_buyers,
        SUM(oi.quantity) AS total_units,
        SUM(oi.total_price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled' AND o.payment_status = 'completed'
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `).all() as Array<{ category: string; unique_buyers: number; total_units: number; total_revenue: number }>;

    // ── Response ─────────────────────────────────────────────
    return NextResponse.json({
      summary: {
        totalCustomers: customers.length,
        buyingCustomers: buyingCustomers.length,
        avgClv: Math.round(avgClv * 100) / 100,
        totalRevenue,
        avgOrderValue: buyingCustomers.length > 0 ? totalRevenue / buyingCustomers.reduce((s, c) => s + c.order_count, 0) : 0,
        repeatRate: buyingCustomers.length > 0 ? (buyingCustomers.filter(c => c.order_count > 1).length / buyingCustomers.length) * 100 : 0,
      },
      rfm: {
        segmentCounts,
        segments: [
          { key: 'champion', label: 'Campeones', color: '#10b981' },
          { key: 'loyal', label: 'Leales', color: '#3b82f6' },
          { key: 'potential', label: 'Potencial leal', color: '#06b6d4' },
          { key: 'new', label: 'Nuevos prometedores', color: '#8b5cf6' },
          { key: 'needs_attention', label: 'Necesita atención', color: '#f97316' },
          { key: 'at_risk', label: 'En riesgo', color: '#f59e0b' },
          { key: 'cant_lose', label: 'No puedes perder', color: '#ef4444' },
          { key: 'hibernating', label: 'Hibernando', color: '#6b7280' },
        ],
      },
      churn: churnCounts,
      insights,
      topClvCustomers: topClvCustomers.map(c => ({
        id: c.id, name: c.name, email: c.email,
        clv: Math.round(c.clv * 100) / 100,
        totalSpent: c.totalSpent, orderCount: c.orderCount,
        segment: c.label,
      })),
      customers: rfmResults.map(c => ({
        id: c.id, name: c.name, email: c.email,
        r: c.r, f: c.f, m: c.m,
        segment: c.segment, label: c.label, color: c.color,
        churnRisk: c.churn.risk, churnScore: c.churn.score, churnColor: c.churn.color,
        clv: Math.round(c.clv * 100) / 100,
        totalSpent: c.totalSpent, orderCount: c.orderCount,
        daysSinceLastOrder: c.daysSinceLastOrder,
        avgOrderValue: Math.round(c.avgOrderValue * 100) / 100,
      })),
      charts: {
        monthlyActivity: monthlyOrders,
        frequencyDistribution: freqDist,
        categoryAffinity,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
