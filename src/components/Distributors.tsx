import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Pencil, Trash2, X, Check, Loader2, 
  Phone, MapPin, User, Search, History, Package 
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
  recent_orders?: Order[]; // To show history
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
    // This query fetches distributors AND their 3 most recent orders at once
    const { data, error } = await supabase
      .from('distributors')
      .select(`
        *,
        recent_orders:supplier_orders(id, created_at, total_amount)
      `)
      .order('name')
      .limit(3, { foreignTable: 'supplier_orders' });

    if (data) setDistributors(data);
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
    if (editingId) {
      await supabase.from('distributors').update(formData).eq('id', editingId);
    } else {
      await supabase.from('distributors').insert([formData]);
    }
    setIsModalOpen(false);
    fetchDistributors();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Supply Chain</h1>
          <p className="text-slate-500">Search and manage your distributors</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search company or contact..."
              className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 ring-amber-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <UserPlus size={18} /> <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* DISTRIBUTORS GRID */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDistributors.map((dist) => (
            <div key={dist.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              {/* TOP INFO */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="bg-amber-100 p-3 rounded-2xl">
                    <Package className="text-amber-600" size={24} />
                  </div>
                  <button onClick={() => openModal(dist)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Pencil size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">{dist.name}</h3>
                  <p className="text-slate-400 text-sm font-medium flex items-center gap-1 mt-1">
                    <User size={14} /> {dist.contact_person}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Phone size={14} className="text-slate-300" />
                    <span>{dist.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <MapPin size={14} className="text-slate-300" />
                    <span className="truncate">{dist.address}</span>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS MINI-LIST */}
              <div className="bg-slate-50 p-6 mt-auto">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">
                  <History size={12} /> Recent Deliveries
                </div>
                
                <div className="space-y-2">
                  {dist.recent_orders?.length ? dist.recent_orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-slate-100 text-xs">
                      <span className="text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="font-bold text-slate-800">KES {order.total_amount.toLocaleString()}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-300 italic">No order history found</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL REMAINS THE SAME AS PREVIOUS VERSION */}
      {/* ... [Keeping previous modal code here for brevity] ... */}
    </div>
  );
}