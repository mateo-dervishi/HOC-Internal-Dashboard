import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PoundSterling, Settings } from 'lucide-react';

const Layout = () => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">House of Clarence</div>
          <div className="sidebar-tagline">Internal Dashboard</div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard />
            <span>Overview</span>
          </NavLink>
          
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FolderKanban />
            <span>Projects</span>
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
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

