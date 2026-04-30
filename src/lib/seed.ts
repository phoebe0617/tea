import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const INITIAL_PRODUCTS = [
  {
    name: "雪花冷露",
    description: "經典冬瓜茶與鮮奶的完美比例",
    priceM: 35,
    priceL: 40,
    category: "乎乾冬瓜",
    available: true
  },
  {
    name: "熟成冷露",
    description: "古法熬煮冬瓜茶，香濃解膩",
    priceM: 40,
    priceL: 45,
    category: "乎乾冬瓜",
    available: true
  },
  {
    name: "春芽冷露",
    description: "綠茶與冬瓜的清爽碰撞",
    priceM: 40,
    priceL: 45,
    category: "乎乾冬瓜",
    available: true
  },
  {
    name: "胭脂冷露",
    description: "帶有蜜桃香氣的紅茶冬瓜",
    priceM: 45,
    priceL: 50,
    category: "乎乾冬瓜",
    available: true
  },
  {
    name: "檸檬冷露",
    description: "新鮮檸檬汁與冬瓜的酸甜滋味",
    priceM: 50,
    priceL: 60,
    category: "乎乾冬瓜",
    available: true
  }
];

export async function seedProducts() {
  const q = query(collection(db, 'products'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("Seeding products...");
    for (const product of INITIAL_PRODUCTS) {
      await addDoc(collection(db, 'products'), product);
    }
  }
}
