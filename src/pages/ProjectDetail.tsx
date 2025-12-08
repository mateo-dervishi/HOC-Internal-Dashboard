import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials, calculateExpectedPayments, calculateProjectBreakdown } from '../types';
import type { Payment, SupplierCost, PaymentType } from '../types';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useDashboard();
  
  const project = state.projects.find(p => p.id === id);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    code: project?.code || '',
    clientName: project?.clientName || '',
    totalValue: project?.totalValue?.toString() || '',
    paymentType: project?.paymentType || 'full_account' as PaymentType,
    status: project?.status || 'active',
    notes: project?.notes || '',
  });
  
  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: '',
    stage: 'upfront' as Payment['stage'],
    type: 'account' as Payment['type'],
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  // New cost form state
  const [newCost, setNewCost] = useState({
    amount: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  if (!project) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3 className="empty-state-title">Project Not Found</h3>
          <p className="empty-state-text">The project you're looking for doesn't exist.</p>
          <Link to="/projects" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
  
  const financials = calculateProjectFinancials(project);
  const expectedPayments = calculateExpectedPayments(project.totalValue, project.paymentType);
  const breakdown = calculateProjectBreakdown(project.totalValue, project.paymentType);
  
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
  
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payment: Payment = {
      id: crypto.randomUUID(),
      date: newPayment.date,
      amount: parseFloat(newPayment.amount) || 0,
      stage: newPayment.stage,
      type: newPayment.type,
      description: newPayment.description,
    };
    
    dispatch({
      type: 'ADD_PAYMENT',
      payload: { projectId: project.id, payment },
    });
    
    setShowPaymentModal(false);
    setNewPayment({
      amount: '',
      stage: 'upfront',
      type: 'account',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const cost: SupplierCost = {
      id: crypto.randomUUID(),
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      supplier: newCost.supplier,
      description: newCost.description,
    };
    
    dispatch({
      type: 'ADD_SUPPLIER_COST',
      payload: { projectId: project.id, cost },
    });
    
    setShowCostModal(false);
    setNewCost({
      amount: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
  const handleDeletePayment = (paymentId: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      dispatch({
        type: 'DELETE_PAYMENT',
        payload: { projectId: project.id, paymentId },
      });
    }
  };
  
  const handleDeleteCost = (costId: string) => {
    if (confirm('Are you sure you want to delete this supplier cost?')) {
      dispatch({
        type: 'DELETE_SUPPLIER_COST',
        payload: { projectId: project.id, costId },
      });
    }
  };
  
  const handleSaveEdit = () => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        ...project,
        code: editForm.code,
        clientName: editForm.clientName,
        totalValue: parseFloat(editForm.totalValue) || 0,
        paymentType: editForm.paymentType,
        status: editForm.status as 'active' | 'completed' | 'on_hold',
        notes: editForm.notes,
      },
    });
    setIsEditing(false);
  };
  
  const handleDeleteProject = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_PROJECT', payload: project.id });
      navigate('/projects');
    }
  };
  
  // Calculate payments by stage
  const getStagePayments = (stage: Payment['stage']) => {
    return project.payments
      .filter(p => p.stage === stage)
      .reduce((sum, p) => sum + p.amount, 0);
  };
  
  const collectionRate = financials.totalProjectValue > 0 
    ? (financials.totalInflows / financials.totalProjectValue) * 100 
    : 0;

  return (
    <div>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link to="/projects" className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} />
          </Link>
          <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'completed' ? 'neutral' : 'warning'}`}>
            {project.status}
          </span>
          <span className="badge badge-neutral">
            {project.paymentType === 'account_cp' ? 'Acc/CP (60/40)' : 'Full Account'}
          </span>
        </div>
        
        {isEditing ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                style={{ fontSize: '2rem', fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
              />
              <input
                type="text"
                className="form-input"
                value={editForm.clientName}
                onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                style={{ marginTop: '0.5rem' }}
                placeholder="Client name"
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              <Save size={18} /> Save
            </button>
            <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
              <X size={18} /> Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">{project.code}</h1>
              <p className="page-subtitle">{project.clientName}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Value (Inc VAT)</div>
          {isEditing ? (
            <div>
              <input
                type="number"
                className="form-input"
                value={editForm.totalValue}
                onChange={(e) => setEditForm({ ...editForm, totalValue: e.target.value })}
                placeholder="Total Value"
              />
              <select
                className="form-select"
                value={editForm.paymentType}
                onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value as PaymentType })}
                style={{ marginTop: '0.5rem' }}
              >
                <option value="full_account">Full Account</option>
                <option value="account_cp">Acc/CP (60/40)</option>
              </select>
            </div>
          ) : (
            <>
              <div className="stat-value">{formatCurrency(financials.totalProjectValue)}</div>
              <div className="stat-change">
                {project.paymentType === 'account_cp' ? (
                  <>Acc: {formatCurrency(breakdown.accountExVat)} + VAT + Cash: {formatCurrency(breakdown.feesTotal)}</>
                ) : (
                  <>Value: {formatCurrency(project.totalValue)} + VAT: {formatCurrency(breakdown.vatAmount)}</>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="stat-card success">
          <div className="stat-label">Total Received</div>
          <div className="stat-value">{formatCurrency(financials.totalInflows)}</div>
          <div className="stat-change">
            {Math.round(collectionRate)}% collected
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-label">Supplier Costs</div>
          <div className="stat-value">{formatCurrency(financials.totalSupplierCosts)}</div>
        </div>
        
        <div className={`stat-card ${financials.grossProfit >= 0 ? 'success' : 'error'}`}>
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value">{formatCurrency(financials.grossProfit)}</div>
          <div className={`stat-change ${financials.grossProfit >= 0 ? 'positive' : 'negative'}`}>
            {financials.grossProfit >= 0 ? (
              <><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />{financials.profitMargin.toFixed(1)}% margin</>
            ) : (
              <><TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />Loss on project</>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Terms Overview */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Payment Schedule (20/70/10)</h3>
        </div>
        <div className="card-body">
          <div className="payment-terms-grid">
            <div className="payment-term">
              <div className="payment-term-stage">Upfront (20%)</div>
              <div className="payment-term-percent">
                {formatCurrency(getStagePayments('upfront'))}
              </div>
              <div className="payment-term-amount">
                of {formatCurrency(
                  expectedPayments.upfront.account + 
                  expectedPayments.upfront.accountVat + 
                  expectedPayments.upfront.fees
                )} expected
              </div>
              <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(
                      (getStagePayments('upfront') / 
                      (expectedPayments.upfront.account + expectedPayments.upfront.accountVat + expectedPayments.upfront.fees || 1)) * 100, 
                      100
                    )}%` 
                  }} 
                />
              </div>
            </div>
            
            <div className="payment-term">
              <div className="payment-term-stage">Production (70%)</div>
              <div className="payment-term-percent">
                {formatCurrency(getStagePayments('production'))}
              </div>
              <div className="payment-term-amount">
                of {formatCurrency(
                  expectedPayments.production.account + 
                  expectedPayments.production.accountVat + 
                  expectedPayments.production.fees
                )} expected
              </div>
              <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(
                      (getStagePayments('production') / 
                      (expectedPayments.production.account + expectedPayments.production.accountVat + expectedPayments.production.fees || 1)) * 100, 
                      100
                    )}%` 
                  }} 
                />
              </div>
            </div>
            
            <div className="payment-term">
              <div className="payment-term-stage">Delivery (10%)</div>
              <div className="payment-term-percent">
                {formatCurrency(getStagePayments('delivery'))}
              </div>
              <div className="payment-term-amount">
                of {formatCurrency(
                  expectedPayments.delivery.account + 
                  expectedPayments.delivery.accountVat + 
                  expectedPayments.delivery.fees
                )} expected
              </div>
              <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(
                      (getStagePayments('delivery') / 
                      (expectedPayments.delivery.account + expectedPayments.delivery.accountVat + expectedPayments.delivery.fees || 1)) * 100, 
                      100
                    )}%` 
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Account vs Cash Breakdown */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'var(--color-light-gray)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: '2rem'
          }}>
            <div>
              <div className="stat-label">Account Payments</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-black)' }}>
                {formatCurrency(financials.accountPayments)}
              </div>
            </div>
            {project.paymentType === 'account_cp' && (
              <div>
                <div className="stat-label">Cash Payments</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-success)' }}>
                  {formatCurrency(financials.feesPayments)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Payments (Inflows) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Client Payments (Inflows)</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPaymentModal(true)}>
              <Plus size={16} /> Add Payment
            </button>
          </div>
          {project.payments.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Stage</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {project.payments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(payment => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.date)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{payment.stage}</td>
                        <td>
                          <span className={`badge ${payment.type === 'fees' ? 'badge-success' : 'badge-neutral'}`}>
                            {payment.type === 'fees' ? 'Cash' : 'Account'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                          +{formatCurrency(payment.amount)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleDeletePayment(payment.id)}
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
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No payments recorded yet
              </p>
            </div>
          )}
        </div>
        
        {/* Supplier Costs (Outflows) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Supplier Costs (Outflows)</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCostModal(true)}>
              <Plus size={16} /> Add Cost
            </button>
          </div>
          {project.supplierCosts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {project.supplierCosts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(cost => (
                      <tr key={cost.id}>
                        <td>{formatDate(cost.date)}</td>
                        <td>{cost.supplier}</td>
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
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No supplier costs recorded yet
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Notes */}
      {(project.notes || isEditing) && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Notes</h3>
          </div>
          <div className="card-body">
            {isEditing ? (
              <textarea
                className="form-textarea"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
              />
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{project.notes}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (£)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
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
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Stage</label>
                    <select
                      className="form-select"
                      value={newPayment.stage}
                      onChange={(e) => setNewPayment({ ...newPayment, stage: e.target.value as Payment['stage'] })}
                    >
                      <option value="upfront">Upfront (20%)</option>
                      <option value="production">Production (70%)</option>
                      <option value="delivery">Delivery (10%)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-select"
                      value={newPayment.type}
                      onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as Payment['type'] })}
                    >
                      <option value="account">Account</option>
                      {project.paymentType === 'account_cp' && (
                        <option value="fees">Cash</option>
                      )}
                    </select>
                  </div>
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                    placeholder="e.g., Bank transfer reference"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Supplier Cost Modal */}
      {showCostModal && (
        <div className="modal-overlay" onClick={() => setShowCostModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Supplier Cost</h2>
              <button className="modal-close" onClick={() => setShowCostModal(false)}>✕</button>
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
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCost.supplier}
                    onChange={(e) => setNewCost({ ...newCost, supplier: e.target.value })}
                    placeholder="e.g., ABC Furniture Ltd"
                    required
                  />
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCost.description}
                    onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                    placeholder="e.g., Kitchen units and handles"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCostModal(false)}>
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

export default ProjectDetail;
