import { useEffect, useState } from 'react';
import { Plus, UserPlus, Phone, X, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Distributors() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    setLoading(true);
    const { data } = await supabase.from('distributors').select('*').order('name');
    setDistributors(data || []);
    setLoading(false);
  };

  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('distributors')
      .insert([{ name: formData.name, phone: formData.phone, total_debt: 0 }]);

    if (error) {
      alert("Error adding distributor");
    } else {
      setFormData({ name: '', phone: '' });
      setShowModal(false);
      loadDistributors();
    }
  };

  const handlePayment = async (distId: string, currentDebt: number) => {
    const amount = prompt("Enter installment amount paid ($):");
    if (!amount || isNaN(parseFloat(amount))) return;

    const val = parseFloat(amount);
    await supabase.from('distributor_transactions').insert([
      { distributor_id: distId, amount: val, type: 'payment', notes: 'Installment payment' }
    ]);
    
    await supabase.from('distributors').update({ total_debt: currentDebt - val }).eq('id', distId);
    
    // Also add to expenses automatically
    await supabase.from('expenses').insert([
      { description: `Debt Payment to Distributor`, amount: val, category: 'Stock Purchase', expense_date: new Date().toISOString().split('T')[0] }
    ]);
    
    loadDistributors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Distributor Debts</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md transition-all"
        >
          <UserPlus className="w-5 h-5" /> Add Distributor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {distributors.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No distributors added yet.</p>
          </div>
        ) : (
          distributors.map(d => (
            <div key={d.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-800">{d.name}</h3>
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">{d.phone || 'No phone'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Balance Owed</p>
                <p className={`text-2xl font-black ${d.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${parseFloat(d.total_debt).toFixed(2)}
                </p>
              </div>

              <div className="mt-6">
                <button 
                  onClick={() => handlePayment(d.id, d.total_debt)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pay Installment
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD DISTRIBUTOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-6">New Distributor</h3>
            
            <form onSubmit={handleAddDistributor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Distributor Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg transition-all mt-4"
              >
                Save Distributor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}