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
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('supplier_purchases').select('*').order('purchase_date', { ascending: false })
    ]);
    
    if (supRes.data) setSuppliers(supRes.data);
    if (purRes.data) setPurchases(purRes.data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('suppliers')
      .insert([{
        name: formData.name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        category: formData.category
      }]);

    if (error) {
      alert("Error saving supplier: " + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ name: '', contact_person: '', phone: '', category: 'Wholesaler' });
      fetchData();
    }
    setLoading(false);
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Are you sure? This will also remove their supply history.")) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) {
      setSelectedSupplier(null);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Supplier Network</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Procurement & Sourcing Database</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-amber-500 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <UserPlus size={20} strokeWidth={3} /> ADD NEW PARTNER
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: SUPPLIER LIST */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search suppliers..." 
                className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:border-amber-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {suppliers
                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(sup => (
                <button 
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all group ${
                    selectedSupplier?.id === sup.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' 
                    : 'bg-white border-slate-200 text-slate-900 hover:border-amber-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-[9px] font-black uppercase mb-1 tracking-widest ${selectedSupplier?.id === sup.id ? 'text-amber-500' : 'text-slate-400'}`}>
                        {sup.category}
                      </p>
                      <h4 className="font-black uppercase text-lg italic leading-tight">{sup.name}</h4>
                    </div>
                    <ChevronRight size={20} className={selectedSupplier?.id === sup.id ? 'text-amber-500' : 'text-slate-200'} />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[11px] font-bold opacity-70">
                    <span className="flex items-center gap-1"><Phone size={14} /> {sup.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SUPPLIER DETAILS & HISTORY */}
          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {selectedSupplier.name}
                    </h2>
                    <div className="flex gap-4 mt-2">
                       <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <User size={12}/> {selectedSupplier.contact_person}
                       </span>
                       <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <Phone size={12}/> {selectedSupplier.phone}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSupplier(selectedSupplier.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="p-10">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <Package size={16} className="text-amber-500" /> Supply History
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-4">Purchase Date</th>
                          <th className="pb-4">Product Description</th>
                          <th className="pb-4">Qty</th>
                          <th className="pb-4 text-right">Total (KES)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {purchases.filter(p => p.supplier_id === selectedSupplier.id).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center flex flex-col items-center opacity-20">
                              <Package size={48} strokeWidth={1} />
                              <p className="font-black uppercase text-xs mt-2">No items supplied yet</p>
                            </td>
                          </tr>
                        ) : (
                          purchases.filter(p => p.supplier_id === selectedSupplier.id).map(record => (
                            <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-5 text-xs font-bold text-slate-500">{record.purchase_date}</td>
                              <td className="py-5 font-black text-slate-900 uppercase text-sm">{record.product_name}</td>
                              <td className="py-5 font-bold text-slate-600 text-sm">{record.quantity} Units</td>
                              <td className="py-5 text-right font-black text-emerald-600 italic text-base">
                                KES {record.total_cost.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[600px] bg-slate-100/50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-20">
                <Truck size={80} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-[0.2em] text-center text-sm">
                  Select a supplier profile<br/>to view detailed records
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD SUPPLIER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">New Supplier</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier / Company Name</label>
                <input 
                  required 
                  className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                  <input 
                    className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" 
                    value={formData.contact_person} 
                    onChange={e => setFormData({...formData, contact_person: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Category</label>
                <select 
                  className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all"
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Farmer">Direct Farmer</option>
                  <option value="Distributor">Regional Distributor</option>
                  <option value="Importer">Importer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] uppercase tracking-widest text-sm shadow-xl hover:bg-slate-800 transition-all mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Register Supplier'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}