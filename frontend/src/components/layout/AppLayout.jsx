import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AppLiveBackdrop from './AppLiveBackdrop';
import VoiceAssistant from '../dashboard/VoiceAssistant';
import '../../styles/layout.css';

const HEAVY_WEBGL_ROUTES = ['/upload', '/visualization'];

export default function AppLayout() {
  const { pathname } = useLocation();
  const showLiveBackdrop = !HEAVY_WEBGL_ROUTES.some((p) => pathname.startsWith(p));

  return (
    <>
      <div className="app-shell">
        {showLiveBackdrop && <AppLiveBackdrop />}
        <Sidebar />
        <div className="app-main">
          <Header />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
      <VoiceAssistant />
    </>
  );
}
