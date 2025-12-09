import { TrendingUp, TrendingDown, PoundSterling, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { calculateProjectFinancials } from '../types';

const NetProfit = () => {
  const { state } = useDashboard();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
  const totalGross = projectProfits.reduce((sum, p) => sum + p.totalGross, 0);
  const totalAccountPayments = projectProfits.reduce((sum, p) => sum + p.accountPayments, 0);
  const totalFeePayments = projectProfits.reduce((sum, p) => sum + p.feePayments, 0);
  
  // Operational costs
  const totalFixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed').reduce((sum, c) => sum + c.amount, 0);
  const totalVariableCosts = state.operationalCosts.filter(c => c.costType === 'variable').reduce((sum, c) => sum + c.amount, 0);
  const totalOperationalCosts = totalFixedCosts + totalVariableCosts;
  
  const netProfit = totalGrossProfit - totalOperationalCosts;
  const netProfitMargin = totalInflows > 0 ? (netProfit / totalInflows) * 100 : 0;
  const grossProfitMargin = totalInflows > 0 ? (totalGrossProfit / totalInflows) * 100 : 0;

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Net Profit</h1>
        <p className="page-subtitle">Business profitability analysis</p>
      </header>
      
      {/* Key Metrics */}
      <div className="stat-grid">
        <div className="stat-card success">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(totalInflows)}</div>
          <div className="stat-change positive">
            <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
            From {state.projects.length} projects
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value">{formatCurrency(totalGrossProfit)}</div>
          <div className="stat-change">
            {grossProfitMargin.toFixed(1)}% margin
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-label">Operational Costs</div>
          <div className="stat-value">{formatCurrency(totalOperationalCosts)}</div>
          <div className="stat-change">
            <Link to="/costs" style={{ color: 'inherit', textDecoration: 'underline' }}>View breakdown →</Link>
          </div>
        </div>
        
        <div className={`stat-card ${netProfit >= 0 ? 'success' : 'error'}`}>
          <div className="stat-label">Net Profit</div>
          <div className="stat-value">{formatCurrency(netProfit)}</div>
          <div className={`stat-change ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            {netProfit >= 0 ? (
              <><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />{netProfitMargin.toFixed(1)}% margin</>
            ) : (
              <><TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />Operating at loss</>
            )}
          </div>
        </div>
      </div>
      
      {/* Profit Breakdown Visual */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Profit Breakdown</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Revenue to Gross Profit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>Total Revenue</span>
                <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>{formatCurrency(totalInflows)}</span>
              </div>
              <div className="progress-bar" style={{ height: '24px', background: 'var(--color-success-light)' }}>
                <div className="progress-fill" style={{ width: '100%', background: 'var(--color-success)' }} />
              </div>
            </div>
            
            {/* Supplier Costs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Less: Supplier Costs</span>
                <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(totalSupplierCosts)}</span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ 
                  width: totalInflows > 0 ? `${(totalSupplierCosts / totalInflows) * 100}%` : '0%',
                  background: 'var(--color-error)'
                }} />
              </div>
            </div>
            
            {/* Gross Profit Line */}
            <div style={{ 
              padding: '1rem', 
              background: 'var(--color-light-gray)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 500 }}>= Gross Profit</span>
              <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>{formatCurrency(totalGrossProfit)}</span>
            </div>
            
            {/* Fixed Costs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Less: Fixed Costs</span>
                <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(totalFixedCosts)}</span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ 
                  width: totalInflows > 0 ? `${(totalFixedCosts / totalInflows) * 100}%` : '0%',
                  background: 'var(--color-text-muted)'
                }} />
              </div>
            </div>
            
            {/* Variable Costs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Less: Variable Costs</span>
                <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(totalVariableCosts)}</span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ 
                  width: totalInflows > 0 ? `${(totalVariableCosts / totalInflows) * 100}%` : '0%',
                  background: 'var(--color-warning)'
                }} />
              </div>
            </div>
            
            {/* Net Profit Line */}
            <div style={{ 
              padding: '1.25rem', 
              background: netProfit >= 0 ? 'var(--color-success-light)' : 'var(--color-error-light)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: `2px solid ${netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'}`
            }}>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>= Net Profit</span>
              <span style={{ 
                fontWeight: 300, 
                fontSize: '1.75rem',
                fontFamily: 'Inter, sans-serif',
                color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Breakdown & Project Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Payment Type Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue Breakdown</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="stat-label">Account Payments</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(totalAccountPayments)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ 
                    width: totalInflows > 0 ? `${(totalAccountPayments / totalInflows) * 100}%` : '0%'
                  }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="stat-label">Fee Payments</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>{formatCurrency(totalFeePayments)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ 
                    width: totalInflows > 0 ? `${(totalFeePayments / totalInflows) * 100}%` : '0%',
                    background: 'var(--color-success)'
                  }} />
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="stat-label">Outstanding</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-warning)' }}>
                    {formatCurrency(Math.max(0, totalGross - totalInflows))}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/costs" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Manage Costs <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Project Profits Table */}
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
                    <th>Revenue</th>
                    <th>Supplier Costs</th>
                    <th>Gross Profit</th>
                    <th>Margin</th>
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
                        <td>
                          {project.profitMargin.toFixed(1)}%
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
                    <td style={{ fontWeight: 500 }}>
                      {grossProfitMargin.toFixed(1)}%
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
      </div>
    </div>
  );
};

export default NetProfit;
