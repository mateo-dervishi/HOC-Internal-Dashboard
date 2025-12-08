import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, PoundSterling, Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials, FIXED_COST_CATEGORIES, VARIABLE_COST_CATEGORIES } from '../types';
import type { OperationalCost, CostType } from '../types';

const NetProfit = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [costTypeFilter, setCostTypeFilter] = useState<'all' | CostType>('all');
  
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
  
  // Calculate all project profits
  const projectProfits = state.projects.map(project => {
    const financials = calculateProjectFinancials(project);
    return {
      ...project,
      ...financials,
    };
  });
  
  const totalGrossProfit = projectProfits.reduce((sum, p) => sum + p.grossProfit, 0);
  const totalInflows = projectProfits.reduce((sum, p) => sum + p.totalInflows, 0);
  const totalSupplierCosts = projectProfits.reduce((sum, p) => sum + p.totalSupplierCosts, 0);
  const totalAccountPayments = projectProfits.reduce((sum, p) => sum + p.accountPayments, 0);
  const totalCashPayments = projectProfits.reduce((sum, p) => sum + p.cashPayments, 0);
  
  // Operational costs breakdown
  const fixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed');
  const variableCosts = state.operationalCosts.filter(c => c.costType === 'variable');
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalVariableCosts = variableCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalOperationalCosts = totalFixedCosts + totalVariableCosts;
  
  const netProfit = totalGrossProfit - totalOperationalCosts;
  
  // Group costs by category
  const costsByCategory = (costs: OperationalCost[]) => {
    return costs.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const fixedByCategory = costsByCategory(fixedCosts);
  const variableByCategory = costsByCategory(variableCosts);
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const cost: OperationalCost = {
      id: crypto.randomUUID(),
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      category: newCost.category,
      costType: newCost.costType,
      description: newCost.description,
      isRecurring: newCost.isRecurring,
    };
    
    dispatch({ type: 'ADD_OPERATIONAL_COST', payload: cost });
    setShowModal(false);
    setNewCost({
      amount: '',
      category: '',
      costType: 'fixed',
      date: new Date().toISOString().split('T')[0],
      description: '',
      isRecurring: false,
    });
  };
  
  const handleDeleteCost = (costId: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      dispatch({ type: 'DELETE_OPERATIONAL_COST', payload: costId });
    }
  };
  
  // Filter costs for display
  const displayedCosts = costTypeFilter === 'all' 
    ? state.operationalCosts 
    : state.operationalCosts.filter(c => c.costType === costTypeFilter);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Net Profit Analysis</h1>
        <p className="page-subtitle">Overall business profitability after all costs</p>
      </header>
      
      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card success">
          <div className="stat-label">Total Client Inflows</div>
          <div className="stat-value">{formatCurrency(totalInflows)}</div>
          <div className="stat-change positive">
            <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
            From {state.projects.length} projects
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-label">Supplier Costs</div>
          <div className="stat-value">{formatCurrency(totalSupplierCosts)}</div>
          <div className="stat-change">
            Project-level costs
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value">{formatCurrency(totalGrossProfit)}</div>
          <div className="stat-change">
            Before operational costs
          </div>
        </div>
        
        <div className={`stat-card ${netProfit >= 0 ? 'success' : 'error'}`}>
          <div className="stat-label">Net Profit</div>
          <div className="stat-value">{formatCurrency(netProfit)}</div>
          <div className={`stat-change ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            {netProfit >= 0 ? (
              <><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />After all costs</>
            ) : (
              <><TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />Operating at loss</>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Type Breakdown */}
      {(totalAccountPayments > 0 || totalCashPayments > 0) && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">Payment Breakdown</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <div className="stat-label">Account Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-black)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalAccountPayments)}
              </div>
            </div>
            <div>
              <div className="stat-label">Cash Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-success)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalCashPayments)}
              </div>
            </div>
            <div>
              <div className="stat-label">Total Received</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-black)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalInflows)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Operational Costs Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Fixed Costs Card */}
        <div className="card">
          <div className="card-header" style={{ background: 'var(--color-light-gray)' }}>
            <h3 className="card-title">
              <Building2 size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Fixed Costs
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(totalFixedCosts)}</span>
          </div>
          <div className="card-body">
            {Object.keys(fixedByCategory).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(fixedByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{category}</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                No fixed costs recorded
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
              Rent, insurance, subscriptions, etc.
            </p>
          </div>
        </div>
        
        {/* Variable Costs Card */}
        <div className="card">
          <div className="card-header" style={{ background: 'var(--color-light-gray)' }}>
            <h3 className="card-title">
              <Users size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Variable Costs
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(totalVariableCosts)}</span>
          </div>
          <div className="card-body">
            {Object.keys(variableByCategory).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(variableByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{category}</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                No variable costs recorded
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
              Salaries, contractors, transport, etc.
            </p>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Project Profits */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <PoundSterling size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Project Profits
            </h3>
          </div>
          {projectProfits.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Inflows</th>
                    <th>Costs</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {projectProfits
                    .sort((a, b) => b.grossProfit - a.grossProfit)
                    .map(project => (
                      <tr key={project.id}>
                        <td>
                          <Link to={`/projects/${project.id}`} style={{ 
                            color: 'var(--color-black)', 
                            fontWeight: 500,
                            textDecoration: 'none'
                          }}>
                            {project.code}
                          </Link>
                        </td>
                        <td>{project.clientName}</td>
                        <td style={{ color: 'var(--color-success)' }}>
                          {formatCurrency(project.totalInflows)}
                        </td>
                        <td style={{ color: 'var(--color-error)' }}>
                          {formatCurrency(project.totalSupplierCosts)}
                        </td>
                        <td style={{ 
                          fontWeight: 500, 
                          color: project.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                        }}>
                          {formatCurrency(project.grossProfit)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--color-light-gray)' }}>
                    <td colSpan={2}><strong>Total</strong></td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                      {formatCurrency(totalInflows)}
                    </td>
                    <td style={{ color: 'var(--color-error)', fontWeight: 500 }}>
                      {formatCurrency(totalSupplierCosts)}
                    </td>
                    <td style={{ 
                      fontWeight: 600, 
                      color: totalGrossProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                      {formatCurrency(totalGrossProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="card-body">
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                No projects yet. <Link to="/projects" style={{ color: 'var(--color-black)' }}>Add your first project</Link>
              </p>
            </div>
          )}
        </div>
        
        {/* Operational Costs List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Operational Costs</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-select"
                value={costTypeFilter}
                onChange={(e) => setCostTypeFilter(e.target.value as 'all' | CostType)}
                style={{ width: 'auto', padding: '0.5rem' }}
              >
                <option value="all">All</option>
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
          {displayedCosts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCosts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(cost => (
                      <tr key={cost.id}>
                        <td>{formatDate(cost.date)}</td>
                        <td>
                          {cost.category}
                          {cost.description && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {cost.description}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${cost.costType === 'fixed' ? 'badge-neutral' : 'badge-warning'}`}>
                            {cost.costType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--color-error)' }}>
                          -{formatCurrency(cost.amount)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleDeleteCost(cost.id)}
                            style={{ padding: '0.25rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-body">
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                No operational costs recorded yet
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Net Profit Summary Box */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-body" style={{ 
          background: netProfit >= 0 
            ? 'var(--color-success-light)'
            : 'var(--color-error-light)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', textAlign: 'center', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Gross Profit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-black)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalGrossProfit)}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>−</div>
            <div>
              <div className="stat-label">Fixed Costs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-error)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalFixedCosts)}
              </div>
            </div>
            <div>
              <div className="stat-label">Variable Costs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-error)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatCurrency(totalVariableCosts)}
              </div>
            </div>
            <div>
              <div className="stat-label">Net Profit</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 400, 
                fontFamily: 'Cormorant Garamond, serif',
                color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {formatCurrency(netProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Operational Cost Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Operational Cost</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
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
                        onChange={(e) => setNewCost({ ...newCost, costType: e.target.value as CostType, category: '' })}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Fixed</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rent, insurance, etc.</div>
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
                        onChange={(e) => setNewCost({ ...newCost, costType: e.target.value as CostType, category: '' })}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Variable</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Salaries, transport, etc.</div>
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
                  <select
                    className="form-select"
                    value={newCost.category}
                    onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                    required
                  >
                    <option value="">Select a category...</option>
                    {(newCost.costType === 'fixed' ? FIXED_COST_CATEGORIES : VARIABLE_COST_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
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
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetProfit;
