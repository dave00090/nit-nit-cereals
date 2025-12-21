import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, Plus, CheckCircle, Clock, Search, ChevronRight, Loader2, X, Calendar, AlertCircle } from 'lucide-react';

export default function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    supplier_name: '',
    items_count: 0,
    total_amount: 0,
    expected_date: '',
    status: 'pending'
  });

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from('supplier_orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'delivered' : 'pending';
    const { error } = await supabase.from('supplier_orders').update({ status: nextStatus }).eq('id', id);
    if (!error) fetchOrders();
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('supplier_orders').insert([newOrder]);
    if (!error) {
      setIsFormOpen(false);
      fetchOrders();
      setNewOrder({ supplier_name: '', items_count: 0, total_amount: 0, expected_date: '', status: 'pending' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Stock Orders</h1>
          <p className="text-slate-500 font-bold">Inbound supply chain tracking</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all">
          <Plus size={20} strokeWidth={3} /> NEW ORDER
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-amber-500 transition-all group">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => toggleStatus(order.id, order.status)}
                className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' : 'bg-amber-50 text-amber-500 hover:bg-amber-100'}`}
              >
                {order.status === 'delivered' ? <CheckCircle size={28} /> : <Clock size={28} />}
              </button>
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{order.supplier_name}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{order.items_count} Varieties • KES {order.total_amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Expected Delivery</p>
                <p className="font-black text-slate-700 italic flex items-center gap-2"><Calendar size={16} className="text-amber-500"/> {order.expected_date}</p>
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-amber-500" />
            </div>
          </div>
        ))}
      </div>

      {/* NEW ORDER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Place Stock Order</h2>
              <button onClick={() => setIsFormOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  onChange={e => setNewOrder({...newOrder, supplier_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variety Count</label>
                  <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    onChange={e => setNewOrder({...newOrder, items_count: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total (KES)</label>
                  <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    onChange={e => setNewOrder({...newOrder, total_amount: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Delivery Date</label>
                <input required type="date" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  onChange={e => setNewOrder({...newOrder, expected_date: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Create Order Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}