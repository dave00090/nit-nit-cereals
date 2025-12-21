import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for button navigation
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Package, AlertTriangle, Users, 
  BarChart3, Layers, Loader2
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate(); // Hook to handle the button click
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStock: 0,
    totalSuppliers: 0,
    inventoryValue: 0
  });
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*');

      if (prodError) throw prodError;

      if (products && products.length > 0) {
        let totalUnits = 0;
        let totalVal = 0;
        let lowCount = 0;
        const catMap: Record<string, number> = {};

        products.forEach(item => {
          const qty = Number(item.current_stock || 0);
          const price = Number(item.selling_price || 0);
          const min = Number(item.reorder_level || 0);
          const category = item.unit || 'General';

          totalUnits += qty;
          totalVal += (qty * price);
          
          // CRITICAL: Accurate Low Stock Logic
          if (qty <= min) {
            lowCount++;
          }

          catMap[category] = (catMap[category] || 0) + qty;
        });

        const categoryList = Object.entries(catMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setCategories(categoryList);
        setStats(prev => ({
          ...prev,
          totalStock: totalUnits,
          inventoryValue: totalVal,
          lowStock: lowCount
        }));
      }

      const { count } = await supabase
        .from('distributors')
        .select('*', { count: 'exact', head: true });
      
      setStats(prev => ({ ...prev, totalSuppliers: count || 0 }));

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Nit-Nit Overview</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Business Intelligence Dashboard</p>
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Stock" value={stats.totalStock.toLocaleString()} icon={<Package />} color="amber" />
          <StatCard title="Total Valuation" value={`KES ${stats.inventoryValue.toLocaleString()}`} icon={<TrendingUp />} color="slate" />
          <StatCard title="Reorder Alerts" value={stats.lowStock.toString()} icon={<AlertTriangle />} color="red" />
          <StatCard title="Active Suppliers" value={stats.totalSuppliers.toString()} icon={<Users />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CATEGORY CHART */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Stock by Unit Type</h3>
              <BarChart3 className="text-amber-500" size={24} />
            </div>
            
            <div className="space-y-6">
              {categories.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-slate-600 uppercase text-[10px] tracking-widest">{cat.name}</span>
                    <span className="font-black text-slate-900 text-xs">{cat.count.toLocaleString()} units</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${stats.totalStock > 0 ? (cat.count / stats.totalStock) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STOCK HEALTH - FIXED LOGIC & BUTTON */}
          <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${stats.lowStock > 0 ? 'bg-slate-900' : 'bg-emerald-900'}`}>
             <div className="relative z-10">
              <Layers className={`${stats.lowStock > 0 ? 'text-amber-500' : 'text-emerald-400'} mb-6`} size={40} />
              <h3 className="text-2xl font-black uppercase italic mb-4">Stock Health</h3>
              
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-6">
                <p className={`text-4xl font-black italic ${stats.lowStock > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                  {stats.lowStock > 0 ? 'ACTION' : 'GOOD'}
                </p>
                <p className="text-slate-400 font-bold text-[10px] uppercase mt-2">
                  {stats.lowStock > 0 
                    ? `${stats.lowStock} items need reorder` 
                    : 'All inventory levels are optimal'}
                </p>
              </div>
            </div>

            {/* FIXED BUTTON: Navigates to Inventory */}
            <button 
              onClick={() => navigate('/inventory')}
              className={`relative z-10 w-full py-4 font-black rounded-2xl transition-all uppercase text-xs tracking-widest shadow-lg ${
                stats.lowStock > 0 
                ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' 
                : 'bg-emerald-500 text-white hover:bg-emerald-400'
              }`}
            >
              Update Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { amber: "bg-amber-50 text-amber-500", slate: "bg-slate-100 text-slate-900", red: "bg-red-50 text-red-500" };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:border-amber-500">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}