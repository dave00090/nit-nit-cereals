import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Truck, Plus, CheckCircle, Clock, 
  Package, Search, ChevronRight, Loader2,
  Calendar, DollarSign, Tag
} from 'lucide-react';

export default function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              Stock Orders
            </h1>
            <p className="text-slate-500 font-bold">Manage and track incoming supply shipments</p>
          </div>
          
          <button className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95">
            <Plus size={20} strokeWidth={3} />
            CREATE NEW ORDER
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-8">
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 w-full md:w-96 focus-within:border-amber-500 transition-all">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search supplier or item..." 
              className="outline-none flex-1 text-slate-700 bg-transparent font-bold placeholder:text-slate-300"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Orders...</p>
            </div>
          ) : (
            orders
              .filter(o => o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(order => (
                <div 
                  key={order.id} 
                  className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-amber-500 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    {/* STATUS ICON */}
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      order.status === 'delivered' 
                        ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' 
                        : 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle size={32} /> : <Clock size={32} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">
                          {order.supplier_name}
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide">
                          <Package size={14} className="text-amber-500" />
                          {order.items_count} Varieties
                        </span>
                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                        <span className="flex items-center gap-1.5 text-slate-900 text-sm font-black italic">
                          KES {order.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SECTION: DATE & ACTION */}
                  <div className="flex items-center justify-between md:justify-end gap-10 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-none border-slate-50">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Expected By</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Calendar size={16} className="text-amber-500" />
                        {new Date(order.expected_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-lg shadow-slate-900/20">
                      <ChevronRight size={24} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))
          )}

          {!loading && orders.length === 0 && (
            <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center">
              <Truck className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-400 font-black uppercase tracking-widest">No active orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}