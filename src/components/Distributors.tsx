import { useEffect, useState } from 'react';
import { Plus, UserPlus, Phone, X, CreditCard, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Distributors() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [purchaseData, setPurchaseData] = useState({ total_bill: '', initial_payment: '' });

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

    if (error) alert("Error adding distributor");
    else {
      setFormData({ name: '', phone: '' });
      setShowAddModal(false);
      loadDistributors();
    }
  };

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(purchaseData.total_bill);
    const paid = parseFloat(purchaseData.initial_payment || '0');
    const newDebtAmount = total - paid;

    try {
      // 1. Record the Purchase Transaction
      await supabase.from('distributor_transactions').insert([
        { distributor_id: selectedDistributor.id, amount: total, type: 'purchase', notes: `Total Purchase: $${total}` }
      ]);

      // 2. If a payment was made, record it too
      if (paid > 0) {
        await supabase.from('distributor_transactions').insert([
          { distributor_id: selectedDistributor.id, amount: paid, type: 'payment', notes: 'Initial installment' }
        ]);
        
        // Add to main Expenses table
        await supabase.from('expenses').insert([
          { description: `Payment to ${selectedDistributor.name}`, amount: paid, category: 'Stock Purchase', expense_date: new Date().toISOString().split('T')[0] }
        ]);
      }

      // 3. Update the distributor's balance
      const newTotalDebt = parseFloat(selectedDistributor.total_debt) + newDebtAmount;
      await supabase.from('distributors').update({ total_debt: newTotalDebt }).eq('id', selectedDistributor.id);

      setShowPurchaseModal(false);
      setPurchaseData({ total_bill: '', initial_payment: '' });
      loadDistributors();
    } catch (err) {
      alert("Failed to record purchase");
    }
  };

  const handleInstallmentOnly = async (distId: string, currentDebt: number) => {
    const amount = prompt("Enter installment amount to pay ($):");
    if (!amount || isNaN(parseFloat(amount))) return;
    const val = parseFloat(amount);

    await supabase.from('distributor_transactions').insert([{ distributor_id: distId, amount: val, type: 'payment', notes: 'Installment' }]);
    await supabase.from('distributors').update({ total_debt: currentDebt - val }).eq('id', distId);
    await supabase.from('expenses').insert([{ description: `Installment Payment`, amount: val, category: 'Stock Purchase', expense_date: new Date().toISOString().split('T')[0] }]);
    
    loadDistributors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Distributor Ledger</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
        >
          <UserPlus className="w-5 h-5" /> Add Distributor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {distributors.map(d => (
          <div key={d.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg">{d.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{d.phone || 'No Contact'}</p>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Debt Owed</p>
              <p className={`text-2xl font-black ${d.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${parseFloat(d.total_debt).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => { setSelectedDistributor(d); setShowPurchaseModal(true); }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Record New Purchase
              </button>
              <button 
                onClick={() => handleInstallmentOnly(d.id, d.total_debt)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Just Pay Installment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: ADD DISTRIBUTOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400"><X /></button>
            <h3 className="text-xl font-bold mb-4">New Distributor</h3>
            <form onSubmit={handleAddDistributor} className="space-y-4">
              <input type="text" placeholder="Name" required className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Phone" className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <button className="w-full py-2 bg-amber-500 text-white font-bold rounded">Save</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PURCHASE & PAY INSTALLMENT */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowPurchaseModal(false)} className="absolute top-4 right-4 text-slate-400"><X /></button>
            <h3 className="text-xl font-bold mb-2">Record Purchase</h3>
            <p className="text-sm text-slate-500 mb-6">Buying from: {selectedDistributor?.name}</p>
            
            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Total Purchase Amount ($)</label>
                <input 
                  type="number" required step="0.01" className="w-full p-3 bg-slate-50 border rounded-lg text-lg font-bold" 
                  value={purchaseData.total_bill} onChange={e => setPurchaseData({...purchaseData, total_bill: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Amount Paid Today ($)</label>
                <input 
                  type="number" step="0.01" className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-lg font-bold text-green-700" 
                  value={purchaseData.initial_payment} onChange={e => setPurchaseData({...purchaseData, initial_payment: e.target.value})}
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-bold">DEBT TO BE ADDED:</p>
                <p className="text-xl font-black text-blue-700">
                  ${(parseFloat(purchaseData.total_bill || '0') - parseFloat(purchaseData.initial_payment || '0')).toFixed(2)}
                </p>
              </div>

              <button className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg mt-4">Confirm & Update Debt</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}