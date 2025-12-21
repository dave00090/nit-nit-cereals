import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Search, Trash2, 
  Calendar, Wallet, ArrowDownCircle, Loader2, X
} from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  description: string; // Changed from notes to description
  category: string;
  created_at: string;
}

const CATEGORIES = ["Stock Purchase", "Rent", "Transport", "Labor", "Electricity", "Marketing", "Others"];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State aligned with your DB columns
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Cash',
    expense_date: new Date().toISOString().split('T')[0],
    description: '', // Matches your DB column name
    category: 'Stock Purchase'
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We send 'description' to match your Supabase constraint
    const { error } = await supabase.from('expenses').insert([{
      description: formData.description,
      amount: Number(formData.amount),
      payment_method: formData.payment_method,
      expense_date: formData.expense_date,
      category: formData.category
    }]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ 
        amount: '', 
        payment_method: 'Cash', 
        expense_date: new Date().toISOString().split('T')[0], 
        description: '', 
        category: 'Stock Purchase' 
      });
      fetchExpenses();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Expenditure</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Business Outflow Tracking</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative bg-white rounded-2xl border border-slate-200 px-5 py-3 flex items-center gap-3 w-full md:w-80 shadow-sm">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text" placeholder="Search expenses..."
                className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-amber-400 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> RECORD EXPENSE
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="relative z-10">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Monthly Spending</p>
            <h2 className="text-6xl font-black italic tracking-tighter">KES {totalExpenses.toLocaleString()}</h2>
          </div>
          <ArrowDownCircle className="absolute right-0 bottom-0 text-white/5 translate-x-1/4 translate-y-1/4" size={300} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
        ) : (
          expenses
            .filter(e => e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || e.category?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((expense) => (
              <div key={expense.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500 transition-all group shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Receipt size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {expense.category}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {expense.expense_date}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 uppercase italic text-lg">{expense.description}</h3>
                    <p className="text-xs font-bold text-slate-400 tracking-widest">via {expense.payment_method}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <p className="text-2xl font-black text-red-500 italic">- KES {Number(expense.amount).toLocaleString()}</p>
                  <button onClick={() => deleteExpense(expense.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={22} /></button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">Log Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What was this for? (Description)</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold" 
                    value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                    value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (KES)</label>
                  <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-black italic text-red-500" 
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Expenditure'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}