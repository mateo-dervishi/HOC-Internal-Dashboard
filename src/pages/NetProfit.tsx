import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, PoundSterling } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials } from '../types';
import type { OperationalCost } from '../types';

const NetProfit = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  
  const [newCost, setNewCost] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
  const totalOperationalCosts = state.operationalCosts.reduce((sum, c) => sum + c.amount, 0);
  const netProfit = totalGrossProfit - totalOperationalCosts;
  
  // Group operational costs by category
  const costsByCategory = state.operationalCosts.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const cost: OperationalCost = {
      id: crypto.randomUUID(),
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      category: newCost.category,
      description: newCost.description,
    };
    
    dispatch({ type: 'ADD_OPERATIONAL_COST', payload: cost });
    setShowModal(false);
    setNewCost({
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
  const handleDeleteCost = (costId: string) => {
    if (confirm('Are you sure you want to delete this operational cost?')) {
      dispatch({ type: 'DELETE_OPERATIONAL_COST', payload: costId });
    }
  };
  
  // Common operational cost categories
  const commonCategories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Marketing',
    'Insurance',
    'Transport',
    'Office Supplies',
    'Software',
    'Professional Services',
    'Miscellaneous',
  ];

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
          <div className="stat-label">Total Supplier Costs</div>
          <div className="stat-value">{formatCurrency(totalSupplierCosts)}</div>
          <div className="stat-change">
            Project-level costs
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Gross Profit (All Projects)</div>
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
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Project Profits Breakdown */}
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
                            fontWeight: 600,
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
                          fontWeight: 600, 
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
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                      {formatCurrency(totalInflows)}
                    </td>
                    <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                      {formatCurrency(totalSupplierCosts)}
                    </td>
                    <td style={{ 
                      fontWeight: 700, 
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
        
        {/* Operational Costs */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Operational Costs</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Cost
            </button>
          </div>
          
          {/* Cost by Category Summary */}
          {Object.keys(costsByCategory).length > 0 && (
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div className="stat-label" style={{ marginBottom: '1rem' }}>By Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {Object.entries(costsByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div 
                      key={category}
                      style={{
                        background: 'var(--color-light-gray)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-muted)' }}>{category}:</span>{' '}
                      <span style={{ fontWeight: 600, color: 'var(--color-black)' }}>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {state.operationalCosts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {state.operationalCosts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(cost => (
                      <tr key={cost.id}>
                        <td>{formatDate(cost.date)}</td>
                        <td>{cost.category}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{cost.description || '-'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-error)' }}>
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
                <tfoot>
                  <tr style={{ background: 'var(--color-light-gray)' }}>
                    <td colSpan={3}><strong>Total Operational Costs</strong></td>
                    <td style={{ fontWeight: 700, color: 'var(--color-error)' }}>
                      -{formatCurrency(totalOperationalCosts)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
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
            ? 'linear-gradient(135deg, rgba(74, 122, 78, 0.1) 0%, rgba(143, 168, 139, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(139, 58, 58, 0.1) 0%, rgba(196, 120, 90, 0.1) 100%)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
            <div>
              <div className="stat-label">Gross Profit</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-black)' }}>
                {formatCurrency(totalGrossProfit)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--color-text-muted)' }}>
              −
            </div>
            <div>
              <div className="stat-label">Operational Costs</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>
                {formatCurrency(totalOperationalCosts)}
              </div>
            </div>
            <div>
              <div className="stat-label">Net Profit</div>
              <div style={{ 
                fontSize: '1.75rem', 
                fontWeight: 700, 
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
                    {commonCategories.map(cat => (
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
                    placeholder="e.g., December electricity bill"
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

