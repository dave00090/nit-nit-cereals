// BUILD_VERSION: 99.99 - FORCE_REFRESH_NOW
import { useEffect, useState } from 'react';
// ... rest of the code I sent in the previous message
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, User, Search, X } from 'lucide-react';

export default function Suppliers() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    const { data, error } = await supabase.from('distributors').select('*').order('name');
    if (error) console.error(error);
    setPartners(data || []);
    setLoading(false);
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.from('distributors').delete().eq('id', id);
    if (!error) setPartners(partners.filter(p => p.id !== id));
    else alert("Delete failed: " + error.message);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      {/* DEBUG BAR: IF YOU SEE THIS, THE NEW CODE IS LIVE */}
      <div className="bg-yellow-400 text-black p-2 text-center font-bold text-xs mb-4 rounded-lg">
        DEBUG MODE ACTIVE: Connected to Table "distributors" | Found: {partners.length} partners
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-8 italic uppercase text-slate-900">Partner Management</h1>
        
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white p-6 rounded-3xl shadow-md flex items-center justify-between border-4 border-white hover:border-amber-400 transition-all">
              <div className="flex items-center gap-4">
                <div className="bg-slate-200 p-3 rounded-2xl text-slate-500"><User size={24} /></div>
                <div>
                  <h3 className="font-black text-lg uppercase text-slate-800">{partner.name}</h3>
                  <p className="text-slate-500 font-bold text-xs">{partner.phone || 'No Phone'}</p>
                </div>
              </div>

              {/* EMERGENCY DELETE BUTTON - BRIGHT RED SQUARE */}
              <button 
                onClick={() => handleDelete(partner.id, partner.name)}
                className="bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 shadow-xl transition-all active:scale-90"
                style={{ display: 'block', minWidth: '60px' }}
              >
                <Trash2 size={24} strokeWidth={3} />
              </button>
            </div>
          ))}

          {partners.length === 0 && !loading && (
            <div className="bg-white p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-300">
              <p className="font-black text-slate-400">NO PARTNERS FOUND IN DATABASE TABLE "DISTRIBUTORS"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}