import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, 
  Receipt, Truck, Package, BarChart3, LogOut 
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import POS from './components/POS';
import SupplierOrders from './components/SupplierOrders';
import Distributors from './components/Distributors';
import Expenses from './components/Expenses';
import Inventory from './components/Inventory';
import Reports from './components/Reports';

function Navigation() {
  const location = useLocation();
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/supplier-orders', icon: Truck, label: 'Supplier Orders' },
    { path: '/distributors', icon: Users, label: 'Suppliers' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen p-4 flex flex-col sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-amber-500 p-2 rounded-lg">
          <Package className="text-white" size={24} />
        </div>
        <span className="text-white font-black text-xl tracking-tight uppercase leading-none">Nit-Nit Cereals</span>
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                isActive ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Navigation />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/supplier-orders" element={<SupplierOrders />} />
            <Route path="/distributors" element={<Distributors />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}