import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import BoqPage from './pages/BoqPage';
import VisualizationPage from './pages/VisualizationPage';
import CostEstimationPage from './pages/CostEstimationPage';
import RevisionPage from './pages/RevisionPage';
import QuotationPage from './pages/QuotationPage';
import SustainabilityPage from './pages/SustainabilityPage';
import SiteProgressPage from './pages/SiteProgressPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/boq" element={<BoqPage />} />
        <Route path="/visualization" element={<VisualizationPage />} />
        <Route path="/cost" element={<CostEstimationPage />} />
        <Route path="/revision" element={<RevisionPage />} />
        <Route path="/quotation" element={<QuotationPage />} />
        <Route path="/sustainability" element={<SustainabilityPage />} />
        <Route path="/site-progress" element={<SiteProgressPage />} />
      </Route>
    </Routes>
  );
}
