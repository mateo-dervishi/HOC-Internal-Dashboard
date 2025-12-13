import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PoundSterling, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Wallet,
  Receipt,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials } from '../types';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts';

type TimeScale = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const NetProfit = () => {
  const { state } = useDashboard();
  const [timeScale, setTimeScale] = useState<TimeScale>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    state.projects.forEach(p => {
      p.payments.forEach(pay => {
        years.add(new Date(pay.date).getFullYear());
      });
    });
    state.operationalCosts.forEach(c => {
      years.add(new Date(c.date).getFullYear());
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [state]);

  // Calculate all project profits
  const projectProfits = useMemo(() => {
    return state.projects.map(project => {
      const financials = calculateProjectFinancials(project);
      return { ...project, ...financials };
    });
  }, [state.projects]);

  // Filter data by year
  const yearPayments = useMemo(() => {
    const payments: { date: string; amount: number; vatAmount: number; type: 'account' | 'cash'; projectCode: string }[] = [];
    state.projects.forEach(p => {
      p.payments.forEach(pay => {
        if (new Date(pay.date).getFullYear() === selectedYear) {
          const vatAmount = pay.amount * (pay.vatRate || 0);
          payments.push({
            date: pay.date,
            amount: pay.amount + vatAmount,
            vatAmount,
            type: pay.type,
            projectCode: p.code,
          });
        }
      });
    });
    return payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.projects, selectedYear]);

  const yearSupplierCosts = useMemo(() => {
    const costs: { date: string; amount: number; projectCode: string }[] = [];
    state.projects.forEach(p => {
      p.supplierCosts.forEach(c => {
        if (new Date(c.date).getFullYear() === selectedYear) {
          costs.push({ date: c.date, amount: c.amount, projectCode: p.code });
        }
      });
    });
    return costs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.projects, selectedYear]);

  const yearOperationalCosts = useMemo(() => {
    return state.operationalCosts.filter(c => new Date(c.date).getFullYear() === selectedYear);
  }, [state.operationalCosts, selectedYear]);

  // Monthly/Weekly aggregated data
  const timeSeriesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (timeScale === 'monthly' || timeScale === 'quarterly' || timeScale === 'yearly') {
      return months.map((month, idx) => {
        const monthPayments = yearPayments.filter(p => new Date(p.date).getMonth() === idx);
        const monthSupplierCosts = yearSupplierCosts.filter(c => new Date(c.date).getMonth() === idx);
        const monthOpCosts = yearOperationalCosts.filter(c => new Date(c.date).getMonth() === idx);
        
        const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const supplierCosts = monthSupplierCosts.reduce((sum, c) => sum + c.amount, 0);
        const fixedCosts = monthOpCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
        const variableCosts = monthOpCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
        const grossProfit = revenue - supplierCosts;
        const netProfit = grossProfit - fixedCosts - variableCosts;
        
        return {
          name: month,
          revenue,
          supplierCosts,
          fixedCosts,
          variableCosts,
          grossProfit,
          netProfit,
          totalCosts: supplierCosts + fixedCosts + variableCosts,
        };
      });
    } else {
      // Weekly view - show last 12 weeks
      const weeks: { name: string; revenue: number; supplierCosts: number; fixedCosts: number; variableCosts: number; grossProfit: number; netProfit: number; totalCosts: number }[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekPayments = yearPayments.filter(p => {
          const d = new Date(p.date);
          return d >= weekStart && d <= weekEnd;
        });
        const weekSupplierCosts = yearSupplierCosts.filter(c => {
          const d = new Date(c.date);
          return d >= weekStart && d <= weekEnd;
        });
        const weekOpCosts = yearOperationalCosts.filter(c => {
          const d = new Date(c.date);
          return d >= weekStart && d <= weekEnd;
        });
        
        const revenue = weekPayments.reduce((sum, p) => sum + p.amount, 0);
        const supplierCosts = weekSupplierCosts.reduce((sum, c) => sum + c.amount, 0);
        const fixedCosts = weekOpCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
        const variableCosts = weekOpCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
        const grossProfit = revenue - supplierCosts;
        const netProfit = grossProfit - fixedCosts - variableCosts;
        
        weeks.push({
          name: `W${12 - i}`,
          revenue,
          supplierCosts,
          fixedCosts,
          variableCosts,
          grossProfit,
          netProfit,
          totalCosts: supplierCosts + fixedCosts + variableCosts,
        });
      }
      return weeks;
    }
  }, [yearPayments, yearSupplierCosts, yearOperationalCosts, timeScale]);

  // Quarterly aggregated data
  const quarterlyData = useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map((q, idx) => {
      const quarterMonths = [idx * 3, idx * 3 + 1, idx * 3 + 2];
      const quarterData = timeSeriesData.filter((_, i) => quarterMonths.includes(i));
      return {
        name: q,
        revenue: quarterData.reduce((sum, d) => sum + d.revenue, 0),
        supplierCosts: quarterData.reduce((sum, d) => sum + d.supplierCosts, 0),
        fixedCosts: quarterData.reduce((sum, d) => sum + d.fixedCosts, 0),
        variableCosts: quarterData.reduce((sum, d) => sum + d.variableCosts, 0),
        grossProfit: quarterData.reduce((sum, d) => sum + d.grossProfit, 0),
        netProfit: quarterData.reduce((sum, d) => sum + d.netProfit, 0),
        totalCosts: quarterData.reduce((sum, d) => sum + d.totalCosts, 0),
      };
    });
  }, [timeSeriesData]);

  // Totals for selected year
  const yearTotals = useMemo(() => {
    const revenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const supplierCosts = yearSupplierCosts.reduce((sum, c) => sum + c.amount, 0);
    const fixedCosts = yearOperationalCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
    const variableCosts = yearOperationalCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
    const grossProfit = revenue - supplierCosts;
    const operationalCosts = fixedCosts + variableCosts;
    const netProfit = grossProfit - operationalCosts;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    return {
      revenue,
      supplierCosts,
      fixedCosts,
      variableCosts,
      operationalCosts,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    };
  }, [yearPayments, yearSupplierCosts, yearOperationalCosts]);

  // Cost breakdown for pie chart
  const costBreakdown = useMemo(() => {
    return [
      { name: 'Supplier Costs', value: yearTotals.supplierCosts, color: '#ef4444' },
      { name: 'Fixed Costs', value: yearTotals.fixedCosts, color: '#6b7280' },
      { name: 'Variable Costs', value: yearTotals.variableCosts, color: '#f59e0b' },
    ].filter(c => c.value > 0);
  }, [yearTotals]);

  // Project performance ranking
  const projectRankings = useMemo(() => {
    return [...projectProfits]
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 10);
  }, [projectProfits]);

  // Month-over-month comparison
  const currentMonth = new Date().getMonth();
  const currentMonthData = timeSeriesData[currentMonth] || { revenue: 0, netProfit: 0 };
  const previousMonthData = timeSeriesData[currentMonth - 1] || { revenue: 0, netProfit: 0 };
  
  const revenueChange = previousMonthData.revenue > 0 
    ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100 
    : 0;
  const profitChange = previousMonthData.netProfit !== 0 
    ? ((currentMonthData.netProfit - previousMonthData.netProfit) / Math.abs(previousMonthData.netProfit)) * 100 
    : 0;

  // Get chart data based on time scale
  const chartData = timeScale === 'quarterly' ? quarterlyData : timeSeriesData;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontSize: '0.85rem', margin: '0.25rem 0' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Net Profit Analysis</h1>
          <p className="page-subtitle">Comprehensive business profitability insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto' }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div style={{ 
            display: 'flex', 
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            border: '1px solid var(--color-border)',
          }}>
            {(['weekly', 'monthly', 'quarterly'] as TimeScale[]).map(scale => (
              <button
                key={scale}
                onClick={() => setTimeScale(scale)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: timeScale === scale ? 'var(--color-text)' : 'transparent',
                  color: timeScale === scale ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Key Metrics - Large Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Revenue */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Wallet size={24} style={{ color: 'var(--color-success)' }} />
            </div>
            {revenueChange !== 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: revenueChange >= 0 ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
                color: revenueChange >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(yearTotals.revenue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            From {state.projects.length} projects
          </div>
        </div>
        
        {/* Gross Profit */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)',
            }}>
              <BarChart3 size={24} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div style={{ 
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {yearTotals.grossMargin.toFixed(1)}% margin
            </div>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Gross Profit
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(yearTotals.grossProfit)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            After supplier costs
          </div>
        </div>
        
        {/* Total Costs */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Receipt size={24} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Total Costs
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(yearTotals.supplierCosts + yearTotals.operationalCosts)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            <Link to="/costs" style={{ color: 'inherit', textDecoration: 'underline' }}>View breakdown →</Link>
          </div>
        </div>
        
        {/* Net Profit */}
        <div className="card" style={{ 
          padding: '1.5rem',
          background: yearTotals.netProfit >= 0 ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
          border: `1px solid ${yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)',
              background: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {yearTotals.netProfit >= 0 ? (
                <TrendingUp size={24} style={{ color: 'white' }} />
              ) : (
                <TrendingDown size={24} style={{ color: 'white' }} />
              )}
            </div>
            <div style={{ 
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.2)',
              color: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {yearTotals.netMargin.toFixed(1)}% margin
            </div>
          </div>
          <div style={{ color: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', opacity: 0.8 }}>
            Net Profit
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {formatCurrency(yearTotals.netProfit)}
          </div>
          <div style={{ fontSize: '0.8rem', color: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)', marginTop: '0.5rem', opacity: 0.8 }}>
            {yearTotals.netProfit >= 0 ? 'Profitable' : 'Operating at loss'}
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue & Profit Trend Chart */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} style={{ opacity: 0.7 }} />
              Revenue & Profit Trend
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {timeScale.charAt(0).toUpperCase() + timeScale.slice(1)} view • {selectedYear}
            </div>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '1rem' }}
                  formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                />
                <Bar dataKey="revenue" name="Revenue" fill="var(--color-success)" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="totalCosts" name="Total Costs" fill="var(--color-error)" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="var(--color-text)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-text)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Cost Breakdown Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChartIcon size={18} style={{ opacity: 0.7 }} />
              Cost Breakdown
            </h3>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            {costBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {costBreakdown.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                No costs recorded
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Profit Margins Chart */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ opacity: 0.7 }} />
            Profit Margins Over Time
          </h3>
        </div>
        <div className="card-body" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-text)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-text)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
              />
              <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="var(--color-success)" fill="url(#grossGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="var(--color-text)" fill="url(#netGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Bottom Section - Project Rankings & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Project Profit Rankings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PoundSterling size={18} style={{ opacity: 0.7 }} />
              Top Performing Projects
            </h3>
          </div>
          {projectRankings.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Project</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {projectRankings.map((project, idx) => (
                    <tr key={project.id}>
                      <td style={{ 
                        fontWeight: 600, 
                        color: idx < 3 ? 'var(--color-success)' : 'var(--color-text-muted)',
                        fontSize: '0.9rem'
                      }}>
                        {idx + 1}
                      </td>
                      <td>
                        <Link to={`/projects/${project.id}`} style={{ color: 'var(--color-text)', fontWeight: 500, textDecoration: 'none' }}>
                          {project.code}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{project.clientName}</div>
                      </td>
                      <td style={{ color: 'var(--color-success)' }}>{formatCurrency(project.totalInflows)}</td>
                      <td style={{ fontWeight: 500, color: project.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {formatCurrency(project.grossProfit)}
                      </td>
                      <td>
                        <div style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: project.profitMargin >= 30 ? 'var(--color-success-dim)' : project.profitMargin >= 15 ? 'var(--color-warning-dim)' : 'var(--color-error-dim)',
                          color: project.profitMargin >= 30 ? 'var(--color-success)' : project.profitMargin >= 15 ? 'var(--color-warning)' : 'var(--color-error)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}>
                          {project.profitMargin.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              No projects yet. <Link to="/projects" style={{ color: 'var(--color-text)' }}>Add your first project</Link>
            </div>
          )}
        </div>
        
        {/* Profit Flow Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} style={{ opacity: 0.7 }} />
              {selectedYear} Profit Flow
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Revenue */}
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-success-dim)', 
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--color-success)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>Total Revenue</span>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-success)' }}>{formatCurrency(yearTotals.revenue)}</span>
                </div>
              </div>
              
              {/* Deductions */}
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>− Supplier Costs</span>
                  <span style={{ color: 'var(--color-error)' }}>{formatCurrency(yearTotals.supplierCosts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>− Fixed Costs</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(yearTotals.fixedCosts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>− Variable Costs</span>
                  <span style={{ color: 'var(--color-warning)' }}>{formatCurrency(yearTotals.variableCosts)}</span>
                </div>
              </div>
              
              {/* Net Profit */}
              <div style={{ 
                padding: '1.25rem', 
                background: yearTotals.netProfit >= 0 ? 'var(--color-success-dim)' : 'var(--color-error-dim)', 
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'}`,
                marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Net Profit</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {yearTotals.netMargin.toFixed(1)}% of revenue
                    </div>
                  </div>
                  <span style={{ 
                    fontWeight: 300, 
                    fontSize: '1.75rem', 
                    color: yearTotals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                  }}>
                    {formatCurrency(yearTotals.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetProfit;
