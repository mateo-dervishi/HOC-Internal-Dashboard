import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Building2, Users, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { OperationalCost, CostType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const OperationalCosts = () => {
  const { state, addOperationalCost, updateOperationalCost, deleteOperationalCost } = useDashboard();
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
  
  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { amount: number; type: CostType }> = {};
    
    yearCosts.forEach(cost => {
      if (!breakdown[cost.category]) {
        breakdown[cost.category] = { amount: 0, type: cost.costType };
      }
      breakdown[cost.category].amount += cost.amount;
    });
    
    return Object.entries(breakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearCosts]);
  
  // Totals
  const totalFixed = yearCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
  const totalVariable = yearCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
  const totalYear = totalFixed + totalVariable;
  
  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };
  
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const costData = {
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      category: newCost.category,
      costType: newCost.costType,
      description: newCost.description,
      isRecurring: newCost.isRecurring,
    };
    
    if (editingCost) {
      await updateOperationalCost({ ...costData, id: editingCost.id });
    } else {
      await addOperationalCost(costData);
    }
    
    setSaving(false);
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
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      await deleteOperationalCost(id);
    }
  };
  
  const getMonthName = (monthKey: string) => {
    const [, month] = monthKey.split('-');
    const date = new Date(2024, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };
  
  const getMonthTotal = (costs: OperationalCost[]) => {
    return costs.reduce((sum, c) => sum + c.amount, 0);
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 300, 
            letterSpacing: '-0.01em',
            marginBottom: '0.25rem',
            color: 'var(--color-text)'
          }}>
            Operational Costs
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {selectedYear} Overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Year Tabs */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--color-bg-card)', 
            borderRadius: '6px',
            padding: '3px',
            border: '1px solid var(--color-border)'
          }}>
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                style={{ 
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: selectedYear === year ? 500 : 400,
                  background: selectedYear === year ? 'var(--color-bg-hover)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: selectedYear === year ? 'var(--color-text)' : 'var(--color-text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {year}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Cost
          </button>
        </div>
      </header>
      
      {/* Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          background: 'var(--color-bg-card)', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '6px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Total Expenses
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totalYear)}
          </div>
        </div>
        <div style={{ 
          background: 'var(--color-bg-card)', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '6px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={12} /> Fixed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totalFixed)}
          </div>
        </div>
        <div style={{ 
          background: 'var(--color-bg-card)', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '6px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={12} /> Variable
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
            {formatCurrency(totalVariable)}
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
        
        {/* Left Column - Chart + Monthly List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Monthly Chart */}
          <div className="card">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 500, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Expenses</h3>
            </div>
            <div style={{ padding: '1.25rem', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#707070' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#707070' }} 
                    tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrencyFull(value), name === 'fixed' ? 'Fixed' : 'Variable']}
                    contentStyle={{ 
                      background: '#1A1A1A', 
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#999' }}
                  />
                  <Bar dataKey="fixed" stackId="a" fill="#ffffff" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="variable" stackId="a" fill="#555555" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ 
              padding: '0.75rem 1.25rem', 
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.75rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: 10, height: 10, background: '#ffffff', borderRadius: 2 }} />
                Fixed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: 10, height: 10, background: '#555555', borderRadius: 2 }} />
                Variable
              </span>
            </div>
          </div>
          
          {/* Monthly Breakdown */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 500, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Breakdown</h3>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
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
                          padding: '0.875rem 1.25rem',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          background: isExpanded ? 'var(--color-bg-hover)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
                        <span style={{ flex: 1, marginLeft: '0.625rem', fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                          {getMonthName(monthKey)}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--color-text-muted)', minWidth: '60px', textAlign: 'right' }}>
                            {formatCurrency(fixedTotal)}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', minWidth: '60px', textAlign: 'right' }}>
                            {formatCurrency(variableTotal)}
                          </span>
                          <span style={{ fontWeight: 500, minWidth: '80px', textAlign: 'right', color: 'var(--color-text)' }}>
                            {formatCurrency(monthTotal)}
                          </span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ background: 'var(--color-bg-elevated)' }}>
                          {costs.map(cost => (
                            <div 
                              key={cost.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '0.625rem 1.25rem 0.625rem 2.5rem',
                                borderTop: '1px solid var(--color-border-light)',
                                fontSize: '0.8rem'
                              }}
                            >
                              <span style={{ 
                                width: 5, 
                                height: 5, 
                                borderRadius: '50%', 
                                background: cost.costType === 'fixed' ? '#ffffff' : '#555',
                                marginRight: '0.625rem',
                                flexShrink: 0
                              }} />
                              <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>
                                {cost.category}
                                {cost.description && (
                                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                                    — {cost.description}
                                  </span>
                                )}
                              </span>
                              <span style={{ fontWeight: 500, marginRight: '0.75rem', color: 'var(--color-text)' }}>
                                {formatCurrencyFull(cost.amount)}
                              </span>
                              <div style={{ display: 'flex', gap: '0.125rem' }}>
                                <button 
                                  className="btn btn-icon" 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(cost); }}
                                  style={{ padding: '0.25rem' }}
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button 
                                  className="btn btn-icon" 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(cost.id); }}
                                  style={{ padding: '0.25rem' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {Object.keys(costsByMonth).length === 0 && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  No expenses for {selectedYear}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Category Breakdown */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 500, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>By Category</h3>
          </div>
          <div style={{ padding: '0.25rem 0' }}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                No data
              </div>
            ) : (
              categoryBreakdown.map((cat, index) => (
                <div 
                  key={cat.name}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '0.625rem 1.25rem',
                    borderBottom: index < categoryBreakdown.length - 1 ? '1px solid var(--color-border-light)' : 'none'
                  }}
                >
                  <span style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: cat.type === 'fixed' ? '#ffffff' : '#555',
                    marginRight: '0.625rem',
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    flex: 1, 
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {cat.name}
                  </span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 500,
                    marginLeft: '0.5rem',
                    color: 'var(--color-text)'
                  }}>
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {/* Summary at bottom */}
          {categoryBreakdown.length > 0 && (
            <div style={{ 
              padding: '0.875rem 1.25rem', 
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Fixed ({categoryBreakdown.filter(c => c.type === 'fixed').length})</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(totalFixed)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Variable ({categoryBreakdown.filter(c => c.type === 'variable').length})</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(totalVariable)}</span>
              </div>
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
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)' }}>
                {editingCost ? 'Edit Cost' : 'Add Cost'}
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
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddCost} style={{ padding: '1.5rem' }}>
              {/* Cost Type */}
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: `1px solid ${newCost.costType === 'fixed' ? 'var(--color-text)' : 'var(--color-border)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: newCost.costType === 'fixed' ? 'var(--color-text)' : 'transparent',
                    color: newCost.costType === 'fixed' ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontSize: '0.85rem'
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
                      style={{ display: 'none' }}
                    />
                    <Building2 size={15} />
                    Fixed
                  </label>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: `1px solid ${newCost.costType === 'variable' ? 'var(--color-text)' : 'var(--color-border)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: newCost.costType === 'variable' ? 'var(--color-text)' : 'transparent',
                    color: newCost.costType === 'variable' ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontSize: '0.85rem'
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
                      style={{ display: 'none' }}
                    />
                    <Users size={15} />
                    Variable
                  </label>
                </div>
              </div>
              
              {/* Amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                      placeholder="Category name..."
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary"
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
                      <option value="">Select category...</option>
                      {(newCost.costType === 'fixed' ? existingFixedCategories : existingVariableCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setIsCreatingNewCategory(true)}
                      title="New category"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  placeholder="e.g., January rent"
                />
              </div>
              
              {/* Recurring */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={newCost.isRecurring}
                    onChange={(e) => setNewCost({ ...newCost, isRecurring: e.target.checked })}
                  />
                  Recurring expense
                </label>
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingCost ? 'Update' : 'Add Cost'}
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
