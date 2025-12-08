import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, FolderKanban, PoundSterling, ArrowRight } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials } from '../types';

const Overview = () => {
  const { state } = useDashboard();
  
  // Calculate totals
  const projectFinancials = state.projects.map(p => ({
    ...p,
    financials: calculateProjectFinancials(p),
  }));
  
  const totalProjectValue = projectFinancials.reduce((sum, p) => sum + p.financials.totalProjectValue, 0);
  const totalInflows = projectFinancials.reduce((sum, p) => sum + p.financials.totalInflows, 0);
  const totalSupplierCosts = projectFinancials.reduce((sum, p) => sum + p.financials.totalSupplierCosts, 0);
  const totalOperationalCosts = state.operationalCosts.reduce((sum, c) => sum + c.amount, 0);
  const grossProfit = totalInflows - totalSupplierCosts;
  const netProfit = grossProfit - totalOperationalCosts;
  
  const activeProjects = state.projects.filter(p => p.status === 'active').length;
  const completedProjects = state.projects.filter(p => p.status === 'completed').length;
  
  // Recent projects
  const recentProjects = [...state.projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Financial Performance Summary</p>
      </header>
      
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Project Value</div>
          <div className="stat-value">{formatCurrency(totalProjectValue)}</div>
          <div className="stat-change">
            {state.projects.length} total projects
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-label">Total Received</div>
          <div className="stat-value">{formatCurrency(totalInflows)}</div>
          <div className="stat-change positive">
            <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
            Client payments
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value">{formatCurrency(grossProfit)}</div>
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
              <><TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />Below break-even</>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FolderKanban size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Project Status
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <div className="stat-label">Active</div>
                <div style={{ fontSize: '2rem', fontWeight: 400, color: 'var(--color-success)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {activeProjects}
                </div>
              </div>
              <div>
                <div className="stat-label">Completed</div>
                <div style={{ fontSize: '2rem', fontWeight: 400, color: 'var(--color-text)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {completedProjects}
                </div>
              </div>
              <div>
                <div className="stat-label">On Hold</div>
                <div style={{ fontSize: '2rem', fontWeight: 400, color: 'var(--color-warning)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {state.projects.filter(p => p.status === 'on_hold').length}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/projects" className="btn btn-secondary btn-sm">
                View All Projects <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <PoundSterling size={20} style={{ marginRight: 8, opacity: 0.7 }} />
              Financial Summary
            </h3>
          </div>
          <div className="card-body">
            <div className="project-stat">
              <span className="project-stat-label">Supplier Costs</span>
              <span className="project-stat-value">{formatCurrency(totalSupplierCosts)}</span>
            </div>
            <div className="project-stat">
              <span className="project-stat-label">Operational Costs</span>
              <span className="project-stat-value">{formatCurrency(totalOperationalCosts)}</span>
            </div>
            <div className="project-stat">
              <span className="project-stat-label">Collection Rate</span>
              <span className="project-stat-value">
                {totalProjectValue > 0 ? Math.round((totalInflows / totalProjectValue) * 100) : 0}%
              </span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/profit" className="btn btn-secondary btn-sm">
                View Profit Analysis <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {recentProjects.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Projects</h3>
            <Link to="/projects" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Value</th>
                  <th>Received</th>
                  <th>Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(project => {
                  const financials = calculateProjectFinancials(project);
                  return (
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
                      <td>{formatCurrency(financials.totalProjectValue)}</td>
                      <td>{formatCurrency(financials.totalInflows)}</td>
                      <td className={financials.grossProfit >= 0 ? 'project-stat-value positive' : 'project-stat-value negative'}>
                        {formatCurrency(financials.grossProfit)}
                      </td>
                      <td>
                        <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'completed' ? 'neutral' : 'warning'}`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
