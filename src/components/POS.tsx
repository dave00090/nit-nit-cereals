import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Trash2, Banknote, CreditCard, Receipt, X, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    const total = calculateTotal();
    try {
      const { data: sale, error } = await supabase.from('sales').insert([{
        sale_number: `SALE-${Date.now()}`,
        customer_name: customerName || 'Walk-in Customer',
        total_amount: total,
        payment_method: paymentMethod,
      }]).select().single();

      if (error) throw error;

      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.selling_price,
        subtotal: item.selling_price * item.quantity,
      }));

      await supabase.from('sale_items').insert(saleItems);
      for (const item of cart) {
        await supabase.from('products').update({ current_stock: item.current_stock - item.quantity }).eq('id', item.id);
      }

      setLastSale({ ...sale, items: saleItems });
      setShowReceipt(true);
      setCart([]);
      setAmountReceived('');
    } catch (e) {
      alert("Failed to complete sale");
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const total = calculateTotal();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(product => (
            <button key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-xl border hover:border-amber-500 text-left">
              <p className="font-bold truncate">{product.name}</p>
              <p className="text-amber-600 font-bold mt-2">${product.selling_price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
        <div className="p-4 border-b font-bold flex items-center gap-2 bg-slate-50">
          <ShoppingCart className="w-5 h-5" /> Current Order
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded"><Minus className="w-3 h-3" /></button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded"><Plus className="w-3 h-3" /></button>
                </div>
                <span className="font-bold text-sm">${(item.selling_price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-2 rounded-lg border font-bold ${paymentMethod === 'Cash' ? 'bg-amber-500 text-white' : 'bg-white'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('M-Pesa')} className={`flex-1 py-2 rounded-lg border font-bold ${paymentMethod === 'M-Pesa' ? 'bg-amber-500 text-white' : 'bg-white'}`}>M-Pesa</button>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="p-2 bg-white border rounded space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cash Paid ($)</label>
              <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="w-full font-bold text-lg outline-none" placeholder="0.00" />
              {parseFloat(amountReceived) > total && (
                <div className="text-xs text-green-600 font-bold flex justify-between">
                  <span>CHANGE:</span><span>${(parseFloat(amountReceived) - total).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          <button onClick={handleCompleteSale} disabled={cart.length === 0} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold shadow-md">Complete Sale</button>
        </div>
      </div>
      
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-xs w-full text-center">
            <h2 className="font-bold text-lg">NIT-NIT CEREALS & SHOP</h2>
            <div className="my-4 border-y border-dashed py-4 space-y-1">
              {lastSale.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold"><span>Total</span><span>${parseFloat(lastSale.total_amount).toFixed(2)}</span></div>
            <button onClick={() => setShowReceipt(false)} className="mt-6 w-full py-2 bg-slate-800 text-white rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}