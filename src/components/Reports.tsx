import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, Wallet, Package, 
  Download, Filter, Calendar, BarChart3, PieChart
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
    
    // 1. Get Inventory Stats
    const { data: products } = await supabase.from('inventory').select('price, quantity, min_stock');
    const invValue = products?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;
    const lowStock = products?.filter(p => p.quantity <= p.min_stock).length || 0;

    // 2. Get Supplier Debt
    const { data: distributors } = await supabase.from('distributors').select('total_debt');
    const debt = distributors?.reduce((sum, d) => sum + d.total_debt, 0) || 0;

    // 3. Get Monthly Expenses
    const { data: expenses } = await supabase.from('expenses').select('amount');
    const expTotal = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    setStats({
      totalInventoryValue: invValue,
      totalSupplierDebt: debt,
      totalExpenses: expTotal,
      lowStockCount: lowStock
    });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Business Reports</h1>
            <p className="text-slate-500 font-medium">Live financial and stock analytics</p>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <Download size={18} /> Export PDF
          </button>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Inventory Value" value={`KES ${stats.totalInventoryValue.toLocaleString()}`} icon={<Package />} color="amber" />
          <StatCard title="Supplier Debt" value={`KES ${stats.totalSupplierDebt.toLocaleString()}`} icon={<TrendingDown />} color="red" />
          <StatCard title="Monthly Expenses" value={`KES ${stats.totalExpenses.toLocaleString()}`} icon={<Wallet />} color="slate" />
          <StatCard title="Low Stock Items" value={stats.lowStockCount.toString()} icon={<BarChart3 />} color="amber" />
        </div>

        {/* ANALYTICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">Expense Breakdown</h3>
              <PieChart className="text-slate-400" />
            </div>
            <div className="h-64 bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">Chart Loading...</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">Debt vs Inventory</h3>
              <TrendingUp className="text-amber-500" />
            </div>
            <div className="space-y-6">
              <ProgressBar label="Inventory Coverage" percentage={Math.min(100, (stats.totalInventoryValue / (stats.totalSupplierDebt || 1)) * 10)} color="bg-amber-500" />
              <ProgressBar label="Debt Ratio" percentage={Math.min(100, (stats.totalSupplierDebt / (stats.totalInventoryValue || 1)) * 100)} color="bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = {
    amber: "text-amber-500 bg-amber-50",
    red: "text-red-500 bg-red-50",
    slate: "text-slate-800 bg-slate-100"
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function ProgressBar({ label, percentage, color }: any) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <span className="text-sm font-black text-slate-900">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}