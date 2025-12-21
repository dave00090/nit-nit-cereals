import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, TrendingUp, Calendar, Wallet, 
  Package, ArrowUpRight, ArrowDownRight, Loader2, Search, TrendingDown, Scale, Printer, Download
} from 'lucide-react';

export default function Reports() {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashSales: 0,
    mpesaSales: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  async function fetchSalesData() {
    setLoading(true);
    let salesQuery = supabase.from('sales').select('*').order('created_at', { ascending: false });
    let expensesQuery = supabase.from('expenses').select('*');

    const now = new Date();
    let startDate = new Date();

    if (dateRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      expensesQuery = expensesQuery.gte('expense_date', startDate.toISOString().split('T')[0]);
    } else if (dateRange === 'week') {
      startDate.setDate(now.getDate() - 7);
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      expensesQuery = expensesQuery.gte('expense_date', startDate.toISOString().split('T')[0]);
    } else if (dateRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      expensesQuery = expensesQuery.gte('expense_date', startDate.toISOString().split('T')[0]);
    }

    const [salesRes, expensesRes] = await Promise.all([salesQuery, expensesQuery]);

    if (salesRes.data && expensesRes.data) {
      setSales(salesRes.data);
      setExpenses(expensesRes.data);
      calculateStats(salesRes.data, expensesRes.data);
    }
    setLoading(false);
  }

  const calculateStats = (salesData: any[], expensesData: any[]) => {
    let revenue = 0;
    let grossProfit = 0;
    let cash = 0;
    let mpesa = 0;
    const productCounts: { [key: string]: number } = {};

    salesData.forEach(sale => {
      revenue += Number(sale.total_amount);
      if (sale.payment_method === 'Cash') cash += Number(sale.total_amount);
      if (sale.payment_method === 'M-Pesa') mpesa += Number(sale.total_amount);
      
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const itemProfit = (Number(item.selling_price) - Number(item.cost_price || 0)) * Number(item.quantity);
          grossProfit += itemProfit;
          
          // Track top products
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
      }
    });

    // Sort top products
    const sortedProducts = Object.entries(productCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    setTopProducts(sortedProducts);

    const totalExpenses = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const netProfit = grossProfit - totalExpenses;

    setStats({
      totalRevenue: revenue,
      grossProfit: grossProfit,
      totalExpenses: totalExpenses,
      netProfit: netProfit,
      cashSales: cash,
      mpesaSales: mpesa,
      totalTransactions: salesData.length
    });
  };

  // --- PDF EXPORT LOGIC ---
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = sales.map(s => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(s.created_at).toLocaleDateString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.payment_method}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">KES ${s.total_amount.toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Nit-Nit Financial Report - ${dateRange.toUpperCase()}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            .stats-grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .stat-label { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; }
            .stat-value { font-size: 20px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NIT-NIT CEREALS FINANCIAL REPORT</h1>
            <p>Report Period: ${dateRange.toUpperCase()} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">KES ${stats.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Expenses</div>
              <div class="stat-value">KES ${stats.totalExpenses.toLocaleString()}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Net Profit</div>
              <div class="stat-value">KES ${stats.netProfit.toLocaleString()}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Sales</div>
              <div class="stat-value">${stats.totalTransactions} Transactions</div>
            </div>
          </div>
          <h2>Transaction History</h2>
          <table>
            <thead><tr><th>Date</th><th>Method</th><th style="text-align: right;">Amount</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Performance Reports</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Financial Overview & Analytics</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              {(['all', 'today', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    dateRange === range ? 'bg-slate-900 text-amber-500' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button 
              onClick={handlePrintPDF}
              className="flex items-center gap-2 bg-amber-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-amber-400 transition-all"
            >
              <Printer size={16} /> Export PDF
            </button>
          </div>
        </header>

        {/* KEY STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <ReportCard title="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp />} color="slate" />
          <ReportCard title="Total Expenses" value={`KES ${stats.totalExpenses.toLocaleString()}`} icon={<TrendingDown className="text-red-500" />} color="white" />
          <ReportCard title="Gross Profit" value={`KES ${stats.grossProfit.toLocaleString()}`} icon={<Scale className="text-blue-500" />} color="white" />
          <ReportCard title="Net Profit" value={`KES ${stats.netProfit.toLocaleString()}`} icon={<ArrowUpRight />} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TOP PRODUCTS CHART AREA */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="text-amber-500" size={24} />
              <h3 className="text-lg font-black text-slate-900 uppercase italic">Best Sellers</h3>
            </div>
            <div className="space-y-6">
              {topProducts.length === 0 ? <p className="text-slate-300 font-bold text-xs">No sales data found</p> : 
                topProducts.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                    <span className="text-slate-600 truncate w-32">{p.name}</span>
                    <span className="text-slate-900">{p.qty} Sold</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-900 h-full transition-all duration-1000" 
                      style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRANSACTION TABLE */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-black text-slate-900 uppercase italic">Transaction History</h3>
              <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter">
                {stats.totalTransactions} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date/Time</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Payment</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                          sale.payment_method === 'M-Pesa' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>{sale.payment_method}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black italic text-slate-900">KES {sale.total_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon, color }: any) {
  const colors: any = { 
    slate: "bg-slate-900 text-white", 
    emerald: "bg-emerald-50 text-emerald-600",
    white: "bg-white text-slate-900"
  };
  return (
    <div className={`p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between h-32 transition-all hover:scale-[1.02] ${color === 'slate' ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <p className={`${color === 'slate' ? 'text-slate-400' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>{title}</p>
        <div className={`p-2 rounded-lg ${color === 'slate' ? 'bg-white/10 text-white' : "bg-slate-50"}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-black italic ${color === 'slate' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}