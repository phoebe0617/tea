/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { seedProducts } from './lib/seed';
import Menu from './components/Menu';
import Admin from './components/Admin';
import { Coffee, Settings } from 'lucide-react';

export default function App() {
  useEffect(() => {
    seedProducts();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                <Coffee size={24} />
              </div>
              <span className="text-xl font-bold font-serif tracking-tight text-primary">Tea Time</span>
            </Link>
            
            <nav className="flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">菜單</Link>
              <Link to="/admin" className="text-gray-400 hover:text-primary p-2 rounded-full ring-1 ring-gray-100">
                <Settings size={18} />
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        <footer className="bg-white border-t py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© 2026 Tea Time. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
