import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Pencil, Trash2, X, Check, Loader2, 
  Phone, User, Search, History, Package, CreditCard, Receipt
} from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
}

export default function Distributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    // Basic select to ensure data shows up even if other tables are empty
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .order('name');
    
    if (error) console.error("Fetch error:", error);
    if (data) setDistributors(data);
    setLoading(false);
  }

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
        const { error } = await supabase.from('distributors').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('distributors').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      await fetchDistributors();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-slate-500">Manage partners and financial records</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors
          .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((dist) => (
            <div key={dist.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-100">
                    <Package size={24} />
                  </div>
                  <button onClick={() => handleEdit(dist)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                    <Pencil size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{dist.name}</h3>
                  <div className="flex flex-col gap-1 pt-2">
                    <span className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                      <User size={14} className="text-slate-300" /> {dist.contact_person}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone size={14} className="text-slate-300" /> {dist.phone}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => alert(`Record full payment for ${dist.name}`)}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all"
                  >
                    <Receipt size={14}/> Record Payment
                  </button>
                  <button 
                    onClick={() => alert(`Pay installment for ${dist.name}`)}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:border-slate-900 transition-all"
                  >
                    <CreditCard size={14}/> Pay Installment
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 border-t border-slate-100 mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <History size={12}/> Address
                </p>
                <p className="text-sm font-medium text-slate-600">{dist.address}</p>
              </div>
            </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 pb-0 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <input 
                required placeholder="Distributor Name"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-slate-900 font-bold"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                required placeholder="Contact Person"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-slate-900 font-bold"
                value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Phone Number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-slate-900 font-bold text-sm"
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                <input required placeholder="Location" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-slate-900 font-bold text-sm"
                  value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <><Check size={20}/> Save Partner</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}