import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Package, AlertTriangle, Users, 
  BarChart3, Layers, Loader2
} from 'lucide-react';

export default function Dashboard() {
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
    // Fetch Inventory
    const { data: inventory } = await supabase.from('inventory').select('*');
    if (inventory) {
      const total = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const low = inventory.filter(item => (item.quantity || 0) <= (item.min_stock || 0)).length;
      const value = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      
      // Fixed Category Logic
      const catMap: Record<string, number> = {};
      inventory.forEach(item => {
        const cat = item.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + (item.quantity || 0);
      });
      
      const categoryList = Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Show top 5
      
      setCategories(categoryList);
      setStats(prev => ({ ...prev, totalStock: total, lowStock: low, inventoryValue: value }));
    }

    const { count } = await supabase.from('distributors').select('*', { count: 'exact', head: true });
    setStats(prev => ({ ...prev, totalSuppliers: count || 0 }));
    setLoading(false);
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Nit-Nit Overview</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Real-time Cereal Analytics</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Units" value={stats.totalStock.toLocaleString()} icon={<Package />} color="amber" />
          <StatCard title="Stock Value" value={`KES ${stats.inventoryValue.toLocaleString()}`} icon={<TrendingUp />} color="slate" />
          <StatCard title="Low Stock" value={stats.lowStock.toString()} icon={<AlertTriangle />} color="red" />
          <StatCard title="Suppliers" value={stats.totalSuppliers.toString()} icon={<Users />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FIXED CATEGORY CHART */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase">Stock by Category</h3>
              <BarChart3 className="text-amber-500" size={24} />
            </div>
            
            <div className="space-y-6">
              {categories.length > 0 ? categories.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-slate-600 uppercase text-[10px] tracking-widest">{cat.name}</span>
                    <span className="font-black text-slate-900 text-xs">{cat.count.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(cat.count / stats.totalStock) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <p className="text-slate-400 font-bold text-center py-10">Add items to inventory to see charts.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between">
            <Layers className="text-amber-500 mb-6" size={40} />
            <h3 className="text-2xl font-black uppercase italic mb-4">Stock Health</h3>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-6">
              <p className="text-4xl font-black italic text-amber-500">{stats.lowStock === 0 ? '100%' : 'ALERT'}</p>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-2">{stats.lowStock === 0 ? 'All items stocked' : 'Restock Required'}</p>
            </div>
            <button className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-2xl hover:bg-amber-400 transition-all uppercase text-xs tracking-widest">
              Review Inventory
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
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}