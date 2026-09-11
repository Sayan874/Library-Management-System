import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from './services/authservice';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LibraryBooks from './pages/LibraryBooks';
import SearchBooks from './pages/SearchBooks';
import Borrow from './pages/Borrow';
import Return from './pages/Return';
import Reports from './pages/Reports';
import Members from './pages/Members';
import Staff from './pages/Staff';
import './index.css';

// Protected layout — redirects to /login if not authenticated
function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell flex min-h-screen w-full overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-72">

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6 animate-in fade-in duration-500">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<LibraryBooks />} />
          <Route path="/search" element={<SearchBooks />} />
          <Route path="/borrow" element={<Borrow />} />
          <Route path="/return" element={<Return />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/members" element={<Members />} />
          <Route path="/staff" element={<Staff />} />
        </Route>
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
