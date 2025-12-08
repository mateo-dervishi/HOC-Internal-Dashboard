import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials, calculateExpectedPayments, VAT_RATE } from '../types';
import type { Project, PaymentType } from '../types';

const Projects = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // New project form state
  const [newProject, setNewProject] = useState({
    code: '',
    clientName: '',
    goodsTotal: '',    // VATable portion
    feesTotal: '',     // Cash/Fees - non-VATable
    paymentType: 'full_account' as PaymentType,
    notes: '',
  });
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    const project: Project = {
      id: crypto.randomUUID(),
      code: newProject.code,
      clientName: newProject.clientName,
      goodsTotal: parseFloat(newProject.goodsTotal) || 0,
      feesTotal: parseFloat(newProject.feesTotal) || 0,
      paymentType: newProject.paymentType,
      payments: [],
      supplierCosts: [],
      createdAt: new Date().toISOString(),
      status: 'active',
      notes: newProject.notes,
    };
    
    dispatch({ type: 'ADD_PROJECT', payload: project });
    setShowModal(false);
    setNewProject({
      code: '',
      clientName: '',
      goodsTotal: '',
      feesTotal: '',
      paymentType: 'full_account',
      notes: '',
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Filter projects
  const filteredProjects = state.projects.filter(project => {
    const matchesSearch = 
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  // Calculate expected payments for preview
  const goodsValue = parseFloat(newProject.goodsTotal) || 0;
  const feesValue = parseFloat(newProject.feesTotal) || 0;
  const expectedPayments = (goodsValue > 0 || feesValue > 0)
    ? calculateExpectedPayments(goodsValue, feesValue, newProject.paymentType)
    : null;

  return (
    <div>
      <header className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage all your client projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          New Project
        </button>
      </header>
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>
      
      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map(project => {
            const financials = calculateProjectFinancials(project);
            const collectionRate = financials.totalProjectValue > 0 
              ? (financials.totalInflows / financials.totalProjectValue) * 100 
              : 0;
            
            return (
              <Link to={`/projects/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
                <div className="project-card">
                  <div className="project-card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="project-code">{project.code}</div>
                        <div className="project-client">{project.clientName}</div>
                      </div>
                      <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'completed' ? 'neutral' : 'warning'}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="project-card-body">
                    <div className="project-stat">
                      <span className="project-stat-label">Total Value (Inc VAT)</span>
                      <span className="project-stat-value">{formatCurrency(financials.totalProjectValue)}</span>
                    </div>
                    <div className="project-stat">
                      <span className="project-stat-label">Received</span>
                      <span className="project-stat-value">{formatCurrency(financials.totalInflows)}</span>
                    </div>
                    <div className="project-stat">
                      <span className="project-stat-label">Gross Profit</span>
                      <span className={`project-stat-value ${financials.grossProfit >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(financials.grossProfit)}
                      </span>
                    </div>
                    {project.feesTotal > 0 && (
                      <div className="project-stat">
                        <span className="project-stat-label">Fees (Cash)</span>
                        <span className="project-stat-value" style={{ fontSize: '0.85rem' }}>
                          {formatCurrency(project.feesTotal)}
                        </span>
                      </div>
                    )}
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Collection: {Math.round(collectionRate)}%
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <FolderKanban />
            <h3 className="empty-state-title">No Projects Yet</h3>
            <p className="empty-state-text">
              {searchQuery || filterStatus !== 'all' 
                ? 'No projects match your search criteria.'
                : 'Get started by creating your first project.'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} />
                Create First Project
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Project Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., P39"
                      value={newProject.code}
                      onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Lydia"
                      value={newProject.clientName}
                      onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Goods Total (Ex VAT)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={newProject.goodsTotal}
                      onChange={(e) => setNewProject({ ...newProject, goodsTotal: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      VATable portion - goes through account
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fees (Cash - No VAT)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={newProject.feesTotal}
                      onChange={(e) => setNewProject({ ...newProject, feesTotal: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      Non-VATable - cash payment
                    </small>
                  </div>
                </div>
                
                {/* Payment Terms Preview */}
                {expectedPayments && (
                  <div className="payment-terms">
                    <div className="payment-terms-title">Payment Schedule (20/70/10)</div>
                    
                    {/* Totals Summary */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '0.75rem',
                      marginBottom: '1.25rem',
                      padding: '1rem',
                      background: 'var(--color-white)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Goods</div>
                        <div style={{ fontWeight: 500 }}>{formatCurrency(goodsValue)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>VAT (20%)</div>
                        <div style={{ fontWeight: 500 }}>{formatCurrency(goodsValue * VAT_RATE)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Fees</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-success)' }}>{formatCurrency(feesValue)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Total</div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(expectedPayments.totals.total)}</div>
                      </div>
                    </div>
                    
                    <div className="payment-terms-grid">
                      <div className="payment-term">
                        <div className="payment-term-stage">Upfront (20%)</div>
                        <div className="payment-term-percent">
                          {formatCurrency(
                            expectedPayments.upfront.account + 
                            expectedPayments.upfront.accountVat + 
                            expectedPayments.upfront.fees
                          )}
                        </div>
                        {feesValue > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Acc: {formatCurrency(expectedPayments.upfront.account + expectedPayments.upfront.accountVat)}<br/>
                            Fees: {formatCurrency(expectedPayments.upfront.fees)}
                          </div>
                        )}
                      </div>
                      <div className="payment-term">
                        <div className="payment-term-stage">Production (70%)</div>
                        <div className="payment-term-percent">
                          {formatCurrency(
                            expectedPayments.production.account + 
                            expectedPayments.production.accountVat + 
                            expectedPayments.production.fees
                          )}
                        </div>
                        {feesValue > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Acc: {formatCurrency(expectedPayments.production.account + expectedPayments.production.accountVat)}<br/>
                            Fees: {formatCurrency(expectedPayments.production.fees)}
                          </div>
                        )}
                      </div>
                      <div className="payment-term">
                        <div className="payment-term-stage">Delivery (10%)</div>
                        <div className="payment-term-percent">
                          {formatCurrency(
                            expectedPayments.delivery.account + 
                            expectedPayments.delivery.accountVat + 
                            expectedPayments.delivery.fees
                          )}
                        </div>
                        {feesValue > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Acc: {formatCurrency(expectedPayments.delivery.account + expectedPayments.delivery.accountVat)}<br/>
                            Fees: {formatCurrency(expectedPayments.delivery.fees)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="form-group mb-0">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Any additional notes about this project..."
                    value={newProject.notes}
                    onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
