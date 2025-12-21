import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Plus, Minus, Trash2, Check, Loader2, 
  Truck, User, Search, Calculator, AlertCircle 
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  buying_price: number;
  stock_quantity: number; // Added to track current levels
}

interface Distributor {
  id: string;
  name: string;
}

export default function SupplierOrders() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: dists } = await supabase.from('distributors').select('id, name');
    // Fetch stock_quantity as well to show low stock alerts
    const { data: prods } = await supabase.from('products').select('id, name, buying_price, stock_quantity');
    if (dists) setDistributors(dists);
    if (prods) setProducts(prods);
  };

  const addToOrder = (product: Product) => {
    const exists = cart.find(item => item.product.id === product.id);
    if (exists) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.product.buying_price * item.qty), 0);

  const handleCompleteOrder = async () => {
    if (!selectedDistributor || cart.length === 0) return alert("Select a supplier and items");
    
    setLoading(true);
    const totalAmount = calculateTotal();

    try {
      // 1. Update Inventory Levels
      for (const item of cart) {
        await supabase.rpc('increment_stock', { 
          row_id: item.product.id, 
          amount: item.qty 
        });
      }

      // 2. Increase Distributor Debt
      const { data: currentDist } = await supabase
        .from('distributors')
        .select('total_debt')
        .eq('id', selectedDistributor)
        .single();

      await supabase
        .from('distributors')
        .update({ total_debt: (currentDist?.total_debt || 0) + totalAmount })
        .eq('id', selectedDistributor);

      alert("Delivery recorded successfully!");
      setCart([]);
      setSelectedDistributor('');
      loadInitialData(); // Refresh product list to show new stock levels
    } catch (err) {
      console.error(err);
      alert("Order failed to process.");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 p-6 bg-slate-50">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Truck className="text-amber-500" />
            <h2 className="font-black text-slate-800 uppercase tracking-tight">Record Delivery</h2>
          </div>
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products to restock..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-amber-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pb-10">
          {filteredProducts.map(product => (
            <button 
              key={product.id} 
              onClick={() => addToOrder(product)} 
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-500 text-left transition-all group shadow-sm relative overflow-hidden"
            >
              {product.stock_quantity < 10 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 flex items-center gap-1">
                  <AlertCircle size={10} />
                  <span className="text-[8px] font-bold uppercase">Low Stock</span>
                </div>
              )}
              <p className="font-bold text-slate-700 group-hover:text-amber-600 truncate">{product.name}</p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Buy Price</p>
                  <p className="text-amber-600 font-black text-sm">KES {product.buying_price}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">On Hand</p>
                  <p className={`text-sm font-bold ${product.stock_quantity < 10 ? 'text-red-500' : 'text-slate-600'}`}>
                    {product.stock_quantity}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Order Summary */}
      <div className="w-96 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-amber-500" size={20}/>
            <span className="text-xs font-black uppercase tracking-widest">Supplier Details</span>
          </div>
          <select 
            className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm font-bold outline-none ring-1 ring-slate-700 focus:ring-amber-500"
            value={selectedDistributor}
            onChange={(e) => setSelectedDistributor(e.target.value)}
          >
            <option value="">Choose a partner...</option>
            {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-10">
               <Package size={48} className="opacity-10 mb-2" />
               <p>Add products to delivery</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 truncate w-32">{item.product.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">Subtotal: KES {(item.product.buying_price * item.qty).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                 <span className="font-black text-slate-700 bg-white px-2 py-1 rounded border min-w-[30px] text-center">{item.qty}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t space-y-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Debt Addition</span>
            <span className="text-2xl font-black text-slate-900">KES {calculateTotal().toLocaleString()}</span>
          </div>

          <button 
            onClick={handleCompleteOrder}
            disabled={loading || cart.length === 0 || !selectedDistributor}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Check size={20}/> Confirm Delivery</>}
          </button>
        </div>
      </div>
    </div>
  );
}