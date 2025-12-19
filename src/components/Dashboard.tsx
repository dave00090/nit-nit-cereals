import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalSales: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalSales: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount, created_at, sale_number, customer_name')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', today.toISOString().split('T')[0]);

      const { data: allSalesData } = await supabase
        .from('sales')
        .select('total_amount');

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('current_stock', { ascending: true });

      const totalRevenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0) || 0;
      const totalSales = salesData?.length || 0;

      const lowStock = productsData?.filter(p => p.current_stock <= p.reorder_level) || [];

      setStats({
        totalRevenue,
        totalExpenses,
        totalSales,
        lowStockCount: lowStock.length,
      });

      setLowStockProducts(lowStock.slice(0, 5));
      setRecentSales(salesData?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 KSh{color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center KSh{color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 KSh{color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`KShKSh{stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          subtitle="Total sales today"
        />
        <StatCard
          title="Today's Sales"
          value={stats.totalSales}
          icon={ShoppingBag}
          color="text-blue-600"
          subtitle="Transactions completed"
        />
        <StatCard
          title="Today's Expenses"
          value={`KShKSh{stats.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-600"
          subtitle="Total spent today"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="text-orange-600"
          subtitle="Need reorder"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-orange-600" />
            Low Stock Alert
          </h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">All products are well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-600">
                      Current: {product.current_stock} {product.unit} | Reorder at: {product.reorder_level} {product.unit}
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
            Recent Sales
          </h3>
          {recentSales.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales yet today</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.sale_number} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{sale.sale_number}</p>
                    <p className="text-sm text-slate-600">
                      {sale.customer_name || 'Walk-in Customer'} • {new Date(sale.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600">KSh{parseFloat(sale.total_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Net Profit Today</h3>
        <p className="text-4xl font-bold">KSh{(stats.totalRevenue - stats.totalExpenses).toFixed(2)}</p>
        <p className="text-sm opacity-90 mt-2">Revenue minus expenses</p>
      </div>
    </div>
  );
}
