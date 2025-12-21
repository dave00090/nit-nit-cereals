import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CheckCircle, Loader2, Barcode, Banknote, CreditCard, FolderOpen
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
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

  // --- NEW: SELECT LOCAL FOLDER PERMISSION ---
  const selectReceiptFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      alert("Folder Linked! Receipts will now save to: " + handle.name);
    } catch (err) {
      alert("Folder selection cancelled. Receipts will download to default folder instead.");
    }
  };

  // --- UPDATED: SAVE DIRECTLY TO FOLDER ---
  const saveReceiptToFolder = async (saleItems: any[], saleTotal: number, method: string) => {
    const date = new Date();
    const fileName = `NitNit_Receipt_${date.getTime()}.html`;

    const itemsHtml = saleItems.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x${item.quantity}</td>
        <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">KES ${(item.selling_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const content = `
      <html>
        <body style="font-family: monospace; width: 300px; padding: 20px;">
          <h2 style="text-align: center;">NIT-NIT CEREALS</h2>
          <p style="text-align: center;">${date.toLocaleString()}</p>
          <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
          <p><strong>TOTAL: KES ${saleTotal.toLocaleString()}</strong></p>
          <p>Method: ${method}</p>
        </body>
      </html>
    `;

    if (directoryHandle) {
      try {
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err) {
        console.error("Folder save failed, falling back to download", err);
        fallbackDownload(content, fileName);
      }
    } else {
      fallbackDownload(content, fileName);
    }
  };

  const fallbackDownload = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
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
        return supabase.from('products').update({ current_stock: item.current_stock - item.quantity }).eq('id', item.id);
      });
      await Promise.all(stockUpdates);
      
      await saveReceiptToFolder(cart, total, paymentMethod);

      setCart([]);
      fetchProducts(); 
    } catch (error: any) {
      alert("Sale Failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = (product: any) => {
    if (product.current_stock <= 0) { alert("Out of Stock!"); return; }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Checkout</h1>
          <button 
            onClick={selectReceiptFolder}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${directoryHandle ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}
          >
            <FolderOpen size={16} />
            {directoryHandle ? 'Folder Linked' : 'Link "Nit-Nit Receipts" Folder'}
          </button>
        </div>

        <div className="relative w-full mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              ref={barcodeInputRef}
              placeholder="Scan Barcode or Search..."
              className="w-full bg-white border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold focus:border-amber-500 outline-none"
              value={searchTerm}
              onChange={(e) => {
                const code = e.target.value;
                setSearchTerm(code);
                const p = products.find(p => p.barcode === code);
                if (p) { addToCart(p); setSearchTerm(''); }
              }}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <button key={product.id} onClick={() => addToCart(product)} className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:border-amber-500 shadow-sm transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase">{product.category}</p>
              <h3 className="font-black text-slate-900 uppercase truncate">{product.name}</h3>
              <p className="text-lg font-black text-amber-600 italic mt-4">KES {product.selling_price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-[450px] bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-8 border-b pb-6">
          <div className="bg-amber-500 p-3 rounded-2xl text-slate-900"><ShoppingCart size={24} /></div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">Cart</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1 min-w-0 mr-4">
                <p className="font-black text-slate-900 text-sm uppercase truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-slate-400">KES {item.selling_price}</p>
              </div>
              <span className="font-black text-slate-900 px-3">x{item.quantity}</span>
              <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
          ))}
        </div>

        <div className="mb-6 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPaymentMethod('Cash')} className={`p-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('M-Pesa')} className={`p-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${paymentMethod === 'M-Pesa' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'}`}>M-Pesa</button>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-black uppercase text-xs">Total</span>
            <span className="text-4xl font-black text-slate-900 italic">KES {total.toLocaleString()}</span>
          </div>
          <button onClick={completeSale} disabled={isProcessing || cart.length === 0} className="w-full bg-slate-900 text-amber-500 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
            {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}