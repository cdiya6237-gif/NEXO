import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Link,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { PromotionalBanner, User } from '../../types';
import { store } from '../../services/store';

import hubImg from '../../assets/images/ecommerce_global_hub_1791311386426.jpg';
import showcaseImg from '../../assets/images/digital_commerce_showcase_1791311399768.jpg';
import opsImg from '../../assets/images/marketplace_operations_1791311411443.jpg';
import rolexImg from '../../assets/images/luxury_watch_product_1791311423067.jpg';

const PRESET_BANNER_IMAGES = [
  { label: 'E-Commerce Global Hub', url: hubImg },
  { label: 'Digital Commerce Showcase', url: showcaseImg },
  { label: 'Marketplace Operations', url: opsImg },
  { label: 'Luxury Watch Showcase', url: rolexImg },
];

interface AdminBannersManagerProps {
  currentAdmin: User;
  onBannersChanged?: () => void;
}

export const AdminBannersManager: React.FC<AdminBannersManagerProps> = ({
  currentAdmin,
  onBannersChanged,
}) => {
  const [banners, setBanners] = useState<PromotionalBanner[]>(store.getBanners());
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formButtonText, setFormButtonText] = useState('Start Orders');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'preset'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger Edit Modal
  const handleOpenEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setIsCreatingNew(false);
    setFormTitle(banner.title);
    setFormDescription(banner.description);
    setFormButtonText(banner.buttonText || 'Start Orders');
    setFormImageUrl(banner.imageUrl);
    setFormStatus(banner.status || 'active');
    setImageInputMode('url');
    setErrorMessage('');
  };

  // Trigger Add New Banner Modal
  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingBanner(null);
    setFormTitle('');
    setFormDescription('');
    setFormButtonText('Explore Opportunities');
    setFormImageUrl(hubImg);
    setFormStatus('active');
    setImageInputMode('upload');
    setErrorMessage('');
  };

  // Image File Upload Handler (Converts uploaded image to base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
        setErrorMessage('');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Save Banner (Add or Edit)
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMessage('Banner title cannot be empty.');
      return;
    }
    if (!formImageUrl.trim()) {
      setErrorMessage('Please provide an image for the banner.');
      return;
    }

    if (isCreatingNew) {
      // Create New Banner
      const newBanner: PromotionalBanner = {
        id: 'banner-' + Date.now(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        buttonText: formButtonText.trim() || 'Start Orders',
        imageUrl: formImageUrl.trim(),
        status: formStatus,
        displayOrder: banners.length + 1,
      };

      const updated = [...banners, newBanner];
      store.saveBanners(updated);
      setBanners(updated);

      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'ADD_PROMOTIONAL_BANNER',
        target: newBanner.title,
        details: `New banner added to customer carousel with photo and CTA "${newBanner.buttonText}"`,
      });

      setActionSuccessMsg('New promotional banner created and added to customer dashboard!');
    } else if (editingBanner) {
      // Update Existing Banner
      const updatedBanner: PromotionalBanner = {
        ...editingBanner,
        title: formTitle.trim(),
        description: formDescription.trim(),
        buttonText: formButtonText.trim() || 'Start Orders',
        imageUrl: formImageUrl.trim(),
        status: formStatus,
      };

      const updated = banners.map((b) => (b.id === updatedBanner.id ? updatedBanner : b));
      store.saveBanners(updated);
      setBanners(updated);

      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_PROMOTIONAL_BANNER',
        target: updatedBanner.title,
        details: `Banner updated with new details/photo by admin`,
      });

      setActionSuccessMsg('Banner changes saved! Customer carousel updated.');
    }

    setIsCreatingNew(false);
    setEditingBanner(null);
    if (onBannersChanged) onBannersChanged();

    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  // Remove Old Banner
  const handleDeleteBanner = (bannerId: string, bannerTitle: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove the banner "${bannerTitle}"? This will delete the banner photo from the customer carousel.`
    );
    if (!confirmDelete) return;

    const updated = banners.filter((b) => b.id !== bannerId);
    store.saveBanners(updated);
    setBanners(updated);

    store.addAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName || currentAdmin.username,
      action: 'REMOVE_PROMOTIONAL_BANNER',
      target: bannerTitle,
      details: `Banner ${bannerId} permanently removed from customer carousel`,
    });

    setActionSuccessMsg(`Banner "${bannerTitle}" has been removed successfully.`);
    if (onBannersChanged) onBannersChanged();

    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  // Reorder Banner
  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    // Update display orders
    const final = reordered.map((b, idx) => ({ ...b, displayOrder: idx + 1 }));
    store.saveBanners(final);
    setBanners(final);
    if (onBannersChanged) onBannersChanged();
  };

  // Toggle Active Status
  const handleToggleStatus = (banner: PromotionalBanner) => {
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    const updated = banners.map((b) =>
      b.id === banner.id ? { ...b, status: newStatus as 'active' | 'inactive' } : b
    );
    store.saveBanners(updated);
    setBanners(updated);
    if (onBannersChanged) onBannersChanged();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#282417]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#E6B92F]" />
            <span>Promotional Banners Management ({banners.length})</span>
          </h2>
          <p className="text-xs text-[#A5A5AE]">
            Fully customize customer carousel banners. Change titles, upload new photos, switch imagery, or remove old banners.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Banner</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
          <span className="font-medium">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Banner Cards Grid */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#111116] border border-[#282417] space-y-3">
            <ImageIcon className="w-10 h-10 text-[#A5A5AE] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-white">No banners currently active</h4>
            <p className="text-xs text-[#A5A5AE]">
              Click "+ Add New Banner" to add a hero photo and message to the customer carousel.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-[#E6B92F] text-black font-bold text-xs"
            >
              Add First Banner
            </button>
          </div>
        ) : (
          banners.map((b, idx) => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-[#111116] border border-[#282417] hover:border-[#E6B92F]/40 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Left: Image & Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
                {/* Photo Preview */}
                <div className="relative w-full sm:w-44 h-28 rounded-2xl overflow-hidden border border-[#282417] bg-black/60 shrink-0 shadow-md group">
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[9px] font-bold text-[#E6B92F] border border-[#E6B92F]/30">
                    Slide #{idx + 1}
                  </div>
                </div>

                {/* Banner Details */}
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => handleToggleStatus(b)}
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase cursor-pointer border transition-colors ${
                        b.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/70'
                          : 'bg-zinc-800 text-[#A5A5AE] border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title="Click to toggle Active/Inactive"
                    >
                      {b.status === 'active' ? '● Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-[#A5A5AE] font-mono">ID: {b.id}</span>
                  </div>

                  <h3 className="text-base font-bold text-white truncate">{b.title}</h3>
                  <p className="text-xs text-[#A5A5AE] line-clamp-2 leading-relaxed">
                    {b.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-semibold text-[#E6B92F] px-2.5 py-0.5 rounded-lg bg-[#181822] border border-[#282417]">
                      Button: "{b.buttonText || 'Start Orders'}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {/* Move Up */}
                <button
                  onClick={() => handleMoveBanner(idx, 'up')}
                  disabled={idx === 0}
                  className="p-2 rounded-xl bg-[#181822] hover:bg-[#222230] disabled:opacity-30 disabled:hover:bg-[#181822] text-[#A5A5AE] hover:text-white border border-[#282417] cursor-pointer"
                  title="Move banner earlier"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMoveBanner(idx, 'down')}
                  disabled={idx === banners.length - 1}
                  className="p-2 rounded-xl bg-[#181822] hover:bg-[#222230] disabled:opacity-30 disabled:hover:bg-[#181822] text-[#A5A5AE] hover:text-white border border-[#282417] cursor-pointer"
                  title="Move banner later"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3.5 py-2 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#E6B92F] hover:text-white border border-[#282417] hover:border-[#E6B92F]/50 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Edit banner content and photo"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {/* Delete / Remove Button */}
                <button
                  onClick={() => handleDeleteBanner(b.id, b.title)}
                  className="px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/40 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Remove old banner from carousel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ============================================================== */}
      {/* EDIT / CREATE BANNER MODAL                                     */}
      {/* ============================================================== */}
      {(isCreatingNew || editingBanner) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111116] border border-[#282417] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#282417] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E6B92F]/15 border border-[#E6B92F]/30 flex items-center justify-center text-[#E6B92F]">
                  {isCreatingNew ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {isCreatingNew ? 'Create New Promotional Banner' : 'Edit Promotional Banner & Photo'}
                  </h3>
                  <p className="text-[11px] text-[#A5A5AE]">
                    {isCreatingNew
                      ? 'Upload a photo and set promotional text for customer dashboard'
                      : `Update content or upload a new photo for "${editingBanner?.title}"`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingBanner(null);
                }}
                className="p-1.5 rounded-xl bg-[#181822] hover:bg-[#252535] text-[#A5A5AE] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title & Button Text Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Banner Title / Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Exclusive Global Brand Showcase"
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    required
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    placeholder="e.g. Start Orders"
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Complete verified order evaluations and unlock 25% daily commission bonuses."
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Display Status
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      formStatus === 'active'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50'
                        : 'bg-[#181822] text-[#A5A5AE] border-[#282417]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Active (Visible on Customer App)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('inactive')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      formStatus === 'inactive'
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
                        : 'bg-[#181822] text-[#A5A5AE] border-[#282417]'
                    }`}
                  >
                    <span>Draft / Inactive</span>
                  </button>
                </div>
              </div>

              {/* Image / Photo Selector Section */}
              <div className="space-y-3 pt-2 border-t border-[#282417]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#E6B92F]" />
                    <span>Banner Photo / Image *</span>
                  </label>

                  {/* Mode Selector */}
                  <div className="flex gap-1 bg-[#181822] p-1 rounded-xl border border-[#282417]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                        imageInputMode === 'upload'
                          ? 'bg-[#E6B92F] text-black'
                          : 'text-[#A5A5AE] hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                        imageInputMode === 'url'
                          ? 'bg-[#E6B92F] text-black'
                          : 'text-[#A5A5AE] hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('preset')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                        imageInputMode === 'preset'
                          ? 'bg-[#E6B92F] text-black'
                          : 'text-[#A5A5AE] hover:text-white'
                      }`}
                    >
                      Preset Library
                    </button>
                  </div>
                </div>

                {/* Option 1: File Upload */}
                {imageInputMode === 'upload' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#282417] hover:border-[#E6B92F] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#181822]/40 group"
                    >
                      <Upload className="w-8 h-8 text-[#A5A5AE] group-hover:text-[#E6B92F] mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-white">
                        Click here to upload a photo from your computer
                      </p>
                      <p className="text-[10px] text-[#A5A5AE] mt-1">
                        Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Option 2: Image URL */}
                {imageInputMode === 'url' && (
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value.trim())}
                      placeholder="https://example.com/images/banner.jpg"
                      className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none"
                    />
                  </div>
                )}

                {/* Option 3: Presets */}
                {imageInputMode === 'preset' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_BANNER_IMAGES.map((p) => (
                      <div
                        key={p.label}
                        onClick={() => setFormImageUrl(p.url)}
                        className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                          formImageUrl === p.url
                            ? 'border-[#E6B92F] bg-[#E6B92F]/10'
                            : 'border-[#282417] bg-[#181822] hover:border-zinc-500'
                        }`}
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-16 rounded-lg object-cover mb-1"
                        />
                        <span className="text-[10px] font-bold text-zinc-300 block truncate text-center">
                          {p.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Preview Box */}
                {formImageUrl && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#A5A5AE] flex items-center gap-1">
                      <Eye className="w-3 h-3 text-[#E6B92F]" />
                      <span>Live Banner Preview:</span>
                    </span>
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#282417] bg-black">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <span className="text-[9px] uppercase font-bold text-[#E6B92F]">
                          PREVIEW
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">{formTitle || 'Banner Headline'}</h4>
                        <p className="text-[10px] text-zinc-300 line-clamp-1">{formDescription || 'Banner Description'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-[#282417] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingBanner(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#A5A5AE] hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreatingNew ? 'Create Banner' : 'Save Banner Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
