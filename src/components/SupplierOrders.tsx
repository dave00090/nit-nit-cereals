import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Truck, Plus, CheckCircle, Clock, Search, 
  ChevronRight, Loader2, X, Calendar, Package 
} from 'lucide-react';

export default function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newOrder, setNewOrder] = useState({
    supplier_name: '',
    items_count: 0,
    total_amount: 0,
    expected_date: '',
    status: 'pending'
  });

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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('supplier_orders').insert([newOrder]);
    if (!error) {
      setIsFormOpen(false);
      fetchOrders();
      setNewOrder({ 
        supplier_name: '', 
        items_count: 0, 
        total_amount: 0, 
        expected_date: '', 
        status: 'pending' 
      });
    } else {
      alert("Error creating order: " + error.message);
    }
    setLoading(false);
  };

  const toggleStatus = async (order: any) => {
    const newStatus = order.status === 'pending' ? 'delivered' : 'pending';
    
    const { error } = await supabase
      .from('supplier_orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (!error) {
      if (newStatus === 'delivered') {
        const confirmStock = confirm(
          `Order from ${order.supplier_name} marked as DELIVERED.\n\nWould you like to head to the Inventory page to add these ${order.items_count} units to your stock?`
        );
        if (confirmStock) {
          window.location.href = '/inventory';
        }
      }
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Stock Orders</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Inbound Supply Chain</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            NEW STOCK ORDER
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-8">
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 w-full md:w-96 focus-within:border-amber-500 transition-all">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by supplier..." 
              className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
          ) : (
            orders
              .filter(o => o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-amber-500 transition-all group shadow-sm">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => toggleStatus(order)}
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${
                        order.status === 'delivered' 
                          ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' 
                          : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white'
                      }`}
                    >
                      {order.status === 'delivered' ? <CheckCircle size={32} /> : <Clock size={32} />}
                    </button>
                    <div>
                      <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">{order.supplier_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items_count} Units</span>
                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                        <span className="text-sm font-black text-slate-900 italic">KES {order.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-10 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-none">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Expected Arrival</p>
                      <p className="font-black text-slate-700 flex items-center gap-2">
                        <Calendar size={16} className="text-amber-500"/> {order.expected_date}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500">
                      <ChevronRight size={20} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* NEW ORDER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Record Order</h2>
              <button onClick={() => setIsFormOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={newOrder.supplier_name} onChange={e => setNewOrder({...newOrder, supplier_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity (Units)</label>
                  <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    value={newOrder.items_count} onChange={e => setNewOrder({...newOrder, items_count: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total KES</label>
                  <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    value={newOrder.total_amount} onChange={e => setNewOrder({...newOrder, total_amount: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Delivery</label>
                <input required type="date" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={newOrder.expected_date} onChange={e => setNewOrder({...newOrder, expected_date: e.target.value})} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Stock Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}