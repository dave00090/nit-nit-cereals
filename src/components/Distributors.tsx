import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Pencil, Trash2, X, Check, Loader2, 
  Phone, MapPin, User, Search, History, Package, RefreshCw, TrendingUp 
} from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
}

interface Distributor {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  recent_orders?: Order[];
  total_spend?: number; // New Stat
}

export default function Distributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', contact_person: '', phone: '', address: ''
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  async function fetchDistributors() {
    setLoading(true);
    // Fetches distributors and ALL their supplier orders to calculate total spend
    const { data, error } = await supabase
      .from('distributors')
      .select(`
        *,
        supplier_orders(id, created_at, total_amount)
      `)
      .order('name');
    
    if (data) {
      const formattedData = data.map((d: any) => ({
        ...d,
        recent_orders: d.supplier_orders.slice(0, 3), // Last 3 for history
        total_spend: d.supplier_orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
      }));
      setDistributors(formattedData);
    }
    setLoading(false);
  }

  const filteredDistributors = distributors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (distributor?: Distributor) => {
    if (distributor) {
      setEditingId(distributor.id);
      setFormData({
        name: distributor.name, contact_person: distributor.contact_person,
        phone: distributor.phone, address: distributor.address
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', contact_person: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      await supabase.from('distributors').update(formData).eq('id', editingId);
    } else {
      await supabase.from('distributors').insert([formData]);
    }
    setIsModalOpen(false);
    await fetchDistributors();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-slate-500">Analytics and management for {distributors.length} partners</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search partners..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 active:scale-95"
          >
            <UserPlus size={18} /> Add New
          </button>
        </div>
      </div>

      {/* DISTRIBUTORS GRID */}
      {loading && distributors.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDistributors.map((dist) => (
            <div key={dist.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:border-amber-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="bg-slate-900 p-3.5 rounded-2xl text-white shadow-lg shadow-slate-200">
                    <Package size={24} />
                  </div>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => openModal(dist)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-all">
                      <Pencil size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{dist.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><User size={14} /></div>
                      <span className="font-bold">{dist.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                      <span className="font-medium">{dist.phone}</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL SPEND BADGE */}
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white p-2 rounded-xl"><TrendingUp size={16} /></div>
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Total Spend</span>
                  </div>
                  <span className="text-xl font-black text-green-700">KES {dist.total_spend?.toLocaleString()}</span>
                </div>
              </div>

              {/* RECENT ORDERS AREA */}
              <div className="bg-slate-50/50 p-8 flex-1 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <History size={12} /> Last Deliveries
                  </div>
                  <button 
                    onClick={() => alert(`Starting re-order from ${dist.name}`)}
                    className="text-[10px] font-bold bg-white text-amber-600 border border-amber-200 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                  >
                    <RefreshCw size={10} /> Re-order
                  </button>
                </div>
                
                <div className="space-y-2">
                  {dist.recent_orders?.length ? dist.recent_orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/50 text-xs shadow-sm shadow-slate-100/50">
                      <span className="font-bold text-slate-500">{new Date(order.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                      <span className="font-black text-slate-900">KES {order.total_amount.toLocaleString()}</span>
                    </div>
                  )) : <p className="text-xs text-slate-300 italic text-center py-2">No previous orders found</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL IS THE SAME AS PREVIOUS VERSION */}
      {/* ... [Keeping same modal code] ... */}
    </div>
  );
}