import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Truck, Phone, Search, Trash2, 
  History, Package, Plus, Loader2, X, ChevronRight
} from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

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
    const { error } = await supabase.from('suppliers').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: '', contact_person: '', phone: '', category: 'Wholesaler' });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Supplier Network</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Source & Procurement Management</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-amber-500 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            <UserPlus size={20} /> ADD NEW SUPPLIER
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SUPPLIER LIST */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Suppliers</h3>
            {suppliers.map(sup => (
              <button 
                key={sup.id}
                onClick={() => setSelectedSupplier(sup)}
                className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedSupplier?.id === sup.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-[9px] font-black uppercase mb-1 ${selectedSupplier?.id === sup.id ? 'text-amber-500' : 'text-slate-400'}`}>{sup.category}</p>
                    <h4 className="font-black uppercase text-lg italic">{sup.name}</h4>
                  </div>
                  <ChevronRight size={20} className={selectedSupplier?.id === sup.id ? 'text-amber-500' : 'text-slate-200'} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold opacity-60">
                  <Phone size={14} /> {sup.phone}
                </div>
              </button>
            ))}
          </div>

          {/* PURCHASE HISTORY FOR SELECTED SUPPLIER */}
          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase italic">{selectedSupplier.name}</h2>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Supply Record & History</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Contact</p>
                      <p className="font-black text-slate-900">{selectedSupplier.contact_person}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Product</th>
                        <th className="pb-4">Quantity</th>
                        <th className="pb-4 text-right">Cost (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {purchases.filter(p => p.supplier_id === selectedSupplier.id).length === 0 ? (
                        <tr><td colSpan={4} className="py-20 text-center font-bold text-slate-300 uppercase">No supply records found</td></tr>
                      ) : (
                        purchases.filter(p => p.supplier_id === selectedSupplier.id).map(record => (
                          <tr key={record.id} className="group">
                            <td className="py-5 text-xs font-bold text-slate-500">{record.purchase_date}</td>
                            <td className="py-5 font-black text-slate-900 uppercase text-sm">{record.product_name}</td>
                            <td className="py-5 font-bold text-slate-600">{record.quantity} units</td>
                            <td className="py-5 text-right font-black text-emerald-600 italic">KES {record.total_cost.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-100 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-20">
                <Truck size={64} strokeWidth={1} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-center text-sm">Select a supplier on the left<br/>to view their supply history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">New Partner</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Company Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact Person</label>
                  <input className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none" 
                    value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                  <input className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl">
                SAVE SUPPLIER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}