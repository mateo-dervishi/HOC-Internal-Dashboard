import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PoundSterling, Receipt, Settings } from 'lucide-react';
import { SyncButton } from './SyncButton';

const Layout = () => {
  return (
    <div className="app-container">
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">House of Clarence</div>
          <div className="sidebar-tagline">Internal Operations</div>
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard />
            <span>Overview</span>
          </NavLink>
          
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FolderKanban />
            <span>Projects</span>
          </NavLink>
          
          <NavLink to="/costs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Receipt />
            <span>Costs</span>
          </NavLink>
          
          <NavLink to="/profit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PoundSterling />
            <span>Net Profit</span>
          </NavLink>
          
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings />
            <span>Settings</span>
          </NavLink>
        </nav>
        
        {/* Sync Button at bottom of sidebar */}
        <div style={{ 
          padding: '1rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <SyncButton />
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

