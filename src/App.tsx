import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, 
  Receipt, Truck, Package, BarChart3, LogOut 
} from 'lucide-react';

// --- ALL COMPONENT IMPORTS ---
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
    <div className="w-72 bg-slate-900 min-h-screen p-6 flex flex-col sticky top-0 shadow-2xl">
      {/* BRANDING */}
      <div className="flex items-center gap-4 px-2 mb-12">
        <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
          <Package className="text-slate-900" size={24} />
        </div>
        <div>
          <span className="text-white font-black text-xl tracking-tighter uppercase block leading-none">Nit-Nit</span>
          <span className="text-amber-500 font-bold text-[10px] uppercase tracking-[0.2em]">Cereals & Shop</span>
        </div>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold group ${
                isActive 
                  ? 'bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/10 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-slate-900' : 'group-hover:text-amber-500 transition-colors'} />
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER ACTION */}
      <div className="pt-6 border-t border-slate-800/50">
        <button className="flex items-center gap-4 px-5 py-4 w-full text-slate-500 hover:text-red-400 transition-all font-bold group">
          <div className="p-2 rounded-lg group-hover:bg-red-500/10">
            <LogOut size={20} />
          </div>
          <span className="tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navigation />
        
        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="p-4 md:p-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/supplier-orders" element={<SupplierOrders />} />
              <Route path="/distributors" element={<Distributors />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}s