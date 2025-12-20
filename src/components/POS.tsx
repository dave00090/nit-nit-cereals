import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Smartphone, Loader2, CheckCircle2, Receipt, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  
  // M-Pesa States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  // REAL-TIME LISTENER
  useEffect(() => {
    if (!checkoutId) return;

    // Listen for the entry in mpesa_callbacks matching our checkoutId
    const channel = supabase
      .channel('mpesa-watch')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mpesa_callbacks', filter: `checkout_request_id=eq.${checkoutId}` }, 
        (payload) => {
          if (payload.new.result_code === 0) {
            setMpesaReceipt(payload.new.mpesa_receipt_number);
            setIsProcessing(false);
          } else {
            alert("Payment Cancelled or Failed: " + payload.new.result_desc);
            setIsProcessing(false);
            setCheckoutId(null);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [checkoutId]);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

  const handleMpesaPush = async () => {
    if (!phoneNumber) return alert("Enter Phone Number");
    setIsProcessing(true);
    setMpesaReceipt(null);

    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: { phone: phoneNumber, amount: calculateTotal() }
    });

    if (error) {
      alert("Error triggering push");
      setIsProcessing(false);
    } else {
      setCheckoutId(data.CheckoutRequestID); // Store this to start listening
    }
  };

  const handleCompleteSale = async () => {
    const total = calculateTotal();
    const { data: sale } = await supabase.from('sales').insert([{
      sale_number: `SALE-${Date.now()}`,
      total_amount: total,
      payment_method: paymentMethod,
      mpesa_receipt_number: mpesaReceipt // Save the code in the sale record
    }]).select().single();

    setCart([]);
    setMpesaReceipt(null);
    setCheckoutId(null);
    alert("Sale Completed Successfully!");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 p-4">
      {/* Product List */}
      <div className="flex-1 space-y-4">
        <input type="text" placeholder="Search..." className="w-full p-2 border rounded-lg" onChange={e => setSearchTerm(e.target.value)} />
        <div className="grid grid-cols-3 gap-4">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button key={product.id} onClick={() => setCart([...cart, {...product, quantity: 1}])} className="bg-white p-4 border rounded-xl text-left">
              <p className="font-bold">{product.name}</p>
              <p className="text-amber-600 font-bold">$ {product.selling_price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border rounded-xl flex flex-col shadow-lg">
        <div className="p-4 border-b font-bold bg-slate-50">Current Order</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between border-b pb-2">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="font-bold">$ {item.selling_price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-2 rounded border font-bold ${paymentMethod === 'Cash' ? 'bg-amber-500 text-white' : 'bg-white'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('M-Pesa')} className={`flex-1 py-2 rounded border font-bold ${paymentMethod === 'M-Pesa' ? 'bg-green-600 text-white' : 'bg-white'}`}>M-Pesa</button>
          </div>

          {paymentMethod === 'M-Pesa' && (
            <div className="p-3 bg-white border border-green-200 rounded-lg">
              {mpesaReceipt ? (
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> Code: {mpesaReceipt}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="flex-1 border-b outline-none font-bold" placeholder="07XXXXXXXX" />
                  <button onClick={handleMpesaPush} disabled={isProcessing} className="bg-green-600 text-white p-2 rounded">
                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between text-xl font-bold">
            <span>Total</span><span>$ {calculateTotal().toFixed(2)}</span>
          </div>

          <button 
            onClick={handleCompleteSale} 
            disabled={cart.length === 0 || (paymentMethod === 'M-Pesa' && !mpesaReceipt)}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Complete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}