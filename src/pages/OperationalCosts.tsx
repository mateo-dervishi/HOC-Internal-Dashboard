import { useState } from 'react';
import { Plus, Trash2, Edit3, Building2, Users, TrendingUp, Filter, PlusCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { OperationalCost, CostType } from '../types';

const OperationalCosts = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [costTypeFilter, setCostTypeFilter] = useState<'all' | CostType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  
  const [newCost, setNewCost] = useState({
    amount: '',
    category: '',
    costType: 'fixed' as CostType,
    date: new Date().toISOString().split('T')[0],
    description: '',
    isRecurring: false,
  });
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Get existing categories from previously added costs
  const existingFixedCategories = [...new Set(
    state.operationalCosts.filter(c => c.costType === 'fixed').map(c => c.category)
  )].sort();
  const existingVariableCategories = [...new Set(
    state.operationalCosts.filter(c => c.costType === 'variable').map(c => c.category)
  )].sort();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Filter costs by date
  const filterByDate = (costs: OperationalCost[]) => {
    if (dateFilter === 'all') return costs;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    return costs.filter(cost => {
      const costDate = new Date(cost.date);
      switch (dateFilter) {
        case 'month': return costDate >= startOfMonth;
        case 'quarter': return costDate >= startOfQuarter;
        case 'year': return costDate >= startOfYear;
        default: return true;
      }
    });
  };
  
  // Get all unique categories
  const allCategories = [...new Set(state.operationalCosts.map(c => c.category))];
  
  // Filter costs
  const filteredCosts = filterByDate(state.operationalCosts).filter(cost => {
    const matchesType = costTypeFilter === 'all' || cost.costType === costTypeFilter;
    const matchesCategory = categoryFilter === 'all' || cost.category === categoryFilter;
    return matchesType && matchesCategory;
  });
  
  // Totals
  const fixedCosts = filterByDate(state.operationalCosts).filter(c => c.costType === 'fixed');
  const variableCosts = filterByDate(state.operationalCosts).filter(c => c.costType === 'variable');
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalVariableCosts = variableCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalOperationalCosts = totalFixedCosts + totalVariableCosts;
  
  // Group by category
  const costsByCategory = (costs: OperationalCost[]) => {
    return costs.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const fixedByCategory = costsByCategory(fixedCosts);
  const variableByCategory = costsByCategory(variableCosts);
  
  // Monthly trend (last 6 months)
  const getMonthlyTrend = () => {
    const months: { month: string; fixed: number; variable: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      
      const monthCosts = state.operationalCosts.filter(c => {
        const costDate = new Date(c.date);
        return costDate >= monthStart && costDate <= monthEnd;
      });
      
      months.push({
        month: monthName,
        fixed: monthCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0),
        variable: monthCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0),
      });
    }
    
    return months;
  };
  
  const monthlyTrend = getMonthlyTrend();
  const maxMonthlyTotal = Math.max(...monthlyTrend.map(m => m.fixed + m.variable), 1);
  
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
  
  const handleEditCost = (cost: OperationalCost) => {
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
  
  const handleDeleteCost = (costId: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      dispatch({ type: 'DELETE_OPERATIONAL_COST', payload: costId });
    }
  };

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Operational Costs</h1>
          <p className="page-subtitle">Track and manage business expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingCost(null);
          setNewCost({
            amount: '',
            category: '',
            costType: 'fixed',
            date: new Date().toISOString().split('T')[0],
            description: '',
            isRecurring: false,
          });
          setShowModal(true);
        }}>
          <Plus size={18} /> Add Cost
        </button>
      </header>
      
      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Costs</div>
          <div className="stat-value">{formatCurrency(totalOperationalCosts)}</div>
          <div className="stat-change">
            {dateFilter === 'all' ? 'All time' : dateFilter === 'month' ? 'This month' : dateFilter === 'quarter' ? 'This quarter' : 'This year'}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Fixed Costs</div>
          <div className="stat-value">{formatCurrency(totalFixedCosts)}</div>
          <div className="stat-change">
            <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
            {fixedCosts.length} entries
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-label">Variable Costs</div>
          <div className="stat-value">{formatCurrency(totalVariableCosts)}</div>
          <div className="stat-change">
            <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
            {variableCosts.length} entries
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Monthly Average</div>
          <div className="stat-value">
            {formatCurrency(monthlyTrend.reduce((sum, m) => sum + m.fixed + m.variable, 0) / 6)}
          </div>
          <div className="stat-change">
            Last 6 months
          </div>
        </div>
      </div>
      
      {/* Monthly Trend Chart */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={20} style={{ marginRight: 8, opacity: 0.7 }} />
            Monthly Trend
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', height: '200px', alignItems: 'flex-end' }}>
            {monthlyTrend.map((month, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '160px',
                  justifyContent: 'flex-end'
                }}>
                  {month.variable > 0 && (
                    <div style={{ 
                      height: `${(month.variable / maxMonthlyTotal) * 160}px`,
                      background: 'var(--color-warning)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      minHeight: '4px'
                    }} title={`Variable: ${formatCurrency(month.variable)}`} />
                  )}
                  {month.fixed > 0 && (
                    <div style={{ 
                      height: `${(month.fixed / maxMonthlyTotal) * 160}px`,
                      background: 'var(--color-text-muted)',
                      borderRadius: month.variable > 0 ? '0' : 'var(--radius-sm) var(--radius-sm) 0 0',
                      minHeight: '4px'
                    }} title={`Fixed: ${formatCurrency(month.fixed)}`} />
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {month.month}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--color-text-muted)', borderRadius: '2px' }} />
              Fixed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--color-warning)', borderRadius: '2px' }} />
              Variable
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Fixed Costs Breakdown */}
        <div className="card">
          <div className="card-header" style={{ background: 'var(--color-light-gray)' }}>
            <h3 className="card-title">
              <Building2 size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Fixed Costs by Category
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{formatCurrency(totalFixedCosts)}</span>
          </div>
          <div className="card-body">
            {Object.keys(fixedByCategory).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(fixedByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const percentage = (amount / totalFixedCosts) * 100;
                    return (
                      <div key={category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>{category}</span>
                          <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
                        </div>
                        <div className="progress-bar" style={{ height: '6px' }}>
                          <div className="progress-fill" style={{ width: `${percentage}%`, background: 'var(--color-text-muted)' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No fixed costs recorded
              </p>
            )}
          </div>
        </div>
        
        {/* Variable Costs Breakdown */}
        <div className="card">
          <div className="card-header" style={{ background: 'var(--color-light-gray)' }}>
            <h3 className="card-title">
              <Users size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Variable Costs by Category
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{formatCurrency(totalVariableCosts)}</span>
          </div>
          <div className="card-body">
            {Object.keys(variableByCategory).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(variableByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const percentage = (amount / totalVariableCosts) * 100;
                    return (
                      <div key={category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>{category}</span>
                          <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
                        </div>
                        <div className="progress-bar" style={{ height: '6px' }}>
                          <div className="progress-fill" style={{ width: `${percentage}%`, background: 'var(--color-warning)' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No variable costs recorded
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Costs Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Costs</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
            <select
              className="form-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <select
              className="form-select"
              value={costTypeFilter}
              onChange={(e) => setCostTypeFilter(e.target.value as typeof costTypeFilter)}
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            >
              <option value="all">All Types</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            >
              <option value="all">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        {filteredCosts.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCosts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(cost => (
                    <tr key={cost.id}>
                      <td>{formatDate(cost.date)}</td>
                      <td style={{ fontWeight: 500 }}>{cost.category}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{cost.description || '-'}</td>
                      <td>
                        <span className={`badge ${cost.costType === 'fixed' ? 'badge-neutral' : 'badge-warning'}`}>
                          {cost.costType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--color-error)' }}>
                        -{formatCurrency(cost.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleEditCost(cost)}
                            style={{ padding: '0.25rem' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleDeleteCost(cost.id)}
                            style={{ padding: '0.25rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--color-light-gray)' }}>
                  <td colSpan={4}><strong>Total ({filteredCosts.length} entries)</strong></td>
                  <td style={{ fontWeight: 600, color: 'var(--color-error)' }}>
                    -{formatCurrency(filteredCosts.reduce((sum, c) => sum + c.amount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="card-body">
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              No costs match your filters
            </p>
          </div>
        )}
      </div>
      
      {/* Add/Edit Cost Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingCost(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCost ? 'Edit Cost' : 'Add Operational Cost'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingCost(null); }}>✕</button>
            </div>
            <form onSubmit={handleAddCost}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cost Type</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      padding: '1rem',
                      border: `2px solid ${newCost.costType === 'fixed' ? 'var(--color-black)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: newCost.costType === 'fixed' ? 'var(--color-light-gray)' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="costType"
                        value="fixed"
                        checked={newCost.costType === 'fixed'}
                        onChange={(e) => {
                          setNewCost({ ...newCost, costType: e.target.value as CostType, category: '' });
                          setIsCreatingNewCategory(false);
                          setNewCategoryName('');
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={16} /> Fixed
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rent, insurance, subscriptions</div>
                      </div>
                    </label>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      padding: '1rem',
                      border: `2px solid ${newCost.costType === 'variable' ? 'var(--color-black)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: newCost.costType === 'variable' ? 'var(--color-light-gray)' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="costType"
                        value="variable"
                        checked={newCost.costType === 'variable'}
                        onChange={(e) => {
                          setNewCost({ ...newCost, costType: e.target.value as CostType, category: '' });
                          setIsCreatingNewCategory(false);
                          setNewCategoryName('');
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={16} /> Variable
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Salaries, contractors, travel</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (£)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
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
                        required
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
                    <>
                      {((newCost.costType === 'fixed' ? existingFixedCategories : existingVariableCategories).length > 0) ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select
                            className="form-select"
                            value={newCost.category}
                            onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                            required={!isCreatingNewCategory}
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
                            <PlusCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            className="form-input"
                            value={newCost.category}
                            onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                            placeholder="Enter category name (e.g., Warehouse Rent)"
                            required
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            This will be your first {newCost.costType} cost category
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCost.description}
                    onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                    placeholder="e.g., December warehouse rent"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setEditingCost(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCost ? 'Update Cost' : 'Add Cost'}
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

