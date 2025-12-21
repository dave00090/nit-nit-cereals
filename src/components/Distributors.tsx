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
  total_spend?: number;
}

export default function Distributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  async function fetchDistributors() {
    setLoading(true);
    const { data } = await supabase
      .from('distributors')
      .select(`
        *,
        supplier_orders(id, created_at, total_amount)
      `)
      .order('name');
    
    if (data) {
      const formattedData = data.map((d: any) => ({
        ...d,
        recent_orders: d.supplier_orders?.slice(0, 3) || [],
        total_spend: d.supplier_orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
      }));
      setDistributors(formattedData);
    }
    setLoading(false);
  }

  // --- MODAL CONTROLS ---
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', contact_person: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (dist: Distributor) => {
    setEditingId(dist.id);
    setFormData({
      name: dist.name,
      contact_person: dist.contact_person,
      phone: dist.phone,
      address: dist.address
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update Existing
        await supabase.from('distributors').update(formData).eq('id', editingId);
      } else {
        // Insert New
        await supabase.from('distributors').insert([formData]);
      }
      setIsModalOpen(false);
      await fetchDistributors();
    } catch (err) {
      console.error(err);
      alert("Failed to save distributor details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this distributor?")) return;
    await supabase.from('distributors').delete().eq('id', id);
    fetchDistributors();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-slate-500">Manage partners and view order history</p>
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
            onClick={handleAddNew}
            className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={18} /> Add New
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors
          .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((dist) => (
            <div key={dist.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="bg-slate-900 p-3.5 rounded-2xl text-white">
                    <Package size={24} />
                  </div>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => handleEdit(dist)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(dist.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{dist.name}</h3>
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                      <User size={14} className="text-amber-500" /> {dist.contact_person}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Phone size={14} className="text-slate-300" /> {dist.phone}
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Total Spend</span>
                  </div>
                  <span className="text-xl font-black text-green-700">KES {dist.total_spend?.toLocaleString()}</span>
                </div>
              </div>

              {/* FOOTER ORDERS */}
              <div className="bg-slate-50/50 p-8 pt-6 border-t border-slate-100 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <History size={12}/> Recent Orders
                  </span>
                  <button className="text-[10px] font-bold text-amber-600 border border-amber-200 px-3 py-1 rounded-full bg-white hover:bg-amber-600 hover:text-white transition-all">
                    <RefreshCw size={10} className="inline mr-1"/> Re-order
                  </button>
                </div>
                <div className="space-y-2">
                  {dist.recent_orders?.map(order => (
                    <div key={order.id} className="flex justify-between bg-white p-3 rounded-xl border border-slate-200/50 text-xs">
                      <span className="font-bold text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="font-black text-slate-900">KES {order.total_amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Company Name</label>
                <input 
                  required type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 transition-all font-bold"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact Person</label>
                <input 
                  required type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 transition-all font-bold"
                  value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone</label>
                  <input required type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 transition-all font-bold"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">City/Location</label>
                  <input required type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 transition-all font-bold"
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <><Check size={20}/> Save Details</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}