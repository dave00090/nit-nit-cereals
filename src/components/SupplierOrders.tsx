import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, Plus, CheckCircle, Clock, Package, Search, ChevronRight, Loader2 } from 'lucide-react';

export default function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('supplier_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Stock Orders</h1>
          <p className="text-slate-500 font-bold">Monitor incoming inventory from suppliers</p>
        </div>
        <button className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-amber-600 transition-all active:scale-95">
          <Plus size={20} /> NEW ORDER
        </button>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-2 flex items-center gap-2 w-full md:w-80">
          <Search className="text-slate-400" size={20} />
          <input type="text" placeholder="Search orders..." className="outline-none flex-1 text-slate-600 bg-transparent py-1 font-bold"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
        ) : (
          orders.filter(o => o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
            <div key={order.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 flex items-center justify-between hover:border-amber-500 transition-all group shadow-sm">
              <div className="flex items-center gap-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                  order.status === 'delivered' 
                    ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' 
                    : 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                }`}>
                  {order.status === 'delivered' ? <CheckCircle size={28} /> : <Clock size={28} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{order.supplier_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items_count} ITEMS</span>
                    <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                    <span className="text-sm font-black text-slate-900">KES {order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                  <p className="font-bold text-slate-700">{order.expected_date}</p>
                </div>
                <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all">
                   <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}