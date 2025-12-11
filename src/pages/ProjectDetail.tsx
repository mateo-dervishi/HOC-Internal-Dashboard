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
  X,
  FileText,
  Banknote
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials, calculateValuationTotals, VAT_RATE } from '../types';
import type { Payment, SupplierCost, Valuation } from '../types';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useDashboard();
  
  const project = state.projects.find(p => p.id === id);
  
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValuation, setEditingValuation] = useState<Valuation | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingCost, setEditingCost] = useState<SupplierCost | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    code: project?.code || '',
    clientName: project?.clientName || '',
    address: project?.address || '',
    status: project?.status || 'active',
    hasCashPayment: project?.hasCashPayment || false,
    notes: project?.notes || '',
  });
  
  // New valuation form state
  const [newValuation, setNewValuation] = useState({
    date: new Date().toISOString().split('T')[0],
    grandTotal: '',
    fees: '',
    omissions: '',
    vatRate: '20',
    notes: '',
  });
  
  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: '',
    vatRate: '20',
    type: 'account' as Payment['type'],
    valuationName: '',
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
  
  const handleAddValuation = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-generate name as V1, V2, V3, etc. (or keep existing name when editing)
    const autoName = editingValuation?.name || `V${project.valuations.length + 1}`;
    const valuation: Valuation = {
      id: editingValuation?.id || crypto.randomUUID(),
      name: autoName,
      date: newValuation.date,
      grandTotal: parseFloat(newValuation.grandTotal) || 0,
      fees: parseFloat(newValuation.fees) || 0,
      omissions: parseFloat(newValuation.omissions) || 0,
      vatRate: (parseFloat(newValuation.vatRate) || 20) / 100,
      notes: newValuation.notes,
    };
    
    if (editingValuation) {
      // Update existing valuation
      const updatedValuations = project.valuations.map(v => 
        v.id === editingValuation.id ? valuation : v
      );
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...project, valuations: updatedValuations },
      });
    } else {
      // Add new valuation
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...project, valuations: [...project.valuations, valuation] },
      });
    }
    
    setShowValuationModal(false);
    setEditingValuation(null);
    setNewValuation({
      date: new Date().toISOString().split('T')[0],
      grandTotal: '',
      fees: '',
      omissions: '',
      vatRate: '20',
      notes: '',
    });
  };
  
  const handleEditValuation = (valuation: Valuation) => {
    setEditingValuation(valuation);
    setNewValuation({
      date: valuation.date,
      grandTotal: valuation.grandTotal.toString(),
      fees: valuation.fees.toString(),
      omissions: valuation.omissions.toString(),
      vatRate: ((valuation.vatRate ?? VAT_RATE) * 100).toString(),
      notes: valuation.notes || '',
    });
    setShowValuationModal(true);
  };
  
  const handleDeleteValuation = (valuationId: string) => {
    if (confirm('Are you sure you want to delete this valuation?')) {
      const updatedValuations = project.valuations.filter(v => v.id !== valuationId);
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...project, valuations: updatedValuations },
      });
    }
  };
  
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payment: Payment = {
      id: editingPayment?.id || crypto.randomUUID(),
      date: newPayment.date,
      amount: parseFloat(newPayment.amount) || 0,
      vatRate: (parseFloat(newPayment.vatRate) || 0) / 100,
      type: newPayment.type,
      valuationName: newPayment.valuationName || undefined,
      description: newPayment.description,
    };
    
    if (editingPayment) {
      // Update existing payment
      const updatedPayments = project.payments.map(p => 
        p.id === editingPayment.id ? payment : p
      );
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...project, payments: updatedPayments },
      });
    } else {
      // Add new payment
      dispatch({
        type: 'ADD_PAYMENT',
        payload: { projectId: project.id, payment },
      });
    }
    
    setShowPaymentModal(false);
    setEditingPayment(null);
    setNewPayment({
      amount: '',
      vatRate: '20',
      type: 'account',
      valuationName: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setNewPayment({
      amount: payment.amount.toString(),
      vatRate: payment.vatRate ? (payment.vatRate * 100).toString() : '20',
      type: payment.type,
      valuationName: payment.valuationName || '',
      date: payment.date,
      description: payment.description || '',
    });
    setShowPaymentModal(true);
  };
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const cost: SupplierCost = {
      id: editingCost?.id || crypto.randomUUID(),
      date: newCost.date,
      amount: parseFloat(newCost.amount) || 0,
      supplier: newCost.supplier,
      description: newCost.description,
    };
    
    if (editingCost) {
      // Update existing cost
      const updatedCosts = project.supplierCosts.map(c => 
        c.id === editingCost.id ? cost : c
      );
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...project, supplierCosts: updatedCosts },
      });
    } else {
      // Add new cost
      dispatch({
        type: 'ADD_SUPPLIER_COST',
        payload: { projectId: project.id, cost },
      });
    }
    
    setShowCostModal(false);
    setEditingCost(null);
    setNewCost({
      amount: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
  const handleEditCost = (cost: SupplierCost) => {
    setEditingCost(cost);
    setNewCost({
      amount: cost.amount.toString(),
      supplier: cost.supplier,
      date: cost.date,
      description: cost.description || '',
    });
    setShowCostModal(true);
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
        address: editForm.address,
        status: editForm.status as 'active' | 'completed' | 'on_hold',
        hasCashPayment: editForm.hasCashPayment,
        notes: editForm.notes,
      },
    });
    setIsEditing(false);
  };
  
  const handleToggleCP = () => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { ...project, hasCashPayment: !project.hasCashPayment },
    });
  };
  
  const handleDeleteProject = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_PROJECT', payload: project.id });
      navigate('/projects');
    }
  };
  
  const collectionRate = financials.totalGross > 0 
    ? (financials.totalInflows / financials.totalGross) * 100 
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
          {project.hasCashPayment && (
            <span className="badge badge-success">Fees Enabled</span>
          )}
        </div>
        
        {isEditing ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                style={{ fontSize: '2rem', fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
              />
              <input
                type="text"
                className="form-input"
                value={editForm.clientName}
                onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                style={{ marginTop: '0.5rem' }}
                placeholder="Client name"
              />
              <input
                type="text"
                className="form-input"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                style={{ marginTop: '0.5rem' }}
                placeholder="Address"
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'completed' | 'on_hold' })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.hasCashPayment}
                    onChange={(e) => setEditForm({ ...editForm, hasCashPayment: e.target.checked })}
                  />
                  Fees
                </label>
              </div>
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
              {project.address && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {project.address}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${project.hasCashPayment ? 'btn-ghost' : 'btn-secondary'} btn-sm`} 
                onClick={handleToggleCP}
              >
                <Banknote size={16} /> {project.hasCashPayment ? 'Disable Fees' : 'Enable Fees'}
              </button>
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
          <div className="stat-label">Gross Value</div>
          <div className="stat-value">{formatCurrency(financials.totalGross)}</div>
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
      
      {/* Valuations Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
            <FileText size={20} style={{ marginRight: 8, opacity: 0.7 }} />
            Contract Value
          </h3>
          {project.valuations.length === 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => {
              setEditingValuation(null);
              setNewValuation({
                date: new Date().toISOString().split('T')[0],
                grandTotal: '',
                fees: '',
                omissions: '',
                vatRate: '20',
                notes: '',
              });
              setShowValuationModal(true);
            }}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>
        {project.valuations.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Grand Total</th>
                  <th>Omissions</th>
                  <th>Subtotal</th>
                  <th>VAT</th>
                  <th>Gross Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {project.valuations
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(valuation => {
                    const calc = calculateValuationTotals(valuation, project.hasCashPayment);
                    return (
                      <tr key={valuation.id}>
                        <td style={{ fontWeight: 500 }}>{valuation.name}</td>
                        <td>{formatDate(valuation.date)}</td>
                        <td>{formatCurrency(calc.grandTotal)}</td>
                        <td style={{ color: calc.omissions > 0 ? 'var(--color-error)' : 'inherit' }}>
                          {calc.omissions > 0 ? `-${formatCurrency(calc.omissions)}` : '-'}
                        </td>
                        <td>{formatCurrency(calc.subtotal)}</td>
                        <td>
                          <span title={`VAT Rate: ${(calc.vatRate * 100).toFixed(0)}%`}>
                            {formatCurrency(calc.vat)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{formatCurrency(calc.gross)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => handleEditValuation(valuation)}
                              style={{ padding: '0.25rem' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => handleDeleteValuation(valuation.id)}
                              style={{ padding: '0.25rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-body">
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              No contract value yet.
            </p>
          </div>
        )}
      </div>
      
      {/* Payment Summary */}
      {(project.hasCashPayment || financials.totalInflows > 0) && (
        <div className="card mb-4">
          <div className="card-body" style={{ 
            display: 'flex', 
            gap: '3rem',
            background: 'var(--color-light-gray)'
          }}>
            <div>
              <div className="stat-label">Account Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-success)', fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(financials.accountPayments)}
              </div>
            </div>
            {project.hasCashPayment && (
              <div>
                <div className="stat-label">Fee Payments</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-success)', fontFamily: 'Inter, sans-serif' }}>
                  {formatCurrency(financials.feePayments)}
                </div>
              </div>
            )}
            <div>
              <div className="stat-label">Outstanding</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 300, 
                fontFamily: 'Inter, sans-serif',
                color: financials.totalGross - financials.totalInflows > 0 ? 'var(--color-warning)' : 'var(--color-success)'
              }}>
                {formatCurrency(Math.max(0, financials.totalGross - financials.totalInflows))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payments (Inflows) */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Payments Received</h3>
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
                  <th>Valuation</th>
                  <th>Type</th>
                  <th>Amount (ex VAT)</th>
                  <th>VAT</th>
                  <th>Total (inc VAT)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(payment => {
                    const vatAmount = payment.vatRate ? payment.amount * payment.vatRate : 0;
                    const totalWithVat = payment.amount + vatAmount;
                    return (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.date)}</td>
                        <td>{payment.valuationName || '-'}</td>
                        <td>
                          <span className={`badge ${payment.type === 'cash' ? 'badge-success' : 'badge-neutral'}`}>
                            {payment.type === 'cash' ? 'Fee' : 'Account'}
                          </span>
                        </td>
                        <td>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>
                          {payment.vatRate ? `${formatCurrency(vatAmount)} (${(payment.vatRate * 100).toFixed(0)}%)` : '-'}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                          +{formatCurrency(totalWithVat)}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                          {payment.description || '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => handleEditPayment(payment)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => handleDeletePayment(payment.id)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Supplier Costs</h3>
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
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.supplierCosts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(cost => (
                    <tr key={cost.id}>
                      <td>{formatDate(cost.date)}</td>
                      <td>{cost.supplier}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {cost.description || '-'}
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--color-error)' }}>
                        -{formatCurrency(cost.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleEditCost(cost)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleDeleteCost(cost.id)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
        ) : (
          <div className="card-body">
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
              No supplier costs recorded yet
            </p>
          </div>
        )}
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
      
      {/* Add Valuation Modal */}
      {showValuationModal && (
        <div className="modal-overlay" onClick={() => { setShowValuationModal(false); setEditingValuation(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingValuation ? 'Edit Valuation' : 'Add Valuation'}</h2>
              <button className="modal-close" onClick={() => { setShowValuationModal(false); setEditingValuation(null); }}>✕</button>
            </div>
            <form onSubmit={handleAddValuation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newValuation.date}
                    onChange={(e) => setNewValuation({ ...newValuation, date: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    This will be saved as V{editingValuation ? project.valuations.findIndex(v => v.id === editingValuation.id) + 1 : project.valuations.length + 1}
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Grand Total (£) - Ex VAT</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={newValuation.grandTotal}
                    onChange={(e) => setNewValuation({ ...newValuation, grandTotal: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    Total value of goods/services for this valuation
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Omissions (£)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={newValuation.omissions}
                    onChange={(e) => setNewValuation({ ...newValuation, omissions: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    Cancelled items - enter as positive number
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">VAT Rate (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="20"
                    value={newValuation.vatRate}
                    onChange={(e) => setNewValuation({ ...newValuation, vatRate: e.target.value })}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    VAT rate for this valuation (default 20%)
                  </small>
                </div>
                
                {/* Preview */}
                {(parseFloat(newValuation.grandTotal) > 0) && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'var(--color-light-gray)', 
                    borderRadius: 'var(--radius-md)',
                    marginTop: '1rem'
                  }}>
                    <div className="stat-label" style={{ marginBottom: '0.75rem' }}>Preview</div>
                    {(() => {
                      const grandTotal = parseFloat(newValuation.grandTotal) || 0;
                      const omissions = parseFloat(newValuation.omissions) || 0;
                      const vatRate = (parseFloat(newValuation.vatRate) || 20) / 100;
                      const subtotal = grandTotal - omissions;
                      const vat = subtotal * vatRate;
                      const gross = grandTotal + vat - omissions;
                      
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <div>Grand Total:</div><div style={{ textAlign: 'right' }}>{formatCurrency(grandTotal)}</div>
                          {omissions > 0 && (
                            <><div>Omissions:</div><div style={{ textAlign: 'right', color: 'var(--color-error)' }}>-{formatCurrency(omissions)}</div></>
                          )}
                          <div>Subtotal:</div><div style={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</div>
                          <div>VAT ({(vatRate * 100).toFixed(0)}%):</div><div style={{ textAlign: 'right' }}>{formatCurrency(vat)}</div>
                          <div style={{ fontWeight: 600 }}>Gross Value:</div><div style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(gross)}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <div className="form-group mb-0" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newValuation.notes}
                    onChange={(e) => setNewValuation({ ...newValuation, notes: e.target.value })}
                    placeholder="Any notes for this valuation..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowValuationModal(false); setEditingValuation(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingValuation ? 'Update Valuation' : 'Add Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
              <button className="modal-close" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }}>✕</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valuation Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., V1, V2"
                      value={newPayment.valuationName}
                      onChange={(e) => setNewPayment({ ...newPayment, valuationName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-select"
                      value={newPayment.type}
                      onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as Payment['type'] })}
                    >
                      <option value="account">Account</option>
                      {project.hasCashPayment && (
                        <option value="cash">Fee</option>
                      )}
                    </select>
                  </div>
                </div>
                
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
                    <label className="form-label">VAT Rate (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPayment.vatRate}
                      onChange={(e) => setNewPayment({ ...newPayment, vatRate: e.target.value })}
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="20"
                    />
                  </div>
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
                <button type="button" className="btn btn-ghost" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPayment ? 'Update Payment' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Supplier Cost Modal */}
      {showCostModal && (
        <div className="modal-overlay" onClick={() => { setShowCostModal(false); setEditingCost(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCost ? 'Edit Supplier Cost' : 'Add Supplier Cost'}</h2>
              <button className="modal-close" onClick={() => { setShowCostModal(false); setEditingCost(null); }}>✕</button>
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
                <button type="button" className="btn btn-ghost" onClick={() => { setShowCostModal(false); setEditingCost(null); }}>
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

export default ProjectDetail;
