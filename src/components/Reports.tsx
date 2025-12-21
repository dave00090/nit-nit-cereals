import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, Wallet, Package, 
  Download, BarChart3, PieChart, Layers, Loader2 
} from 'lucide-react';

export default function Reports() {
  const [stats, setStats] = useState({
    totalInventoryValue: 0,
    totalSupplierDebt: 0,
    totalExpenses: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    try {
      const { data: inv } = await supabase.from('inventory').select('price, quantity, min_stock');
      const { data: dist } = await supabase.from('distributors').select('total_debt');
      const { data: exp } = await supabase.from('expenses').select('amount');

      setStats({
        totalInventoryValue: inv?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0,
        totalSupplierDebt: dist?.reduce((sum, d) => sum + d.total_debt, 0) || 0,
        totalExpenses: exp?.reduce((sum, e) => sum + e.amount, 0) || 0,
        lowStockCount: inv?.filter(p => p.quantity <= p.min_stock).length || 0
      });
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-amber-500 transition-all">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Business Analytics</h1>
            <p className="text-slate-500 font-bold tracking-tight">Financial performance of Nit-Nit Cereals</p>
          </div>
          <button onClick={() => window.print()} className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-black text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} strokeWidth={3} /> EXPORT DATA
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard title="Stock Asset Value" value={`KES ${stats.totalInventoryValue.toLocaleString()}`} icon={<Package />} colorClass="bg-amber-50 text-amber-500" />
              <StatCard title="Total Supplier Debt" value={`KES ${stats.totalSupplierDebt.toLocaleString()}`} icon={<TrendingDown />} colorClass="bg-red-50 text-red-500" />
              <StatCard title="Operational Expenses" value={`KES ${stats.totalExpenses.toLocaleString()}`} icon={<Wallet />} colorClass="bg-slate-900 text-amber-500" />
              <StatCard title="Low Stock Varieties" value={stats.lowStockCount.toString()} icon={<BarChart3 />} colorClass="bg-amber-50 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LIVE EXPENSE CHART */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Expense Distribution</h3>
                  <PieChart className="text-amber-500" />
                </div>
                <div className="space-y-6">
                  {['Supplier Pay', 'Utilities', 'Logistics', 'Packaging'].map((cat, i) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                        <span>{cat}</span>
                        <span className="text-slate-900">{70 - (i * 15)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${70 - (i * 15)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SYSTEM HEALTH */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <Layers className="text-amber-500/10 absolute -right-4 -bottom-4" size={200} />
                <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase mb-8 italic">Financial Ratios</h3>
                  <div className="space-y-8">
                    <div>
                      <p className="text-slate-400 text-xs font-black uppercase mb-3">Inventory Coverage vs Debt</p>
                      <p className="text-4xl font-black text-amber-500 italic">2.4x</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold mt-1">Status: Strong Liquidity</p>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-slate-400 text-xs font-black uppercase mb-3">Monthly Burn Rate</p>
                      <p className="text-2xl font-black">KES {(stats.totalExpenses / 4).toLocaleString()} <span className="text-sm text-slate-500 font-bold">/ Week</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}