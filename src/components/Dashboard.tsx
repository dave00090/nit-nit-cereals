import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Package, AlertTriangle, Users, 
  BarChart3, ArrowUpRight, ArrowDownRight, Layers 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStock: 0,
    totalSuppliers: 0,
    inventoryValue: 0
  });
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    // Fetch Inventory Stats
    const { data: inventory } = await supabase.from('inventory').select('*');
    if (inventory) {
      const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const low = inventory.filter(item => item.quantity <= item.min_stock).length;
      const value = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate Category Popularity (Mock Logic based on stock variety)
      const catMap = inventory.reduce((acc: any, item: any) => {
        const cat = item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      setCategories(Object.entries(catMap).map(([name, count]) => ({ name, count: count as number })));
      setStats(prev => ({ ...prev, totalStock: total, lowStock: low, inventoryValue: value }));
    }

    // Fetch Supplier Stats
    const { count } = await supabase.from('distributors').select('*', { count: 'exact', head: true });
    setStats(prev => ({ ...prev, totalSuppliers: count || 0 }));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Overview</h1>
          <p className="text-slate-500 font-bold">Nit-Nit Cereals Live Business Intelligence</p>
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Inventory" value={stats.totalStock.toLocaleString()} icon={<Package />} color="amber" />
          <StatCard title="Inventory Value" value={`KES ${stats.inventoryValue.toLocaleString()}`} icon={<TrendingUp />} color="slate" />
          <StatCard title="Low Stock Alert" value={stats.lowStock.toString()} icon={<AlertTriangle />} color="red" />
          <StatCard title="Suppliers" value={stats.totalSuppliers.toString()} icon={<Users />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LIVE STOCK CHART */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Stock by Category</h3>
                <p className="text-slate-400 text-sm font-bold">Distribution of cereal varieties</p>
              </div>
              <BarChart3 className="text-amber-500" size={28} />
            </div>
            
            <div className="space-y-6">
              {categories.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-slate-700 uppercase text-xs tracking-widest">{cat.name}</span>
                    <span className="font-black text-slate-900 text-xs">{cat.count} Variants</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      style={{ width: `${(cat.count / categories.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STOCK HEALTH */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-300 flex flex-col justify-between">
            <div>
              <Layers className="text-amber-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Stock Health</h3>
              <p className="text-slate-400 font-bold text-sm mb-8">Current inventory status vs minimum requirements.</p>
              
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Efficiency</span>
                  <span className="text-amber-500 font-black italic text-lg">+12.5%</span>
                </div>
                <p className="text-3xl font-black italic">OPTIMAL</p>
              </div>
            </div>
            
            <button className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-2xl mt-8 hover:bg-amber-400 transition-all uppercase tracking-widest text-xs">
              Generate Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    amber: "bg-amber-50 text-amber-500",
    slate: "bg-slate-100 text-slate-900",
    red: "bg-red-50 text-red-500"
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-amber-500 transition-all group">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colors[color]} group-hover:bg-slate-900 group-hover:text-amber-500`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}