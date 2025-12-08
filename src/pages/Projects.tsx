import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials } from '../types';
import type { Project } from '../types';

const Projects = () => {
  const { state, dispatch } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // New project form state - simplified
  const [newProject, setNewProject] = useState({
    code: '',
    clientName: '',
    address: '',
    notes: '',
  });
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    const project: Project = {
      id: crypto.randomUUID(),
      code: newProject.code,
      clientName: newProject.clientName,
      address: newProject.address,
      hasCashPayment: false,  // Default to no CP, can enable later
      valuations: [],
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
      address: '',
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
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'completed' ? 'neutral' : 'warning'}`}>
                          {project.status}
                        </span>
                        {project.hasCashPayment && (
                          <span className="badge badge-success">CP</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="project-card-body">
                    <div className="project-stat">
                      <span className="project-stat-label">Valuations</span>
                      <span className="project-stat-value">{project.valuations.length}</span>
                    </div>
                    <div className="project-stat">
                      <span className="project-stat-label">Project Value</span>
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
                    {financials.totalProjectValue > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Collection: {Math.round(collectionRate)}%
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
                        </div>
                      </div>
                    )}
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
      
      {/* Create Project Modal - Simplified */}
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
                
                <div className="form-group">
                  <label className="form-label">Address (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 2 Park Crescent, TW2 6NT"
                    value={newProject.address}
                    onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                  />
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Any additional notes..."
                    value={newProject.notes}
                    onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'var(--color-light-gray)', 
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)'
                }}>
                  <strong>Next steps after creating:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                    <li>Add valuations (V1, V2, V3...)</li>
                    <li>Enable Cash Payment (CP) if applicable</li>
                    <li>Record payments as they come in</li>
                    <li>Track supplier costs</li>
                  </ul>
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
