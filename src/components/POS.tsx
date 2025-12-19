import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Trash2, User, CreditCard, Banknote, Receipt, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>(''); // New state for calculator
  const [customerName, setCustomerName] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error loading products:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    const total = calculateTotal();
    const saleNumber = `SALE-${Date.now()}`;

    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            sale_number: saleNumber,
            customer_name: customerName || 'Walk-in Customer',
            total_amount: total,
            payment_method: paymentMethod,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.selling_price,
        subtotal: item.selling_price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ current_stock: item.current_stock - item.quantity })
          .eq('id', item.id);
        if (stockError) console.error('Error updating stock:', stockError);
      }

      setLastSale({ ...sale, items: saleItems });
      setShowReceipt(true);
      setCart([]);
      setCustomerName('');
      setAmountReceived(''); // Reset calculator
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Failed to complete sale');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.current_stock <= 0}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:border-amber-500 transition-all group disabled:opacity-50"
            >
              <p className="font-bold text-slate-800 line-clamp-2">{product.name}</p>
              <p className="text-sm text-slate-500 mt-1">{product.category}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="font-bold text-amber-600">KSh {product.selling_price.toFixed(2)}</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                  Stock: {product.current_stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-4 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-slate-800">
            <ShoppingCart className="w-5 h-5" />
            <h3 className="font-bold">Current Order</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col space-y-2 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-slate-800 flex-1">{item.name}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">-</button>
                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">+</button>
                  </div>
                  <span className="font-bold text-slate-700">KSh {(item.selling_price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-transparent border-0 focus:ring-0 p-0 placeholder:text-slate-400 w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg border transition-all ${
                paymentMethod === 'Cash' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('M-Pesa')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg border transition-all ${
                paymentMethod === 'M-Pesa' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>M-Pesa</span>
            </button>
          </div>

          {/* Cash Change Calculator Section */}
          {paymentMethod === 'Cash' && cart.length > 0 && (
            <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200 shadow-inner">
              <label className="text-xs font-semibold text-slate-500 uppercase">Cash Received</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KSh</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-lg font-bold focus:outline-none"
                />
              </div>
              {parseFloat(amountReceived) > calculateTotal() && (
                <div className="flex justify-between items-center pt-2 text-green-700">
                  <span className="text-sm">Change:</span>
                  <span className="text-lg font-bold">KSh {(parseFloat(amountReceived) - calculateTotal()).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center text-xl font-bold text-slate-800">
            <span>Total</span>
            <span>KSh {calculateTotal().toFixed(2)}</span>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg shadow-amber-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Complete Transaction</span>
          </button>
        </div>
      </div>

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 overflow-hidden relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center border-b border-dashed border-slate-200 pb-6 mb-6">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12">
                <ShoppingCart className="w-8 h-8 text-white -rotate-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">NIT-NIT CEREALS & SHOP</h2>
              <p className="text-sm text-slate-500 mt-1">Order #{lastSale.sale_number}</p>
            </div>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {lastSale.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="font-medium text-slate-800">KSh {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-amber-600">KSh {parseFloat(lastSale.total_amount).toFixed(2)}</span>
              </div>
              <p className="text-center text-xs text-slate-400 mt-6 italic">Thank you for shopping with us!</p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}