import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardProvider } from './context/DashboardContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NetProfit from './pages/NetProfit';
import OperationalCosts from './pages/OperationalCosts';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="profit" element={<NetProfit />} />
            <Route path="costs" element={<OperationalCosts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;
