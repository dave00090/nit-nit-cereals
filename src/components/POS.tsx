import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Smartphone, Loader2, CheckCircle2, Search, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [loading, setLoading] = useState(true);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!checkoutId) return;
    const channel = supabase
      .channel('mpesa-confirm')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mpesa_callbacks', filter: `checkout_request_id=eq.${checkoutId}` },
        (payload) => {
          if (payload.new.result_code === 0) {
            setMpesaReceipt(payload.new.mpesa_receipt_number);
            setIsProcessingMpesa(false);
          } else {
            alert("Payment Failed: " + payload.new.result_desc);
            setIsProcessingMpesa(false);
            setCheckoutId(null);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [checkoutId]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return alert("Out of stock!");
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.selling_price } : item));
    } else {
      setCart([...cart, { product, quantity: 1, subtotal: product.selling_price }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.product.selling_price };
      }
      return item;
    }));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleMpesaPush = async () => {
    const total = calculateTotal();
    if (total < 1) return alert("Total must be at least 1 KES");
    if (!phoneNumber) return alert("Enter phone number");
    let cleanPhone = phoneNumber.replace(/\s+/g, '').replace('+', '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
    
    setIsProcessingMpesa(true);
    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phone: cleanPhone, amount: Math.round(total) }
      });
      if (error) throw error;
      if (data.ResponseCode === "0") setCheckoutId(data.CheckoutRequestID);
      else throw new Error(data.CustomerMessage || "Push Rejected");
    } catch (err: any) {
      alert(`M-Pesa Error: ${err.message}`);
      setIsProcessingMpesa(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* LEFT SIDE: PRODUCT GRID (Scrollable) */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-4 mb-4 bg-white p-3 rounded-xl shadow-sm border">
          <Search className="text-slate-400" />
          <input 
            type="text" placeholder="Search by product name..." 
            className="flex-1 outline-none text-lg"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto pb-10">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between h-40 group"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock_quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Stock: {product.stock_quantity}
                  </span>
                </div>
                <p className="font-bold text-slate-700 leading-tight group-hover:text-amber-600 line-clamp-2">{product.name}</p>
              </div>
              <div>
                <p className="text-amber-600 font-black text-lg">KES {product.selling_price}</p>
                <div className="mt-2 w-full bg-slate-50 text-[10px] text-center py-1 rounded font-bold text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 uppercase">Add to Cart</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: ADJUSTABLE SIDEBAR (Current Order) */}
      <div className="w-[400px] bg-white border-l shadow-2xl flex flex-col">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h2 className="font-black text-slate-700 flex items-center gap-2 text-xl">
            <ShoppingCart className="text-amber-500" /> ORDER
          </h2>
          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">{cart.length} items</span>
        </div>

        {/* CART ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
              <Package size={48} className="mb-2 opacity-20" />
              <p>No items added yet</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-800 mb-2 text-sm">
                  <span className="truncate w-40">{item.product.name}</span>
                  <span>KES {item.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:text-amber-500"><Minus size={14}/></button>
                    <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:text-amber-500"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CHECKOUT SECTION */}
        <div className="p-6 border-t bg-slate-50 space-y-4">
          <div className="flex gap-2 p-1 bg-white rounded-xl border">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>CASH</button>
            <button onClick={() => setPaymentMethod('M-Pesa')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${paymentMethod === 'M-Pesa' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400'}`}>M-PESA</button>
          </div>

          {paymentMethod === 'M-Pesa' && (
            <div className="bg-white p-4 rounded-2xl border-2 border-green-100 space-y-3 shadow-sm">
              {mpesaReceipt ? (
                <div className="flex items-center gap-3 text-green-700"><CheckCircle2 className="w-8 h-8" /><div><p className="text-[10px] font-bold uppercase">Confirmed</p><p className="font-black text-lg">{mpesaReceipt}</p></div></div>
              ) : (
                <>
                  <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full font-black text-center text-lg border-b-2 border-slate-100 focus:border-green-500 outline-none" placeholder="2547XXXXXXXX" />
                  <button onClick={handleMpesaPush} disabled={isProcessingMpesa || cart.length === 0} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                    {isProcessingMpesa ? <Loader2 className="animate-spin" /> : <><Smartphone size={18}/> Send STK Push</>}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Amount</span>
            <span className="text-3xl font-black text-slate-900">KES {calculateTotal().toLocaleString()}</span>
          </div>

          <button 
            onClick={() => {/* handleCompleteSale logic */}} 
            disabled={cart.length === 0 || (paymentMethod === 'M-Pesa' && !mpesaReceipt)}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-black disabled:opacity-20 active:scale-95 transition-all"
          >
            COMPLETE SALE
          </button>
        </div>
      </div>
    </div>
  );
}