import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CheckCircle, Loader2, Barcode, Wallet, Printer, CreditCard, Banknote
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    barcodeInputRef.current?.focus();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
    setLoading(false);
  }

  const handleBarcodeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSearchTerm(code);
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      setSearchTerm(''); 
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
        if (delta > 0 && newQty > item.current_stock) {
            alert("Cannot exceed available stock");
            return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  // --- UPDATED RECEIPT GENERATION ---
  const printReceipt = (saleItems: any[], saleTotal: number, method: string) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = saleItems.map(item => `
      <tr>
        <td style="padding: 5px 0;">${item.name} x${item.quantity}</td>
        <td style="text-align: right;">KES ${(item.selling_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Nit-Nit Cereals</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; line-height: 1.2; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            table { width: 100%; margin: 20px 0; border-collapse: collapse; }
            .total { border-top: 2px dashed #000; padding-top: 10px; font-weight: bold; }
            .method { margin-top: 5px; font-size: 0.9em; font-weight: normal; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>NIT-NIT CEREALS</h2>
            <p>Quality You Can Trust</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <table>
            ${itemsHtml}
          </table>
          <div class="total">
            <div style="display: flex; justify-content: space-between; font-size: 1.2em;">
              <span>TOTAL:</span>
              <span>KES ${saleTotal.toLocaleString()}</span>
            </div>
            <div class="method">Payment Method: ${method}</div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold are not returnable.</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const { error: saleError } = await supabase.from('sales').insert([{
        items: cart,
        total_amount: total,
        payment_method: paymentMethod
      }]);

      if (saleError) throw saleError;

      const stockUpdates = cart.map(item => {
        return supabase
          .from('products')
          .update({ current_stock: item.current_stock - item.quantity })
          .eq('id', item.id);
      });

      await Promise.all(stockUpdates);
      
      printReceipt(cart, total, paymentMethod);

      setCart([]);
      fetchProducts(); 
      setPaymentMethod('Cash'); // Reset to default
    } catch (error: any) {
      alert("Sale Failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Checkout</h1>
          <div className="relative w-96">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              ref={barcodeInputRef}
              placeholder="Scan Barcode or Search..."
              className="w-full bg-white border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold focus:border-amber-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={handleBarcodeSearch}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:border-amber-500 transition-all group shadow-sm"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
              <h3 className="font-black text-slate-900 uppercase truncate">{product.name}</h3>
              <div className="flex justify-between items-end mt-4">
                <p className="text-lg font-black text-amber-600 italic">KES {product.selling_price}</p>
                <p className={`text-[10px] font-bold ${product.current_stock <= product.reorder_level ? 'text-red-500' : 'text-slate-400'}`}>
                    Stock: {product.current_stock}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-[450px] bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-8 border-b pb-6">
          <div className="bg-amber-500 p-3 rounded-2xl text-slate-900">
            <ShoppingCart size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Current Cart</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {cart.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <ShoppingCart size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="font-black uppercase tracking-widest text-xs">Ready for Sale</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1 min-w-0 mr-4">
                <p className="font-black text-slate-900 text-sm uppercase truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-slate-400 italic font-mono">KES {item.selling_price}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-slate-900"><Minus size={14}/></button>
                    <span className="font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-slate-900"><Plus size={14}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* PAYMENT METHOD SELECTOR */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Select Payment Method</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
            >
              <Banknote size={18} /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('M-Pesa')}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${paymentMethod === 'M-Pesa' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
            >
              <CreditCard size={18} /> M-Pesa
            </button>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Grand Total</span>
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