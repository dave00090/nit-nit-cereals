import { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../lib/types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Money'>('Cash');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [showMpesaConfirm, setShowMpesaConfirm] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('current_stock', 0)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        alert('Not enough stock available');
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * product.selling_price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          subtotal: product.selling_price,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((item) => item.product.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.current_stock) {
      alert('Not enough stock available');
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.selling_price,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const generateSaleNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SALE-${timestamp}`;
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const saleNumber = generateSaleNumber();
    const totalAmount = calculateTotal();

    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            sale_number: saleNumber,
            customer_name: customerName,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            notes: notes,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        const newStock = item.product.current_stock - item.quantity;
        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', item.product.id);

        await supabase.from('stock_movements').insert([
          {
            product_id: item.product.id,
            movement_type: 'SALE',
            quantity: -item.quantity,
            reference_id: saleData.id,
            notes: `Sale ${saleNumber}`,
          },
        ]);
      }

      setLastSale({ ...saleData, items: cart });
      setShowReceipt(true);

      setCart([]);
      setCustomerName('');
      setNotes('');
      loadProducts();

      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Failed to complete sale. Please try again.');
    }
  };

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const barcode = barcodeInput.trim();
      const product = products.find((p) => p.barcode === barcode);

      if (product) {
        addToCart(product);
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
      } else {
        alert('Product with barcode ' + barcode + ' not found');
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
      }
    }
  };

  const handleMpesaPayment = () => {
    const total = calculateTotal();
    setMpesaAmount(total.toFixed(2));
    setShowMpesaConfirm(true);
  };

  const confirmMpesaPayment = async () => {
    setPaymentMethod('Mobile Money');
    setShowMpesaConfirm(false);
    await completeSale();
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: monospace; padding: 20px; }');
        printWindow.document.write('.receipt { max-width: 400px; margin: 0 auto; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Point of Sale</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Barcode Scanner</label>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or press Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeInput}
                autoFocus
                className="w-full px-4 py-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Search Products</label>
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-4">Available Products</h3>
            {loading ? (
              <p className="text-slate-500 text-center py-8">Loading products...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="text-left p-4 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all"
                  >
                    <h4 className="font-semibold text-slate-800">{product.name}</h4>
                    <p className="text-sm text-slate-600">{product.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-amber-600">${product.selling_price.toFixed(2)}</span>
                      <span className="text-xs text-slate-500">
                        Stock: {product.current_stock} {product.unit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-800">Cart</h3>
              <span className="ml-auto text-sm text-slate-600">({cart.length} items)</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.product.name}</p>
                        <p className="text-sm text-slate-600">${item.product.selling_price.toFixed(2)} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-slate-800">${item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-slate-800">Total:</span>
                <span className="text-amber-600">${calculateTotal().toFixed(2)}</span>
              </div>

              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      paymentMethod === 'Cash'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto" />
                    <span className="text-xs mt-1 block">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      paymentMethod === 'Card'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto" />
                    <span className="text-xs mt-1 block">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('Mobile Money')}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      paymentMethod === 'Mobile Money'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto" />
                    <span className="text-xs mt-1 block">Mobile</span>
                  </button>
                  <button
                    onClick={handleMpesaPayment}
                    className="p-2 rounded-lg border-2 border-green-600 bg-green-50 hover:bg-green-100 transition-all text-green-600 font-semibold"
                  >
                    <span className="text-2xl block mb-1">M</span>
                    <span className="text-xs block">M-Pesa</span>
                  </button>
                </div>
              </div>

              <textarea
                placeholder="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                rows={2}
              />

              <button
                onClick={completeSale}
                disabled={cart.length === 0}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMpesaConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">M-Pesa Payment</h3>
            </div>

            <div className="p-8 text-center space-y-4">
              <div className="bg-green-50 rounded-lg p-6">
                <p className="text-sm text-slate-600 mb-2">Amount to Pay</p>
                <p className="text-4xl font-bold text-green-600">${mpesaAmount}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 text-left">
                <p className="text-sm text-slate-600 font-medium mb-2">Till Number</p>
                <p className="text-2xl font-bold text-slate-800 font-mono">362692</p>
              </div>

              <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800">Instructions</p>
                <p className="text-sm text-blue-700 mt-2">
                  1. On your phone, dial *334# or open M-Pesa app<br/>
                  2. Select "Lipa na M-Pesa Online"<br/>
                  3. Enter till number: 362692<br/>
                  4. Enter amount: {mpesaAmount}<br/>
                  5. Enter your M-Pesa PIN<br/>
                  6. Complete the transaction
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowMpesaConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMpesaPayment}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
                >
                  Payment Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Receipt</h3>
              <div className="flex space-x-2">
                <button
                  onClick={printReceipt}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div ref={receiptRef} className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">CEREALS SHOP</h2>
                <p className="text-xs text-slate-600">Management System</p>
                <p className="text-xs text-slate-600 mt-1">Receipt</p>
              </div>

              <div className="border-t border-b border-slate-300 py-2 mb-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Sale #:</span>
                  <span className="font-semibold">{lastSale.sale_number}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Date:</span>
                  <span>{new Date(lastSale.created_at).toLocaleString()}</span>
                </div>
                {lastSale.customer_name && (
                  <div className="flex justify-between mb-1">
                    <span>Customer:</span>
                    <span>{lastSale.customer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span>{lastSale.payment_method}</span>
                </div>
              </div>

              <div className="mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Price</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSale.items.map((item: CartItem) => (
                      <tr key={item.product.id} className="border-b border-slate-200">
                        <td className="py-1">{item.product.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">${item.product.selling_price.toFixed(2)}</td>
                        <td className="text-right py-1">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-300 pt-2 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span>${parseFloat(lastSale.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-600">
                <p>Thank you for your business!</p>
                <p className="mt-2">Please visit again</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
