import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Truck, Phone, Search, Trash2, 
  ChevronRight, User, Loader2, X
} from 'lucide-react';

export default function Suppliers() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', category: 'Wholesaler' });

  useEffect(() => {
    fetchPartners();
  }, []);

  // --- FETCHING FROM THE CORRECT TABLE ---
  async function fetchPartners() {
    setLoading(true);
    const { data, error } = await supabase
      .from('distributors') 
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  }

  // --- DELETE FUNCTION TARGETING DISTRIBUTORS ---
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?`)) return;

    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      // Refresh the list immediately
      setPartners(partners.filter(p => p.id !== id));
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('distributors').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', category: 'Wholesaler' });
      fetchPartners();
    }
  };

  if (loading) return <div className="p-20 text-center font-black">SYNCING WITH REGISTRY...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Distributors</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-amber-500 px-6 py-4 rounded-2xl font-black shadow-xl"
          >
            + ADD PARTNER
          </button>
        </header>

        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="w-full p-5 pl-12 rounded-2xl border-none shadow-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {partners
            .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((partner) => (
            <div 
              key={partner.id} 
              className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center justify-between border-2 border-transparent hover:border-amber-500 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-4 rounded-2xl text-slate-400">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-xl text-slate-900">{partner.name}</h3>
                  <p className="text-slate-500 font-bold text-sm">{partner.phone || 'No Contact'}</p>
                </div>
              </div>

              {/* THE DELETE BUTTON - ALWAYS VISIBLE BRIGHT RED */}
              <button 
                onClick={() => handleDelete(partner.id, partner.name)}
                className="bg-red-600 text-white p-5 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-90"
                title="Delete this partner"
              >
                <Trash2 size={24} strokeWidth={3} />
              </button>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 text-slate-400 font-black uppercase">
              No Partners found in distributors table
            </div>
          )}
        </div>
      </div>

      {/* MODAL FOR NEW PARTNER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black uppercase italic mb-6">New Partner Entry</h2>
            <form onSubmit={handleAddPartner} className="space-y-4">
              <input 
                required
                placeholder="Partner Name"
                className="w-full p-4 bg-slate-100 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                placeholder="Phone Number"
                className="w-full p-4 bg-slate-100 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <button className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-2xl shadow-xl uppercase tracking-widest">
                Save to Registry
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 font-bold py-2">CANCEL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}