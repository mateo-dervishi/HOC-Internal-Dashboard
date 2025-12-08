import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials, calculateExpectedPayments } from '../types';
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
    totalValue: '',
    paymentType: 'full_account' as PaymentType,
    notes: '',
  });
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    const project: Project = {
      id: crypto.randomUUID(),
      code: newProject.code,
      clientName: newProject.clientName,
      totalValue: parseFloat(newProject.totalValue) || 0,
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
      totalValue: '',
      paymentType: 'full_account',
      notes: '',
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
  const expectedPayments = newProject.totalValue 
    ? calculateExpectedPayments(parseFloat(newProject.totalValue), newProject.paymentType)
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
              color: 'var(--color-stone)'
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
            const collectionRate = project.totalValue > 0 
              ? (financials.totalInflows / project.totalValue) * 100 
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
                      <span className="project-stat-label">Project Value</span>
                      <span className="project-stat-value">{formatCurrency(project.totalValue)}</span>
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
                    <div className="project-stat">
                      <span className="project-stat-label">Payment Type</span>
                      <span className="project-stat-value" style={{ fontSize: '0.85rem' }}>
                        {project.paymentType === 'cash_payment' ? 'Cash Payment (60/40)' : 'Full Account'}
                      </span>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-stone)', marginBottom: '0.5rem' }}>
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
                    <label className="form-label">Total Project Value (£)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={newProject.totalValue}
                      onChange={(e) => setNewProject({ ...newProject, totalValue: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-select"
                      value={newProject.paymentType}
                      onChange={(e) => setNewProject({ ...newProject, paymentType: e.target.value as PaymentType })}
                    >
                      <option value="full_account">Full Account (100%)</option>
                      <option value="cash_payment">Cash Payment (60% Account / 40% Cash)</option>
                    </select>
                  </div>
                </div>
                
                {/* Payment Terms Preview */}
                {expectedPayments && (
                  <div className="payment-terms">
                    <div className="payment-terms-title">Payment Schedule (20/70/10)</div>
                    <div className="payment-terms-grid">
                      <div className="payment-term">
                        <div className="payment-term-stage">Upfront</div>
                        <div className="payment-term-percent">20%</div>
                        <div className="payment-term-amount">
                          {formatCurrency(expectedPayments.upfront.account + expectedPayments.upfront.cash)}
                        </div>
                        {newProject.paymentType === 'cash_payment' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '0.5rem' }}>
                            Account: {formatCurrency(expectedPayments.upfront.account)}<br/>
                            Cash: {formatCurrency(expectedPayments.upfront.cash)}
                          </div>
                        )}
                      </div>
                      <div className="payment-term">
                        <div className="payment-term-stage">Production</div>
                        <div className="payment-term-percent">70%</div>
                        <div className="payment-term-amount">
                          {formatCurrency(expectedPayments.production.account + expectedPayments.production.cash)}
                        </div>
                        {newProject.paymentType === 'cash_payment' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '0.5rem' }}>
                            Account: {formatCurrency(expectedPayments.production.account)}<br/>
                            Cash: {formatCurrency(expectedPayments.production.cash)}
                          </div>
                        )}
                      </div>
                      <div className="payment-term">
                        <div className="payment-term-stage">Delivery</div>
                        <div className="payment-term-percent">10%</div>
                        <div className="payment-term-amount">
                          {formatCurrency(expectedPayments.delivery.account + expectedPayments.delivery.cash)}
                        </div>
                        {newProject.paymentType === 'cash_payment' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '0.5rem' }}>
                            Account: {formatCurrency(expectedPayments.delivery.account)}<br/>
                            Cash: {formatCurrency(expectedPayments.delivery.cash)}
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

