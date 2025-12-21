import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CheckCircle, Loader2, Barcode, Wallet 
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    // Auto-focus barcode input for scanner use
    barcodeInputRef.current?.focus();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  }

  // Barcode Scanner Logic
  const handleBarcodeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSearchTerm(code);
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      setSearchTerm(''); // Clear for next scan
    }
  };

  const addToCart = (product: any) => {
    if (product.current_stock <= 0) {
      alert("Out of Stock!");
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  // --- FIXED COMPLETE SALE BUTTON LOGIC ---
  const completeSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Record the Sale
      const { error: saleError } = await supabase.from('sales').insert([{
        items: cart,
        total_amount: total,
        payment_method: 'Cash'
      }]);

      if (saleError) throw saleError;

      // 2. Deduct Stock for each item
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: item.current_stock - item.quantity })
          .eq('id', item.id);
        
        if (updateError) console.error("Stock Update Error:", updateError);
      }

      alert("Sale Completed Successfully!");
      setCart([]);
      fetchProducts(); // Refresh stock levels
    } catch (error: any) {
      alert("Sale Failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* LEFT: PRODUCT SELECTION */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Checkout</h1>
          <div className="relative w-96">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              ref={barcodeInputRef}
              placeholder="Scan Barcode or Search..."
              className="w-full bg-white border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold focus:border-amber-500 outline-none"
              value={searchTerm}
              onChange={handleBarcodeSearch}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:border-amber-500 transition-all group"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
              <h3 className="font-black text-slate-900 uppercase truncate">{product.name}</h3>
              <div className="flex justify-between items-end mt-4">
                <p className="text-lg font-black text-amber-600 italic">KES {product.selling_price}</p>
                <p className="text-[10px] font-bold text-slate-400">Stock: {product.current_stock}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: CART & TOTAL */}
      <div className="w-[450px] bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 mb-8 border-b pb-6">
          <div className="bg-amber-500 p-3 rounded-2xl text-slate-900">
            <ShoppingCart size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">Cart</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {cart.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <ShoppingCart size={64} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">Cart is Empty</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <p className="font-black text-slate-900 text-sm uppercase truncate w-32">{item.name}</p>
                <p className="text-[10px] font-bold text-slate-400 italic">KES {item.selling_price} each</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="bg-white p-1 rounded-lg border shadow-sm"><Minus size={14}/></button>
                <span className="font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="bg-white p-1 rounded-lg border shadow-sm"><Plus size={14}/></button>
                <button onClick={() => removeFromCart(item.id)} className="ml-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Total Amount</span>
            <span className="text-4xl font-black text-slate-900 italic">KES {total.toLocaleString()}</span>
          </div>

          <button 
            onClick={completeSale}
            disabled={isProcessing || cart.length === 0}
            className="w-full bg-slate-900 text-amber-500 py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24}/> COMPLETE SALE</>}
          </button>
        </div>
      </div>
    </div>
  );
}