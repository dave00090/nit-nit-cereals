import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package, Calendar, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalSales: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByCategory: Array<{ category: string; count: number; revenue: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  dailySales: Array<{ date: string; revenue: number; count: number }>;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalSales: 0,
    topProducts: [],
    salesByCategory: [],
    expensesByCategory: [],
    dailySales: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReportData();
  }, [dateRange, startDate, endDate]);

  const getDateFilter = () => {
    const now = new Date();
    let filterDate = new Date();

    if (dateRange === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === 'year') {
      filterDate.setFullYear(now.getFullYear() - 1);
    } else {
      return null;
    }

    return filterDate.toISOString();
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();
      let salesQuery = supabase.from('sales').select('*');
      let expensesQuery = supabase.from('expenses').select('*');

      if (dateFilter) {
        salesQuery = salesQuery.gte('created_at', dateFilter);
        expensesQuery = expensesQuery.gte('expense_date', dateFilter.split('T')[0]);
      }

      if (startDate && endDate) {
        salesQuery = salesQuery.gte('created_at', startDate).lte('created_at', endDate);
        expensesQuery = expensesQuery.gte('expense_date', startDate).lte('expense_date', endDate);
      }

      const { data: salesData } = await salesQuery;
      const { data: expensesData } = await expensesQuery;

      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('*, products(category)')
        .in(
          'sale_id',
          salesData?.map((s) => s.id) || []
        );

      const totalRevenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const totalSales = salesData?.length || 0;

      const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
      saleItemsData?.forEach((item) => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product_name].quantity += parseFloat(item.quantity.toString());
        productSales[item.product_name].revenue += parseFloat(item.subtotal.toString());
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const categorySales: { [key: string]: { count: number; revenue: number } } = {};
      saleItemsData?.forEach((item: any) => {
        const category = item.products?.category || 'Unknown';
        if (!categorySales[category]) {
          categorySales[category] = { count: 0, revenue: 0 };
        }
        categorySales[category].count += 1;
        categorySales[category].revenue += parseFloat(item.subtotal.toString());
      });

      const salesByCategory = Object.entries(categorySales).map(([category, data]) => ({
        category,
        ...data,
      }));

      const expensesByCategory: { [key: string]: number } = {};
      expensesData?.forEach((expense) => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += parseFloat(expense.amount.toString());
      });

      const expensesByCategoryArray = Object.entries(expensesByCategory).map(([category, total]) => ({
        category,
        total,
      }));

      const dailySalesMap: { [key: string]: { revenue: number; count: number } } = {};
      salesData?.forEach((sale) => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        if (!dailySalesMap[date]) {
          dailySalesMap[date] = { revenue: 0, count: 0 };
        }
        dailySalesMap[date].revenue += parseFloat(sale.total_amount.toString());
        dailySalesMap[date].count += 1;
      });

      const dailySales = Object.entries(dailySalesMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setReportData({
        totalRevenue,
        totalExpenses,
        netProfit,
        totalSales,
        topProducts,
        salesByCategory,
        expensesByCategory: expensesByCategoryArray,
        dailySales,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    let csv = 'Financial Report\n\n';
    csv += `Period: ${dateRange}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += 'Summary\n';
    csv += `Total Revenue,$${reportData.totalRevenue.toFixed(2)}\n`;
    csv += `Total Expenses,$${reportData.totalExpenses.toFixed(2)}\n`;
    csv += `Net Profit,$${reportData.netProfit.toFixed(2)}\n`;
    csv += `Total Sales,${reportData.totalSales}\n\n`;

    csv += 'Top Products\n';
    csv += 'Product,Quantity Sold,Revenue\n';
    reportData.topProducts.forEach((product) => {
      csv += `${product.name},${product.quantity},$${product.revenue.toFixed(2)}\n`;
    });

    csv += '\nSales by Category\n';
    csv += 'Category,Items Sold,Revenue\n';
    reportData.salesByCategory.forEach((cat) => {
      csv += `${cat.category},${cat.count},$${cat.revenue.toFixed(2)}\n`;
    });

    csv += '\nExpenses by Category\n';
    csv += 'Category,Total\n';
    reportData.expensesByCategory.forEach((cat) => {
      csv += `${cat.category},$${cat.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Date Range:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${reportData.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          subtitle={`${reportData.totalSales} sales`}
        />
        <StatCard
          title="Total Expenses"
          value={`$${reportData.totalExpenses.toFixed(2)}`}
          icon={TrendingUp}
          color="text-red-600"
          subtitle="All categories"
        />
        <StatCard
          title="Net Profit"
          value={`$${reportData.netProfit.toFixed(2)}`}
          icon={TrendingUp}
          color={reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
          subtitle="Revenue - Expenses"
        />
        <StatCard
          title="Total Sales"
          value={reportData.totalSales}
          icon={ShoppingBag}
          color="text-blue-600"
          subtitle="Transactions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-amber-600" />
            Top Selling Products
          </h3>
          {reportData.topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales data available</p>
          ) : (
            <div className="space-y-3">
              {reportData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <p className="text-sm text-slate-600">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">${product.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
            Sales by Category
          </h3>
          {reportData.salesByCategory.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales data available</p>
          ) : (
            <div className="space-y-3">
              {reportData.salesByCategory.map((category) => (
                <div key={category.category} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{category.category}</span>
                    <span className="font-semibold text-green-600">${category.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{category.count} items sold</span>
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: `${(category.revenue / reportData.totalRevenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-red-600" />
            Expenses by Category
          </h3>
          {reportData.expensesByCategory.length === 0 ? (
            <p className="text-slate-500 text-sm">No expense data available</p>
          ) : (
            <div className="space-y-3">
              {reportData.expensesByCategory.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">{category.category}</span>
                  <span className="font-semibold text-red-600">${category.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-600" />
            Daily Sales Trend
          </h3>
          {reportData.dailySales.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales data available</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {reportData.dailySales.slice(-10).map((day) => (
                <div key={day.date} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(day.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-600">{day.count} sales</p>
                  </div>
                  <span className="font-semibold text-green-600">${day.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm opacity-90 mb-1">Profit Margin</p>
            <p className="text-3xl font-bold">
              {reportData.totalRevenue > 0
                ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1)
                : '0'}
              %
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Average Sale Value</p>
            <p className="text-3xl font-bold">
              ${reportData.totalSales > 0 ? (reportData.totalRevenue / reportData.totalSales).toFixed(2) : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold">{reportData.totalSales}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
