import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const { data: salesData } = await supabase.from('sales').select('total_amount');
      const { data: expensesData } = await supabase.from('expenses').select('amount');

      const revenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;
      const expenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

      setStats({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: revenue - expenses,
        totalSales: salesData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-slate-600">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Nit-Nit Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Net Profit"
          value={`$${stats.netProfit.toFixed(2)}`}
          icon={TrendingUp}
          color={stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <StatCard
          title="Total Expenses"
          value={`$${stats.totalExpenses.toFixed(2)}`}
          icon={TrendingUp}
          color="text-red-600"
        />
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          icon={ShoppingBag}
          color="text-blue-600"
        />
      </div>
    </div>
  );
}