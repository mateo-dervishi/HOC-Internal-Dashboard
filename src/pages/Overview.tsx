import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  FolderKanban, 
  PoundSterling, 
  ArrowRight,
  Wallet,
  Receipt,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  Calendar
} from 'lucide-react';
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
  Legend
} from 'recharts';

const Overview = () => {
  const { state, loading } = useDashboard();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate all project financials
  const projectFinancials = useMemo(() => {
    return state.projects.map(p => ({
      ...p,
      financials: calculateProjectFinancials(p),
    }));
  }, [state.projects]);
  
  // All-time totals
  const totals = useMemo(() => {
    const totalGross = projectFinancials.reduce((sum, p) => sum + p.financials.totalGross, 0);
    const totalInflows = projectFinancials.reduce((sum, p) => sum + p.financials.totalInflows, 0);
    const totalSupplierCosts = projectFinancials.reduce((sum, p) => sum + p.financials.totalSupplierCosts, 0);
    const fixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
    const variableCosts = state.operationalCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
    const operationalCosts = fixedCosts + variableCosts;
    const grossProfit = totalInflows - totalSupplierCosts;
    const netProfit = grossProfit - operationalCosts;
    const outstanding = Math.max(0, totalGross - totalInflows);
    const collectionRate = totalGross > 0 ? (totalInflows / totalGross) * 100 : 0;
    
    return {
      totalGross,
      totalInflows,
      totalSupplierCosts,
      fixedCosts,
      variableCosts,
      operationalCosts,
      grossProfit,
      netProfit,
      outstanding,
      collectionRate,
    };
  }, [projectFinancials, state.operationalCosts]);
  
  // Current year data
  const yearData = useMemo(() => {
    const yearPayments: number[] = Array(12).fill(0);
    const yearCosts: number[] = Array(12).fill(0);
    
    state.projects.forEach(p => {
      p.payments.forEach(pay => {
        const payDate = new Date(pay.date);
        if (payDate.getFullYear() === currentYear) {
          const vatAmount = pay.amount * (pay.vatRate || 0);
          yearPayments[payDate.getMonth()] += pay.amount + vatAmount;
        }
      });
      p.supplierCosts.forEach(c => {
        const costDate = new Date(c.date);
        if (costDate.getFullYear() === currentYear) {
          yearCosts[costDate.getMonth()] += c.amount;
        }
      });
    });
    
    state.operationalCosts.forEach(c => {
      const costDate = new Date(c.date);
      if (costDate.getFullYear() === currentYear) {
        yearCosts[costDate.getMonth()] += c.amount;
      }
    });
    
    return { yearPayments, yearCosts };
  }, [state.projects, state.operationalCosts, currentYear]);
  
  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, idx) => ({
      name: month,
      revenue: yearData.yearPayments[idx],
      costs: yearData.yearCosts[idx],
      profit: yearData.yearPayments[idx] - yearData.yearCosts[idx],
    }));
  }, [yearData]);
  
  // This month vs last month comparison
  const monthComparison = useMemo(() => {
    const thisMonthRevenue = yearData.yearPayments[currentMonth] || 0;
    const lastMonthRevenue = yearData.yearPayments[currentMonth - 1] || 0;
    const thisMonthCosts = yearData.yearCosts[currentMonth] || 0;
    const lastMonthCosts = yearData.yearCosts[currentMonth - 1] || 0;
    
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    const costsChange = lastMonthCosts > 0 
      ? ((thisMonthCosts - lastMonthCosts) / lastMonthCosts) * 100 
      : 0;
    
    return {
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthCosts,
      lastMonthCosts,
      revenueChange,
      costsChange,
    };
  }, [yearData, currentMonth]);
  
  // Project status breakdown
  const projectStatus = useMemo(() => {
    const active = state.projects.filter(p => p.status === 'active').length;
    const completed = state.projects.filter(p => p.status === 'completed').length;
    const onHold = state.projects.filter(p => p.status === 'on_hold').length;
    
    return [
      { name: 'Active', value: active, color: '#6EBF8B' },
      { name: 'Completed', value: completed, color: '#707070' },
      { name: 'On Hold', value: onHold, color: '#FBBF24' },
    ].filter(s => s.value > 0);
  }, [state.projects]);
  
  // Cost breakdown for mini chart
  const costBreakdown = useMemo(() => {
    return [
      { name: 'Supplier', value: totals.totalSupplierCosts, color: '#ef4444' },
      { name: 'Fixed', value: totals.fixedCosts, color: '#6b7280' },
      { name: 'Variable', value: totals.variableCosts, color: '#f59e0b' },
    ].filter(c => c.value > 0);
  }, [totals]);
  
  // Top performing projects
  const topProjects = useMemo(() => {
    return [...projectFinancials]
      .sort((a, b) => b.financials.grossProfit - a.financials.grossProfit)
      .slice(0, 5);
  }, [projectFinancials]);
  
  // Recent payments
  const recentPayments = useMemo(() => {
    const payments: { date: string; amount: number; projectCode: string; type: string }[] = [];
    state.projects.forEach(p => {
      p.payments.forEach(pay => {
        const vatAmount = pay.amount * (pay.vatRate || 0);
        payments.push({
          date: pay.date,
          amount: pay.amount + vatAmount,
          projectCode: p.code,
          type: pay.type === 'account' ? 'Account' : 'Fee',
        });
      });
    });
    return payments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [state.projects]);
  
  // Custom tooltip
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div className="spinning" style={{ 
            width: '32px', 
            height: '32px', 
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-text)',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-subtitle">House of Clarence Financial Summary</p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
          }}>
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>
      
      {/* Key Metrics - Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <Wallet size={20} style={{ color: 'var(--color-success)', opacity: 0.8 }} />
            {monthComparison.revenueChange !== 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.125rem',
                padding: '0.125rem 0.375rem',
                borderRadius: 'var(--radius-sm)',
                background: monthComparison.revenueChange >= 0 ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
                color: monthComparison.revenueChange >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}>
                {monthComparison.revenueChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(monthComparison.revenueChange).toFixed(0)}%
              </div>
            )}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totals.totalInflows)}
          </div>
        </div>
        
        {/* Gross Profit */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Target size={20} style={{ color: 'var(--color-text-muted)', opacity: 0.8 }} />
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
            Gross Profit
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totals.grossProfit)}
          </div>
        </div>
        
        {/* Total Costs */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Receipt size={20} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
            Total Costs
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totals.totalSupplierCosts + totals.operationalCosts)}
          </div>
        </div>
        
        {/* Outstanding */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Clock size={20} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
            Outstanding
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-warning)' }}>
            {formatCurrency(totals.outstanding)}
          </div>
        </div>
        
        {/* Net Profit */}
        <div className="card" style={{ 
          padding: '1.25rem',
          background: totals.netProfit >= 0 ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
          border: `1px solid ${totals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'}`,
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            {totals.netProfit >= 0 ? (
              <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
            ) : (
              <TrendingDown size={20} style={{ color: 'var(--color-error)' }} />
            )}
          </div>
          <div style={{ color: totals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem', opacity: 0.8 }}>
            Net Profit
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: totals.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {formatCurrency(totals.netProfit)}
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue Trend Chart */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ opacity: 0.7 }} />
              {currentYear} Revenue & Costs
            </h3>
            <Link to="/profit" className="btn btn-ghost btn-sm">
              View Details <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6EBF8B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6EBF8B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                  wrapperStyle={{ paddingTop: '0.5rem' }}
                  formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6EBF8B" fill="url(#revenueGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" name="Costs" stroke="#ef4444" fill="url(#costsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Project Status + Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Project Status */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderKanban size={18} style={{ opacity: 0.7 }} />
                Projects
              </h3>
            </div>
            <div className="card-body" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {projectStatus.length > 0 ? (
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie
                        data={projectStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {projectStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    No projects
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={14} style={{ color: '#6EBF8B' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Active</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{state.projects.filter(p => p.status === 'active').length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={14} style={{ color: '#707070' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Completed</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{state.projects.filter(p => p.status === 'completed').length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PauseCircle size={14} style={{ color: '#FBBF24' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>On Hold</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{state.projects.filter(p => p.status === 'on_hold').length}</span>
                  </div>
                </div>
              </div>
              <Link to="/projects" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                View All Projects <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          
          {/* Collection Rate */}
          <div className="card">
            <div className="card-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collection Rate</span>
                <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>{totals.collectionRate.toFixed(0)}%</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${Math.min(totals.collectionRate, 100)}%`, background: totals.collectionRate >= 80 ? 'var(--color-success)' : totals.collectionRate >= 50 ? 'var(--color-warning)' : 'var(--color-error)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>Received: {formatCurrency(totals.totalInflows)}</span>
                <span>Total: {formatCurrency(totals.totalGross)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        {/* Top Performing Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PoundSterling size={18} style={{ opacity: 0.7 }} />
              Top Projects
            </h3>
          </div>
          {topProjects.length > 0 ? (
            <div style={{ padding: '0' }}>
              {topProjects.map((project, idx) => (
                <Link 
                  key={project.id}
                  to={`/projects/${project.id}`}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: idx < topProjects.length - 1 ? '1px solid var(--color-border)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.125rem' }}>{project.code}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{project.clientName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 500, color: project.financials.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {formatCurrency(project.financials.grossProfit)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {project.financials.profitMargin.toFixed(0)}% margin
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              No projects yet
            </div>
          )}
        </div>
        
        {/* Cost Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} style={{ opacity: 0.7 }} />
              Cost Breakdown
            </h3>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            {costBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={costBreakdown} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {costBreakdown.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                No costs recorded
              </div>
            )}
            <Link to="/costs" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
              Manage Costs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ opacity: 0.7 }} />
              Recent Payments
            </h3>
          </div>
          {recentPayments.length > 0 ? (
            <div style={{ padding: '0' }}>
              {recentPayments.map((payment, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: idx < recentPayments.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.125rem' }}>{payment.projectCode}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {new Date(payment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {payment.type}
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                    +{formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              No payments yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
