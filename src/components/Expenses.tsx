import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Search, Trash2, 
  Calendar, Wallet, Tag, MoreHorizontal,
  ArrowDownCircle, Loader2, X, Check
} from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string;
  created_at: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* HEADER & STATS */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expenses</h1>
            <p className="text-slate-500 font-medium">Business spending and supplier payments</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-2 flex items-center gap-2 w-full md:w-80">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text" placeholder="Search notes..."
                className="outline-none flex-1 text-slate-600 bg-transparent py-1 font-bold"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TOTAL CARD */}
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden mb-8">
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Monthly Expenditure</p>
            <h2 className="text-5xl font-black tracking-tighter">KES {totalExpenses.toLocaleString()}</h2>
          </div>
          <ArrowDownCircle className="absolute right-8 top-1/2 -translate-y-1/2 text-white/5" size={120} />
        </div>
      </div>

      {/* TABLE/LIST */}
      <div className="max-w-7xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
        ) : (
          expenses
            .filter(e => e.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((expense) => (
              <div key={expense.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{expense.notes || 'No details'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <Calendar size={12} /> {expense.expense_date}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <Wallet size={12} /> {expense.payment_method}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">KES {expense.amount.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}