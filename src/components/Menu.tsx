import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Minus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  priceM: number;
  priceL: number;
  category: string;
  image?: string;
  available: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  size: 'M' | 'L';
  ice: string;
  sugar: string;
  price: number;
  quantity: number;
}

const ICE_OPTIONS = ["正常冰", "少冰", "微冰", "去冰", "常溫", "熱"];
const SUGAR_OPTIONS = ["全糖", "七分", "半糖", "三分", "一分", "無糖"];

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Customization state
  const [size, setSize] = useState<'M' | 'L'>('M');
  const [ice, setIce] = useState(ICE_OPTIONS[0]);
  const [sugar, setSugar] = useState(SUGAR_OPTIONS[0]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    }, (error) => {
      console.error("Firestore Error: ", error);
    });
    return unsub;
  }, []);

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const existingItemIndex = cart.findIndex(
      item => 
        item.productId === selectedProduct.id && 
        item.size === size && 
        item.ice === ice && 
        item.sugar === sugar
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        size,
        ice,
        sugar,
        price: size === 'M' ? selectedProduct.priceM : selectedProduct.priceL,
        quantity: 1
      };
      setCart([...cart, newItem]);
    }
    
    setIsOrdering(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;

    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: serverTimestamp(),
        customerName: "訪客", // Simplified for now
      });
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      console.error("Submit order error:", err);
    }
  };

  // Dedup products by name for display to handle accidental DB duplicates
  const uniqueProducts = Array.from(new Map(products.map(p => [p.name, p])).values()) as Product[];
  const categories = Array.from(new Set(uniqueProducts.map(p => p.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          {categories.map(cat => (
            <div key={cat} className="mb-10">
              <h2 className="text-2xl font-serif font-bold text-primary mb-6 border-l-4 border-primary pl-4">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueProducts.filter(p => p.category === cat && p.available).map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={p.id}
                    onClick={() => { setSelectedProduct(p); setIsOrdering(true); }}
                    className="tea-card-glass p-4 rounded-xl cursor-pointer hover:border-primary/40 transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                      <div className="flex space-x-4 mt-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">M: ${p.priceM}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">L: ${p.priceL}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus size={20} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingBag className="text-primary" />
              <h2 className="text-xl font-bold">目前訂單</h2>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 px-1">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-10">您的購物車是空的</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="border-b pb-3 border-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                          {item.size} / {item.ice} / {item.sugar}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500 p-1">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 transition-all border border-transparent hover:border-gray-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 transition-all border border-transparent hover:border-gray-100"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-primary font-bold text-sm">
                        ${item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold mb-6 text-gray-800">
                <span>總計</span>
                <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={submitOrder}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                確認送出
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {isOrdering && selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsOrdering(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  <button onClick={() => setIsOrdering(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-500 mb-8">{selectedProduct.description}</p>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">容量選擇</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSize('M')}
                      className={cn(
                        "py-3 rounded-xl border-2 transition-all flex justify-between px-4",
                        size === 'M' ? "border-primary bg-primary/5 text-primary font-bold" : "border-gray-100 text-gray-500"
                      )}
                    >
                      <span>中杯 (M)</span>
                      <span>${selectedProduct.priceM}</span>
                    </button>
                    <button
                      onClick={() => setSize('L')}
                      className={cn(
                        "py-3 rounded-xl border-2 transition-all flex justify-between px-4",
                        size === 'L' ? "border-primary bg-primary/5 text-primary font-bold" : "border-gray-100 text-gray-500"
                      )}
                    >
                      <span>大杯 (L)</span>
                      <span>${selectedProduct.priceL}</span>
                    </button>
                  </div>
                </div>

                {/* Ice Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">冰塊調整</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ICE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setIce(opt)}
                        className={cn(
                          "py-2 px-1 rounded-lg border text-sm transition-all",
                          ice === opt ? "bg-primary border-primary text-white" : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sugar Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">甜度調整</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUGAR_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSugar(opt)}
                        className={cn(
                          "py-2 px-1 rounded-lg border text-sm transition-all",
                          sugar === opt ? "bg-primary border-primary text-white" : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  加入購物車
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-3"
          >
            <CheckCircle2 />
            <span className="font-bold">訂單已送出，請稍候！</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
