import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Building2, Users, TrendingDown, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { OperationalCost, CostType } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const OperationalCosts = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [newCost, setNewCost] = useState({
    amount: '',
    category: '',
    costType: 'fixed' as CostType,
    date: new Date().toISOString().split('T')[0],
    description: '',
    isRecurring: false,
  });
  
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
  
  // Get existing categories from previously added costs
  const existingFixedCategories = [...new Set(
    state.operationalCosts.filter(c => c.costType === 'fixed').map(c => c.category)
  )].sort();
  const existingVariableCategories = [...new Set(
    state.operationalCosts.filter(c => c.costType === 'variable').map(c => c.category)
  )].sort();
  
  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set(state.operationalCosts.map(c => new Date(c.date).getFullYear()));
    return Array.from(years).sort();
  }, [state.operationalCosts]);
  
  // Filter costs by selected year
  const yearCosts = useMemo(() => {
    return state.operationalCosts.filter(c => new Date(c.date).getFullYear() === selectedYear);
  }, [state.operationalCosts, selectedYear]);
  
  // Group costs by month
  const costsByMonth = useMemo(() => {
    const grouped: Record<string, OperationalCost[]> = {};
    
    yearCosts.forEach(cost => {
      const date = new Date(cost.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(cost);
    });
    
    // Sort each month's costs by date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return grouped;
  }, [yearCosts]);
  
  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
      const monthCosts = costsByMonth[monthKey] || [];
      
      const fixed = monthCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
      const variable = monthCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
      
      return {
        month,
        fixed,
        variable,
        total: fixed + variable,
      };
    });
  }, [costsByMonth, selectedYear]);
  
  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    yearCosts.forEach(cost => {
      if (!breakdown[cost.category]) {
        breakdown[cost.category] = 0;
      }
      breakdown[cost.category] += cost.amount;
    });
    
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearCosts]);
  
  // Totals
  const totalFixed = yearCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
  const totalVariable = yearCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
  const totalYear = totalFixed + totalVariable;
  
  // Color palette for pie chart
  const COLORS = ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc'];
  
  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const cost: OperationalCost = {
      id: editingCost?.id || crypto.randomUUID(),
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      category: newCost.category,
      costType: newCost.costType,
      description: newCost.description,
      isRecurring: newCost.isRecurring,
    };
    
    if (editingCost) {
      dispatch({ type: 'UPDATE_OPERATIONAL_COST', payload: cost });
    } else {
      dispatch({ type: 'ADD_OPERATIONAL_COST', payload: cost });
    }
    
    setShowModal(false);
    setEditingCost(null);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setNewCost({
      amount: '',
      category: '',
      costType: 'fixed',
      date: new Date().toISOString().split('T')[0],
      description: '',
      isRecurring: false,
    });
  };
  
  const handleEdit = (cost: OperationalCost) => {
    setEditingCost(cost);
    setNewCost({
      amount: cost.amount.toString(),
      category: cost.category,
      costType: cost.costType,
      date: cost.date,
      description: cost.description || '',
      isRecurring: cost.isRecurring || false,
    });
    setShowModal(true);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      dispatch({ type: 'DELETE_OPERATIONAL_COST', payload: id });
    }
  };
  
  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  
  const getMonthTotal = (costs: OperationalCost[]) => {
    return costs.reduce((sum, c) => sum + c.amount, 0);
  };

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Operational Costs</h1>
          <p className="page-subtitle">Track and manage business expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Cost
        </button>
      </header>
      
      {/* Year Selector */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>Year:</span>
        {availableYears.map(year => (
          <button
            key={year}
            className={`btn ${selectedYear === year ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedYear(year)}
            style={{ padding: '0.5rem 1rem' }}
          >
            {year}
          </button>
        ))}
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--color-black)', color: 'var(--color-white)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '0.5rem' }}>
              Total {selectedYear}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 300 }}>
              {formatCurrency(totalYear)}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Building2 size={14} /> Fixed Costs
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 300 }}>
              {formatCurrency(totalFixed)}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Users size={14} /> Variable Costs
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 300 }}>
              {formatCurrency(totalVariable)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Monthly Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingDown size={18} style={{ marginRight: '0.5rem', opacity: 0.7 }} />
              Monthly Expenses
            </h3>
          </div>
          <div className="card-body" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="fixed" name="Fixed" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="variable" name="Variable" fill="#666666" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Category Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">By Category</h3>
          </div>
          <div className="card-body" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryBreakdown.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.75rem', maxHeight: '100px', overflowY: 'auto' }}>
              {categoryBreakdown.slice(0, 6).map((cat, i) => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cumulative Area Chart */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Cumulative Expenses</h3>
        </div>
        <div className="card-body" style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={monthlyChartData.map((d, i, arr) => ({
                ...d,
                cumulative: arr.slice(0, i + 1).reduce((sum, m) => sum + m.total, 0)
              }))}
              margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrencyFull(value)}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                name="Cumulative Total"
                stroke="#1a1a1a" 
                fill="#1a1a1a" 
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Monthly Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Monthly Breakdown</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {Object.keys(costsByMonth)
            .sort((a, b) => a.localeCompare(b))
            .map(monthKey => {
              const costs = costsByMonth[monthKey];
              const isExpanded = expandedMonths.has(monthKey);
              const monthTotal = getMonthTotal(costs);
              const fixedTotal = costs.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
              const variableTotal = costs.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
              
              return (
                <div key={monthKey} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div 
                    onClick={() => toggleMonth(monthKey)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '1rem 1.5rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      background: isExpanded ? 'var(--color-light-gray)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-light-gray)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'var(--color-light-gray)' : 'transparent'}
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ flex: 1, marginLeft: '0.75rem', fontWeight: 500 }}>
                      {getMonthName(monthKey)}
                    </span>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <Building2 size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {formatCurrency(fixedTotal)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <Users size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {formatCurrency(variableTotal)}
                      </span>
                      <span style={{ fontWeight: 600, minWidth: '100px', textAlign: 'right' }}>
                        {formatCurrency(monthTotal)}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ background: 'var(--color-off-white)', padding: '0.5rem 1.5rem 1rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Date</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Category</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Description</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Type</th>
                            <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Amount</th>
                            <th style={{ width: '80px', padding: '0.75rem 0.5rem' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {costs.map(cost => (
                            <tr key={cost.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {new Date(cost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{cost.category}</td>
                              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                {cost.description || '-'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px',
                                  background: cost.costType === 'fixed' ? 'var(--color-black)' : 'var(--color-gray-medium)',
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {cost.costType}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 500 }}>
                                {formatCurrencyFull(cost.amount)}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                  <button 
                                    className="btn btn-icon" 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(cost); }}
                                    style={{ padding: '0.35rem' }}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    className="btn btn-icon" 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(cost.id); }}
                                    style={{ padding: '0.35rem', color: 'var(--color-error)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          
          {Object.keys(costsByMonth).length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No operational costs for {selectedYear}. Click "Add Cost" to get started.
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 300 }}>
                {editingCost ? 'Edit Cost' : 'Add Operational Cost'}
              </h2>
              <button 
                className="btn btn-icon" 
                onClick={() => {
                  setShowModal(false);
                  setEditingCost(null);
                  setIsCreatingNewCategory(false);
                  setNewCategoryName('');
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCost} style={{ padding: '1.5rem' }}>
              {/* Cost Type */}
              <div className="form-group">
                <label className="form-label">Cost Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '1rem',
                    border: `2px solid ${newCost.costType === 'fixed' ? 'var(--color-black)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}>
                    <input
                      type="radio"
                      name="costType"
                      value="fixed"
                      checked={newCost.costType === 'fixed'}
                      onChange={() => {
                        setNewCost({ ...newCost, costType: 'fixed', category: '' });
                        setIsCreatingNewCategory(false);
                        setNewCategoryName('');
                      }}
                    />
                    <Building2 size={18} />
                    <span>Fixed</span>
                  </label>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '1rem',
                    border: `2px solid ${newCost.costType === 'variable' ? 'var(--color-black)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}>
                    <input
                      type="radio"
                      name="costType"
                      value="variable"
                      checked={newCost.costType === 'variable'}
                      onChange={() => {
                        setNewCost({ ...newCost, costType: 'variable', category: '' });
                        setIsCreatingNewCategory(false);
                        setNewCategoryName('');
                      }}
                    />
                    <Users size={18} />
                    <span>Variable</span>
                  </label>
                </div>
              </div>
              
              {/* Amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newCost.amount}
                    onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newCost.date}
                    onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                {isCreatingNewCategory ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name..."
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          setNewCost({ ...newCost, category: newCategoryName.trim() });
                          setIsCreatingNewCategory(false);
                        }
                      }}
                    >
                      Add
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-ghost"
                      onClick={() => {
                        setIsCreatingNewCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-select"
                      value={newCost.category}
                      onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">Select a category...</option>
                      {(newCost.costType === 'fixed' ? existingFixedCategories : existingVariableCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setIsCreatingNewCategory(true)}
                      title="Create new category"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  placeholder="e.g., January warehouse rent payment"
                />
              </div>
              
              {/* Recurring checkbox */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newCost.isRecurring}
                    onChange={(e) => setNewCost({ ...newCost, isRecurring: e.target.checked })}
                  />
                  <span>Recurring expense</span>
                </label>
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingCost ? 'Update Cost' : 'Add Cost'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCost(null);
                    setIsCreatingNewCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalCosts;
