import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Truck, Phone, Search, Trash2, 
  Package, Plus, Loader2, X, ChevronRight, User
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  category: string;
  created_at: string;
}

interface PurchaseRecord {
  id: string;
  supplier_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    category: 'Wholesaler'
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [supRes, purRes] = await Promise.all([
      supabase.from('distributors').select('*').order('name'),
      supabase.from('supplier_purchases').select('*').order('purchase_date', { ascending: false })
    ]);
    
    if (supRes.data) setSuppliers(supRes.data);
    if (purRes.data) setPurchases(purRes.data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Company Name is required!");
    
    setLoading(true);
    const { data, error } = await supabase
      .from('distributors')
      .insert([{
          name: formData.name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          category: formData.category
      }])
      .select();

    if (error) {
      alert("Database Error: " + error.message);
    } else if (data && data.length > 0) {
      alert("SUCCESS: " + data[0].name + " added to Registry!");
      setIsModalOpen(false);
      setFormData({ name: '', contact_person: '', phone: '', category: 'Wholesaler' });
      fetchData(); 
    }
    setLoading(false);
  };

  const deleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Distributor Registry</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{suppliers.length} Active Partners</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-amber-500 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <UserPlus size={20} strokeWidth={3} /> ADD NEW PARTNER
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search partners..." 
                className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:border-amber-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
              {suppliers
                .filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .map(sup => (
                <div key={sup.id} className="bg-white rounded-[2rem] border-2 border-red-500 p-6 shadow-md flex flex-col gap-4">
                  {/* Card Content */}
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase mb-1 tracking-widest text-amber-600">
                      {sup.category || 'Partner'}
                    </p>
                    <h4 className="font-black uppercase text-lg italic leading-tight truncate">
                      {sup.name ?? 'Unnamed Partner'}
                    </h4>
                    <p className="mt-2 text-xs font-bold text-slate-500 flex items-center gap-1">
                       <Phone size={12} /> {sup.phone ?? 'No Phone'}
                    </p>
                  </div>

                  {/* ACTION BUTTONS - FORCED VISIBILITY */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedSupplier(sup)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"
                    >
                      View Profile <ChevronRight size={14} />
                    </button>
                    
                    <button 
                      onClick={() => deleteSupplier(sup.id, sup.name ?? 'this partner')}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center shadow-lg transition-all"
                      style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                      title="Delete Partner"
                    >
                      <Trash2 size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {selectedSupplier.name}
                    </h2>
                    <div className="flex gap-4 mt-2 font-bold text-[10px] uppercase tracking-widest text-slate-500">
                       <span className="flex items-center gap-1"><User size={12}/> {selectedSupplier.contact_person || 'N/A'}</span>
                       <span className="flex items-center gap-1"><Phone size={12}/> {selectedSupplier.phone}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSupplier(selectedSupplier.id, selectedSupplier.name)}
                    className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 font-black text-xs uppercase shadow-lg"
                  >
                    <Trash2 size={18} /> Delete Account
                  </button>
                </div>
                <div className="p-10">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">History</h3>
                   <p className="text-center py-10 text-slate-400 italic">History records for {selectedSupplier.name} will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="h-[600px] bg-slate-100/50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-20">
                <Truck size={80} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-[0.2em] text-center text-sm">
                  Select a partner profile<br/>to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-10 text-slate-900">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Register New Partner</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input required placeholder="Company Name" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <button type="submit" className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] uppercase tracking-widest text-sm shadow-xl mt-4">
                Register Partner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}