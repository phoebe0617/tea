import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, CheckCircle, Clock, Trash2, ChevronRight, LayoutDashboard, UtensilsCrossed } from 'lucide-react';
import { cn } from '../lib/utils';

interface Order {
  id: string;
  items: any[];
  total: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  customerName: string;
}

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    });
    return unsub;
  }, []);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("確定要刪除這筆訂單嗎？")) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error("Delete order error:", err);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    preparing: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">後台管理系統</h1>
          <p className="text-gray-500 mt-1">管理訂單與茶飲菜單</p>
        </div>

        <div className="flex bg-white rounded-xl shadow-sm border p-1 self-start">
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2 rounded-lg transition-all",
              activeTab === 'orders' ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <ClipboardList size={18} />
            <span className="font-bold">即時訂單</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2 rounded-lg transition-all",
              activeTab === 'menu' ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <UtensilsCrossed size={18} />
            <span className="font-bold">菜單管理</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {orders.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-bold">目前沒有任何訂單</p>
              </div>
            ) : (
              orders.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full border", statusColors[order.status])}>
                          {order.status.toUpperCase()}
                        </span>
                        <h3 className="text-sm text-gray-400 mt-2">#{order.id.slice(-6)}</h3>
                      </div>
                      <p className="text-gray-400 text-xs">{order.createdAt?.toDate().toLocaleTimeString()}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold">{item.name}</span>
                            <span className="text-gray-400 ml-2">({item.size})</span>
                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                              {item.ice} / {item.sugar}
                            </div>
                          </div>
                          <span className="text-gray-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center mb-6">
                      <span className="text-gray-500 text-sm">金額總計</span>
                      <span className="text-xl font-bold text-gray-900">${order.total}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="col-span-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                        >
                          開始製作
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="col-span-2 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                        >
                          完成訂單
                        </button>
                      )}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="flex items-center justify-center space-x-1 text-gray-400 hover:text-red-500 text-xs py-2"
                      >
                        <Trash2 size={14} />
                        <span>移除</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl border shadow-sm p-10 text-center"
          >
              <UtensilsCrossed size={48} className="mx-auto text-primary/20 mb-4" />
              <h2 className="text-xl font-bold text-gray-800">菜單管理功能開發中</h2>
              <p className="text-gray-500">此功能將在下一版本開放編輯商品資訊</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
