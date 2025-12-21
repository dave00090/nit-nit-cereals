import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Receipt, 
  Truck, 
  LogOut 
} from 'lucide-react';

// Import your pages/components
import Dashboard from './pages/Dashboard';
import POS from './components/POS';
import Products from './pages/Products';
import Distributors from './pages/Distributors';
import Expenses from './pages/Expenses';
import SupplierOrders from './components/SupplierOrders';

// This sub-component creates the Sidebar menu internally
function Navigation() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { path: '/products', icon: Package, label: 'Inventory' },
    { path: '/supplier-orders', icon: Truck, label: 'Supplier Orders' },
    { path: '/distributors', icon: Users, label: 'Suppliers' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen p-4 flex flex-col sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-amber-500 p-2 rounded-lg">
          <Package className="text-white" size={24} />
        </div>
        <span className="text-white font-black text-xl tracking-tight uppercase">Nit-Nit Cereals</span>
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
                isActive 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors font-bold text-left">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// MAIN APP COMPONENT
export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        {/* Navigation Sidebar */}
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/supplier-orders" element={<SupplierOrders />} />
            <Route path="/distributors" element={<Distributors />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}