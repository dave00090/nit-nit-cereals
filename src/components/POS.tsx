import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Smartphone, Loader2, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [loading, setLoading] = useState(true);
  
  // M-Pesa Specific States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // REAL-TIME LISTENER: Auto-captures the M-Pesa code when the user enters their PIN
  useEffect(() => {
    if (!checkoutId) return;

    const channel = supabase
      .channel('mpesa-confirm')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mpesa_callbacks', 
          filter: `checkout_request_id=eq.${checkoutId}` 
        },
        (payload) => {
          if (payload.new.result_code === 0) {
            setMpesaReceipt(payload.new.mpesa_receipt_number);
            setIsProcessingMpesa(false);
          } else {
            alert("M-Pesa Payment Failed: " + payload.new.result_desc);
            setIsProcessingMpesa(false);
            setCheckoutId(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [checkoutId]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
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

  // TRIGGER THE M-PESA STK PUSH
  const handleMpesaPush = async () => {
    const total = calculateTotal();
    
    if (total < 1) return alert("Total must be at least 1 KES");
    if (!phoneNumber) return alert("Please enter a phone number");
    
    // Format number to 2547XXXXXXXX
    let cleanPhone = phoneNumber.replace(/\s+/g, '').replace('+', '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    }
    
    if (cleanPhone.length !== 12) return alert("Phone number must be 12 digits (e.g., 254712345678)");

    setIsProcessingMpesa(true);
    setMpesaReceipt(null);
    console.log("Attempting push to:", cleanPhone, "Amount:", Math.round(total));

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { 
          phone: cleanPhone, 
          amount: Math.round(total) 
        }
      });

      // Handle Supabase/Network Errors
      if (error) {
        console.error("Function Invoke Error:", error);
        throw new Error(error.message || "Could not reach the payment server");
      }
      
      console.log("Safaricom Response:", data);

      // Handle Safaricom API Response
      if (data.ResponseCode === "0") {
        setCheckoutId(data.CheckoutRequestID);
        // Note: The listener above will handle the success popup
      } else {
        throw new Error(data.CustomerMessage || data.errorMessage || "Push Rejected by Safaricom");
      }

    } catch (err: any) {
      console.error("M-Pesa Error:", err);
      alert(`M-Pesa Error: ${err.message}`);
      setIsProcessingMpesa(false);
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    const total = calculateTotal();

    const { data: sale, error } = await supabase.from('sales').insert([{
      sale_number: `SALE-${Date.now()}`,
      total_amount: total,
      payment_method: paymentMethod,
      mpesa_receipt_number: mpesaReceipt
    }]).select().single();

    if (error) return alert("Sale completion failed in database");

    alert(`Sale Completed Successfully! Receipt: ${mpesaReceipt || 'N/A'}`);
    setCart([]);
    setMpesaReceipt(null);
    setCheckoutId(null);
    setPhoneNumber('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 p-4">
      {/* Product List */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="text-slate-400 w-5 h-5" />
          <input 
            type="text" placeholder="Search products..." 
            className="w-full outline-none" 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-500 transition-colors text-left group shadow-sm">
              <p className="font-bold text-slate-800 group-hover:text-amber-600 truncate">{product.name}</p>
              <p className="text-amber-600 font-bold mt-1">KES {product.selling_price.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase">Stock: {product.stock_quantity}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b font-bold bg-slate-50 text-slate-700 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-500"/> Current Order
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pb-3 border-b border-slate-100 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{item.product.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 border rounded hover:bg-slate-50"><Minus className="w-3 h-3"/></button>
                    <span className="text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="p-1 border rounded hover:bg-slate-50"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-800">KES {item.subtotal.toLocaleString()}</p>
                  <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-4">
          {/* Payment Method Toggle */}
          <div className="flex gap-2 p-1 bg-white rounded-lg border">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('M-Pesa')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'M-Pesa' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500'}`}>M-Pesa</button>
          </div>

          {/* M-Pesa Interactive Area */}
          {paymentMethod === 'M-Pesa' && (
            <div className="p-4 bg-white border border-green-200 rounded-xl space-y-3 shadow-inner">
              {mpesaReceipt ? (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 animate-in zoom-in">
                  <CheckCircle2 className="w-8 h-8" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Payment Received</p>
                    <p className="font-black text-xl leading-none">{mpesaReceipt}</p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Phone (254...)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} 
                      className="flex-1 font-bold outline-none border-b-2 border-slate-100 focus:border-green-500 py-1" 
                      placeholder="2547XXXXXXXX" 
                    />
                    <button 
                      onClick={handleMpesaPush} 
                      disabled={isProcessingMpesa || cart.length === 0} 
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg disabled:bg-slate-300 transition-colors"
                    >
                      {isProcessingMpesa ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                    </button>
                  </div>
                  {isProcessingMpesa && <p className="text-[10px] text-green-600 font-bold animate-pulse">Waiting for customer PIN...</p>}
                </>
              )}
            </div>
          )}

          <div className="flex justify-between items-end pt-2">
            <span className="text-slate-500 font-medium">Total Amount</span>
            <span className="text-2xl font-black text-slate-900">KES {calculateTotal().toLocaleString()}</span>
          </div>

          <button 
            onClick={handleCompleteSale} 
            disabled={cart.length === 0 || (paymentMethod === 'M-Pesa' && !mpesaReceipt)} 
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-lg shadow-lg disabled:opacity-30 transition-all active:scale-95"
          >
            COMPLETE SALE
          </button>
        </div>
      </div>
    </div>
  );
}