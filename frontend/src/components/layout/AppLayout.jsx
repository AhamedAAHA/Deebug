import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import VoiceAssistant from '../dashboard/VoiceAssistant';
import AppLiveBackdrop from './AppLiveBackdrop';
import '../../styles/layout.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppLiveBackdrop />
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <VoiceAssistant />
    </div>
  );
}
