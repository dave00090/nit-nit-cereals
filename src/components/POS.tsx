import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CheckCircle, Loader2, Barcode, Banknote, CreditCard, FolderOpen, Package
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
    const { data } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (data) setProducts(data);
    setLoading(false);
  }

  const selectReceiptFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      alert("Folder Linked Successfully!");
    } catch (err) {
      alert("Manual download will be used.");
    }
  };

  const saveReceiptToFolder = async (saleItems: any[], saleTotal: number, method: string) => {
    const date = new Date();
    const fileName = `NitNit_Receipt_${date.getTime()}.html`;
    const itemsHtml = saleItems.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x${item.quantity}</td>
        <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">KES ${(item.selling_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const content = `<html><body style="font-family:monospace;width:300px;padding:20px;"><h2>NIT-NIT CEREALS</h2><p>${date.toLocaleString()}</p><table>${itemsHtml}</table><p><strong>TOTAL: KES ${saleTotal.toLocaleString()}</strong></p><p>Method: ${method}</p></body></html>`;

    if (directoryHandle) {
      try {
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err) { fallbackDownload(content, fileName); }
    } else { fallbackDownload(content, fileName); }
  };

  const fallbackDownload = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
  };

  const addToCart = (product: any) => {
    if (product.current_stock <= 0) {
      alert("Out of Stock!");
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.current_stock) {
        alert("Cannot exceed available stock!");
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
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

      const stockUpdates = cart.map(item => supabase.from('products').update({ current_stock: item.current_stock - item.quantity }).eq('id', item.id));
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

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* LEFT SIDE: PRODUCT BROWSER */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Checkout</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Select items to sell</p>
          </div>
          <button 
            onClick={selectReceiptFolder}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all uppercase shadow-sm border ${directoryHandle ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-200'}`}
          >
            <FolderOpen size={16} />
            {directoryHandle ? 'Folder Linked' : 'Link Receipts Folder'}
          </button>
        </div>

        {/* SEARCH & BARCODE */}
        <div className="relative mb-8">
          <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            ref={barcodeInputRef}
            placeholder="Scan Barcode or Search Product Name..."
            className="w-full bg-white border-2 border-slate-100 p-5 pl-14 rounded-[2rem] font-bold text-lg focus:border-amber-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              const p = products.find(p => p.barcode === e.target.value);
              if (p) { addToCart(p); setSearchTerm(''); }
            }}
          />
        </div>

        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <button 
                key={product.id} 
                onClick={() => addToCart(product)} 
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 text-left hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all group flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${product.current_stock <= product.reorder_level ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.current_stock <= product.reorder_level ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                      {product.current_stock <= product.reorder_level ? 'Low Stock' : 'In Stock'}
                    </span>
                    <p className="text-[10px] font-black text-slate-300 uppercase">{product.category}</p>
                  </div>
                  <h3 className="font-black text-slate-800 uppercase text-lg leading-tight group-hover:text-amber-600 transition-colors">{product.name}</h3>
                </div>

                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                    <p className="text-xl font-black text-slate-900 italic">KES {product.selling_price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                    <p className="font-black text-slate-700">{product.current_stock} <span className="text-[10px]">{product.unit}</span></p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: CART SIDEBAR */}
      <div className="w-[480px] bg-white border-l border-slate-200 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl text-amber-500 shadow-lg shadow-slate-900/10">
              <ShoppingCart size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Your Cart</h2>
          </div>
          <span className="bg-white px-4 py-2 rounded-xl border font-black text-slate-400 text-sm">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
              <Package size={80} strokeWidth={1} className="mb-4" />
              <p className="font-black uppercase tracking-[0.3em] text-xs">Waiting for Scans</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-black text-slate-900 uppercase text-sm truncate">{item.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">KES {item.selling_price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center bg-white border rounded-xl overflow-hidden font-black">
                      <button onClick={() => item.quantity > 1 && setCart(cart.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i))} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900"><Minus size={14}/></button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900"><Plus size={14}/></button>
                   </div>
                   <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 size={20}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPaymentMethod('Cash')} className={`flex items-center justify-center gap-3 p-5 rounded-[1.5rem] font-black uppercase text-xs transition-all border-2 ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}><Banknote size={18} /> Cash</button>
              <button onClick={() => setPaymentMethod('M-Pesa')} className={`flex items-center justify-center gap-3 p-5 rounded-[1.5rem] font-black uppercase text-xs transition-all border-2 ${paymentMethod === 'M-Pesa' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}><CreditCard size={18} /> M-Pesa</button>
            </div>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Grand Total</span>
            <span className="text-4xl font-black text-slate-900 italic">KES {total.toLocaleString()}</span>
          </div>

          <button 
            onClick={completeSale} 
            disabled={isProcessing || cart.length === 0} 
            className="w-full bg-slate-900 text-amber-500 py-7 rounded-[2.5rem] font-black uppercase text-lg tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={28} strokeWidth={3}/> Complete Sale</>}
          </button>
        </div>
      </div>
    </div>
  );
}