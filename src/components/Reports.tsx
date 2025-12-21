import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, TrendingUp, Calendar, Wallet, 
  Package, ArrowUpRight, ArrowDownRight, Loader2, Search
} from 'lucide-react';

export default function Reports() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    cashSales: 0,
    mpesaSales: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  async function fetchSalesData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSales(data);
      calculateStats(data);
    }
    setLoading(false);
  }

  const calculateStats = (salesData: any[]) => {
    let revenue = 0;
    let profit = 0;
    let cash = 0;
    let mpesa = 0;

    salesData.forEach(sale => {
      revenue += Number(sale.total_amount);
      if (sale.payment_method === 'Cash') cash += Number(sale.total_amount);
      if (sale.payment_method === 'M-Pesa') mpesa += Number(sale.total_amount);
      
      // Calculate profit from items array
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const itemProfit = (Number(item.selling_price) - Number(item.cost_price)) * Number(item.quantity);
          profit += itemProfit;
        });
      }
    });

    setStats({
      totalRevenue: revenue,
      totalProfit: profit,
      cashSales: cash,
      mpesaSales: mpesa,
      totalTransactions: salesData.length
    });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Performance Reports</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Financial Overview & Analytics</p>
        </header>

        {/* KEY STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <ReportCard title="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp />} color="slate" />
          <ReportCard title="Estimated Profit" value={`KES ${stats.totalProfit.toLocaleString()}`} icon={<ArrowUpRight />} color="emerald" />
          <ReportCard title="M-Pesa Total" value={`KES ${stats.mpesaSales.toLocaleString()}`} icon={<Wallet />} color="amber" />
          <ReportCard title="Transactions" value={stats.totalTransactions.toString()} icon={<Package />} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* RECENT TRANSACTIONS */}
          <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Recent Transactions</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search sales..." className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none text-sm font-bold outline-none focus:ring-2 ring-amber-500/20" />
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date/Time</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Items Sold</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Payment</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {sale.items?.map((item: any, i: number) => (
                          <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-600 uppercase">
                            {item.name} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        sale.payment_method === 'M-Pesa' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black italic text-slate-900">
                      KES {sale.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon, color }: any) {
  const colors: any = { 
    amber: "bg-amber-50 text-amber-500", 
    slate: "bg-slate-900 text-white", 
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-500"
  };
  return (
    <div className={`p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between h-32 transition-all hover:scale-[1.02] ${color === 'slate' ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <p className={`${color === 'slate' ? 'text-slate-400' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>{title}</p>
        <div className={`p-2 rounded-lg ${color === 'slate' ? 'bg-white/10 text-white' : colors[color]}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-black italic ${color === 'slate' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}