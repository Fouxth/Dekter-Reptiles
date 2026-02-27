import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Customers from './pages/Customers';
import SnakeDetail from './pages/SnakeDetail';
import Breeding from './pages/Breeding';
import Incubation from './pages/Incubation';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';
import './App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-fullscreen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="categories" element={<Categories />} />
        <Route path="stock" element={<Stock />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="snakes" element={<Navigate to="/inventory" replace />} />
        <Route path="snakes/:id" element={<SnakeDetail />} />
        <Route path="breeding" element={<Breeding />} />
        <Route path="incubation" element={<Incubation />} />
        <Route path="reports" element={<Reports />} />
        <Route path="expenses" element={<Expenses />} />
        <Route
          path="users"
          element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute adminOnly>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'Prompt, sans-serif'
          }
        }} />
      </AuthProvider>
    </Router>
  );
}

export default App;
