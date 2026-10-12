import React, { useState } from 'react';
import {
  Package,
  Sparkles,
  Edit,
  Save,
  CheckCircle2,
  X,
  Search,
  Award,
  Layers,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Product, User } from '../../types';
import { store } from '../../services/store';

import hubImg from '../../assets/images/ecommerce_global_hub_1791311386426.jpg';
import showcaseImg from '../../assets/images/digital_commerce_showcase_1791311399768.jpg';
import opsImg from '../../assets/images/marketplace_operations_1791311411443.jpg';
import rolexImg from '../../assets/images/luxury_watch_product_1791311423067.jpg';

const PRESET_IMAGES = [
  { label: 'Luxury Steel Watch', url: rolexImg },
  { label: 'Global Tech Showcase', url: showcaseImg },
  { label: 'E-Commerce Hub', url: hubImg },
  { label: 'Marketplace Operations', url: opsImg },
];

interface AdminProductsManagerProps {
  currentAdmin: User;
  onProductsChanged?: () => void;
}

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({
  currentAdmin,
  onProductsChanged,
}) => {
  // Active tier configuration selector: 'SILVER' or 'GOLD'
  const [selectedTier, setSelectedTier] = useState<'SILVER' | 'GOLD'>('SILVER');

  // Header configs for Silver & Gold
  const [silverMain, setSilverMain] = useState<Product>(store.getSilverMainConfig());
  const [goldMain, setGoldMain] = useState<Product>(store.getGoldMainConfig());
  const [mainSavedMsg, setMainSavedMsg] = useState('');

  // 25 Products for each tier (completely isolated records)
  const [silverProducts, setSilverProducts] = useState<Product[]>(store.getSilverProducts());
  const [goldProducts, setGoldProducts] = useState<Product[]>(store.getGoldProducts());

  // Search & Edit Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Save Main Header Config
  const handleSaveMainConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTier === 'SILVER') {
      store.updateSilverMainConfig(silverMain);
      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_SILVER_CONFIG',
        target: silverMain.name,
        details: `Silver main asset updated: $${silverMain.price.toFixed(2)} (${(silverMain.commissionRate * 100).toFixed(0)}% commission)`,
      });
      setMainSavedMsg('Silver configuration saved successfully!');
    } else {
      store.updateGoldMainConfig(goldMain);
      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_GOLD_CONFIG',
        target: goldMain.name,
        details: `Gold main package updated: $${goldMain.price.toFixed(2)} (${(goldMain.commissionRate * 100).toFixed(0)}% commission)`,
      });
      setMainSavedMsg('Gold configuration saved successfully!');
    }

    setTimeout(() => setMainSavedMsg(''), 2500);
    if (onProductsChanged) onProductsChanged();
  };

  // Save Individual Order (1 to 25) for active tier
  const handleSaveOrderProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (selectedTier === 'SILVER') {
      // Save strictly to Silver
      store.updateSilverProduct(editingProduct);
      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_SILVER_ORDER',
        target: editingProduct.name,
        details: `Silver ${editingProduct.id} updated: $${editingProduct.price.toFixed(2)} (${(editingProduct.commissionRate * 100).toFixed(0)}% commission)`,
      });
      const updated = store.getSilverProducts();
      setSilverProducts(updated);
      setEditSuccessMsg(`Silver Order #${editingProduct.id.replace('silver-prod-', '')} saved successfully and updated in Silver customer cycles!`);
    } else {
      // Save strictly to Gold
      store.updateGoldProduct(editingProduct);
      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_GOLD_ORDER',
        target: editingProduct.name,
        details: `Gold ${editingProduct.id} updated: $${editingProduct.price.toFixed(2)} (${(editingProduct.commissionRate * 100).toFixed(0)}% commission)`,
      });
      const updated = store.getGoldProducts();
      setGoldProducts(updated);
      setEditSuccessMsg(`Gold Order #${editingProduct.id.replace('gold-prod-', '')} saved successfully and updated in Gold customer cycles!`);
    }

    setTimeout(() => {
      setEditSuccessMsg('');
      setEditingProduct(null);
    }, 1500);

    if (onProductsChanged) onProductsChanged();
  };

  // Active products list depending on selected tier
  const activeProductsList = selectedTier === 'SILVER' ? silverProducts : goldProducts;
  const filteredProducts = activeProductsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.marketplace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Package className="w-5 h-5 text-[#E6B92F]" />
          <span>Product & Order Cycle Management</span>
        </h2>
        <p className="text-xs text-[#A5A5AE]">
          Two independent product systems: Silver Product (Orders 1–25) and Gold Product (Orders 1–25). Silver and Gold never share records.
        </p>
      </div>

      {/* ============================================================== */}
      {/* TIER SELECTOR BUTTONS / CARDS: [ SILVER PRODUCT ] [ GOLD PRODUCT ] */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. SILVER SELECTOR BUTTON / CARD */}
        <div
          onClick={() => setSelectedTier('SILVER')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-xl ${
            selectedTier === 'SILVER'
              ? 'bg-[#14141c] border-slate-300 ring-2 ring-slate-400/30 shadow-slate-900/40'
              : 'bg-[#111116] border-[#282417] hover:border-slate-500/50 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
              Ag
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-200">
                  Silver Product
                </h3>
                {selectedTier === 'SILVER' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-extrabold">
                    ACTIVE TIER
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A5A5AE] mt-0.5">
                Silver Orders 1–25 for Standard Customers
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-300 block">
              25 Orders
            </span>
            <span className="text-[11px] text-[#21D39B] font-bold">25% Commission</span>
          </div>
        </div>

        {/* 2. GOLD SELECTOR BUTTON / CARD */}
        <div
          onClick={() => setSelectedTier('GOLD')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-xl ${
            selectedTier === 'GOLD'
              ? 'bg-[#1c1708] border-[#E6B92F] ring-2 ring-[#E6B92F]/30 shadow-[#E6B92F]/10'
              : 'bg-[#111116] border-[#282417] hover:border-[#E6B92F]/50 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E6B92F] to-[#b38814] flex items-center justify-center text-black font-black text-lg shadow-md">
              Au
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-[#E6B92F]">
                  Gold Product
                </h3>
                {selectedTier === 'GOLD' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6B92F] text-black font-extrabold">
                    ACTIVE TIER
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A5A5AE] mt-0.5">
                Gold Orders 1–25 for VIP Gold Customers
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#E6B92F] block">
              25 Orders
            </span>
            <span className="text-[11px] text-[#21D39B] font-bold">35% VIP Commission</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: ACTIVE TIER MAIN CONFIGURATION CARD                 */}
      {/* ============================================================== */}
      <div
        className={`bg-[#111116] rounded-3xl p-6 sm:p-7 shadow-xl border-2 transition-all ${
          selectedTier === 'SILVER'
            ? 'border-slate-400/50'
            : 'border-[#E6B92F]/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#282417] mb-5">
          <div className="flex items-center gap-3">
            <Award
              className={`w-5 h-5 ${
                selectedTier === 'SILVER' ? 'text-slate-300' : 'text-[#E6B92F]'
              }`}
            />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {selectedTier === 'SILVER' ? 'Silver Product Configuration' : 'Gold Product Configuration'}
              </h3>
              <p className="text-[11px] text-[#A5A5AE]">
                {selectedTier === 'SILVER'
                  ? 'Base tier configuration for Silver customers'
                  : 'Exclusive high-yield VIP configuration for Gold accounts'}
              </p>
            </div>
          </div>

          {mainSavedMsg && (
            <span className="text-xs font-bold text-[#21D39B] flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{mainSavedMsg}</span>
            </span>
          )}
        </div>

        {/* Live Preview & Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Preview Box (4 cols) */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#161620] border border-[#282417] flex items-center gap-4">
            <img
              src={selectedTier === 'SILVER' ? silverMain.imageUrl : goldMain.imageUrl}
              alt="Tier Main Preview"
              className="w-20 h-20 object-cover rounded-xl border border-[#282417] shrink-0"
            />
            <div className="min-w-0 flex-1 text-xs">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  selectedTier === 'SILVER'
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-[#E6B92F]/20 text-[#E6B92F]'
                }`}
              >
                {selectedTier} PRODUCT
              </span>
              <p className="font-bold text-white text-xs truncate mt-1">
                {selectedTier === 'SILVER' ? silverMain.name : goldMain.name}
              </p>
              <p className="text-[10px] text-[#A5A5AE]">
                {selectedTier === 'SILVER' ? silverMain.marketplace : goldMain.marketplace} •{' '}
                {selectedTier === 'SILVER' ? silverMain.category : goldMain.category}
              </p>
              <div className="flex items-center gap-3 mt-1.5 font-bold">
                <span className="text-white text-sm">
                  ${(selectedTier === 'SILVER' ? silverMain.price : goldMain.price).toFixed(2)}
                </span>
                <span className="text-[#21D39B]">
                  +{(((selectedTier === 'SILVER' ? silverMain.price : goldMain.price) * (selectedTier === 'SILVER' ? silverMain.commissionRate : goldMain.commissionRate))).toFixed(2)} USDT
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields (8 cols) */}
          <form onSubmit={handleSaveMainConfig} className="lg:col-span-8 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">
                  {selectedTier} Product Name
                </label>
                <input
                  type="text"
                  required
                  value={selectedTier === 'SILVER' ? silverMain.name : goldMain.name}
                  onChange={(e) =>
                    selectedTier === 'SILVER'
                      ? setSilverMain({ ...silverMain, name: e.target.value })
                      : setGoldMain({ ...goldMain, name: e.target.value })
                  }
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={selectedTier === 'SILVER' ? silverMain.price : goldMain.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      selectedTier === 'SILVER'
                        ? setSilverMain({ ...silverMain, price: val })
                        : setGoldMain({ ...goldMain, price: val });
                    }}
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Commission Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={selectedTier === 'SILVER' ? silverMain.commissionRate : goldMain.commissionRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0.25;
                      selectedTier === 'SILVER'
                        ? setSilverMain({ ...silverMain, commissionRate: val })
                        : setGoldMain({ ...goldMain, commissionRate: val });
                    }}
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Image URL / Preset</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={selectedTier === 'SILVER' ? silverMain.imageUrl : goldMain.imageUrl}
                    onChange={(e) =>
                      selectedTier === 'SILVER'
                        ? setSilverMain({ ...silverMain, imageUrl: e.target.value })
                        : setGoldMain({ ...goldMain, imageUrl: e.target.value })
                    }
                    className="flex-1 bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        selectedTier === 'SILVER'
                          ? setSilverMain({ ...silverMain, imageUrl: e.target.value })
                          : setGoldMain({ ...goldMain, imageUrl: e.target.value });
                      }
                    }}
                    className="bg-[#181822] border border-[#282417] text-[#A5A5AE] text-[11px] rounded-xl px-2 py-1"
                  >
                    <option value="">Preset</option>
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.label} value={img.url}>{img.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Marketplace</label>
                <input
                  type="text"
                  value={selectedTier === 'SILVER' ? silverMain.marketplace : goldMain.marketplace}
                  onChange={(e) =>
                    selectedTier === 'SILVER'
                      ? setSilverMain({ ...silverMain, marketplace: e.target.value })
                      : setGoldMain({ ...goldMain, marketplace: e.target.value })
                  }
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className={`py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'SILVER'
                    ? 'bg-slate-200 hover:bg-white text-slate-950'
                    : 'bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save {selectedTier} Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: ORDERS 1–25 FOR THE SELECTED TIER                   */}
      {/* ============================================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282417]">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedTier === 'SILVER' ? 'bg-slate-300' : 'bg-[#E6B92F]'
                }`}
              />
              <h3 className="text-base font-bold uppercase tracking-wider text-white">
                {selectedTier === 'SILVER' ? 'Silver Orders 1–25' : 'Gold Orders 1–25'}
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedTier === 'SILVER'
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-[#E6B92F]/20 text-[#E6B92F]'
                }`}
              >
                {selectedTier} ONLY
              </span>
            </div>
            <p className="text-xs text-[#A5A5AE] mt-0.5">
              Order #1 through Order #25 contain {selectedTier}-specific data. Changes apply strictly to {selectedTier} customer accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#A5A5AE] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search ${selectedTier} 25 orders...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111116] border border-[#282417] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E6B92F] w-48 sm:w-60"
              />
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                selectedTier === 'SILVER'
                  ? 'bg-slate-800 text-slate-200 border-slate-600'
                  : 'bg-[#181822] text-[#E6B92F] border-[#E6B92F]/40'
              }`}
            >
              25 {selectedTier} Orders
            </span>
          </div>
        </div>

        {editSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
            <span>{editSuccessMsg}</span>
          </div>
        )}

        {/* Orders 1 to 25 Grid for Selected Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {filteredProducts.map((prod, index) => {
            const orderNum = index + 1;
            return (
              <div
                key={prod.id}
                className={`bg-[#111116] border rounded-2xl p-3 flex flex-col justify-between transition-all group ${
                  selectedTier === 'SILVER'
                    ? 'border-[#282417] hover:border-slate-400'
                    : 'border-[#282417] hover:border-[#E6B92F]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        selectedTier === 'SILVER' ? 'text-slate-300' : 'text-[#E6B92F]'
                      }`}
                    >
                      {selectedTier} Order #{orderNum}
                    </span>
                    <span className="text-[10px] text-[#A5A5AE] font-mono">
                      {prod.marketplace}
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-[#282417]">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <p className="font-semibold text-white text-xs line-clamp-2 leading-tight">
                    {prod.name}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#282417]/60">
                    <span className="font-bold text-white">${prod.price.toFixed(2)}</span>
                    <span className="text-[#21D39B] font-bold text-[11px]">
                      +${(prod.price * prod.commissionRate).toFixed(2)} ({(prod.commissionRate * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-[#282417]/40">
                  <button
                    onClick={() => setEditingProduct({ ...prod })}
                    className={`w-full py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedTier === 'SILVER'
                        ? 'bg-[#181822] hover:bg-slate-300 text-slate-300 hover:text-black'
                        : 'bg-[#181822] hover:bg-[#E6B92F] text-[#A5A5AE] hover:text-black'
                    }`}
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit {selectedTier} #{orderNum}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* EDIT MODAL FOR INDIVIDUAL ORDER (1 to 25) IN SELECTED TIER     */}
      {/* ============================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={`w-full max-w-md bg-[#111116] border-2 rounded-3xl p-6 shadow-2xl relative ${
              selectedTier === 'SILVER' ? 'border-slate-400' : 'border-[#E6B92F]'
            }`}
          >
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A5A5AE] hover:text-white hover:bg-[#181822] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Edit {selectedTier} Order Details</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    selectedTier === 'SILVER'
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-[#E6B92F]/20 text-[#E6B92F]'
                  }`}
                >
                  {editingProduct.id}
                </span>
              </h3>
              <p className="text-xs text-[#A5A5AE]">
                Modifications save only to {selectedTier} and update {selectedTier} customer task sequences.
              </p>
            </div>

            {/* Preview Card */}
            <div className="p-3 rounded-2xl bg-[#181822] border border-[#282417] flex items-center gap-3 mb-4">
              <img
                src={editingProduct.imageUrl}
                alt={editingProduct.name}
                className="w-14 h-14 object-cover rounded-xl border border-[#282417]"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-white truncate">{editingProduct.name}</p>
                <p className="text-[#A5A5AE] text-[11px]">
                  {editingProduct.marketplace} • {editingProduct.category}
                </p>
                <p className="font-extrabold text-white mt-0.5">
                  ${editingProduct.price.toFixed(2)} USDT •{' '}
                  <span className="text-[#21D39B]">
                    +${(editingProduct.price * editingProduct.commissionRate).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveOrderProduct} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Price (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Commission Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.commissionRate}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        commissionRate: parseFloat(e.target.value) || 0.25,
                      })
                    }
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Marketplace</label>
                  <input
                    type="text"
                    value={editingProduct.marketplace}
                    onChange={(e) => setEditingProduct({ ...editingProduct, marketplace: e.target.value })}
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Product Photo / Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProduct.imageUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    className="flex-1 bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                    placeholder="Enter Image URL"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setEditingProduct({ ...editingProduct, imageUrl: e.target.value });
                    }}
                    className="bg-[#181822] border border-[#282417] text-[#A5A5AE] text-[11px] rounded-xl px-2 py-1"
                  >
                    <option value="">Preset</option>
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.label} value={img.url}>{img.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#181822] hover:bg-[#20202d] text-[#A5A5AE] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedTier === 'SILVER'
                      ? 'bg-slate-200 hover:bg-white text-slate-950'
                      : 'bg-[#E6B92F] hover:bg-[#d8ab25] text-black'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save {selectedTier} Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
