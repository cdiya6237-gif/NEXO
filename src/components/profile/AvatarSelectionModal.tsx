import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Check,
  User as UserIcon,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Camera,
  Trash2,
  AlertCircle,
  ZoomIn,
} from 'lucide-react';
import { User } from '../../types';
import { store } from '../../services/store';

export interface PredefinedAvatar {
  id: string;
  avatarIndex: number;
  name: string;
  role: string;
  gender: 'female' | 'male' | 'elderly_male';
  url: string;
}

export const PREDEFINED_AVATARS: PredefinedAvatar[] = [
  // 4 Female Avatars
  {
    id: 'avatar-f1',
    avatarIndex: 1,
    name: 'Elena Vance',
    role: 'Corporate Executive',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-f2',
    avatarIndex: 2,
    name: 'Sarah Jenkins',
    role: 'Global Tech Lead',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-f3',
    avatarIndex: 3,
    name: 'Mia Zhao',
    role: 'Creative Director',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-f4',
    avatarIndex: 4,
    name: 'Aria Dupont',
    role: 'E-Commerce Strategist',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
  },
  // 2 Male Avatars
  {
    id: 'avatar-m1',
    avatarIndex: 5,
    name: 'David Miller',
    role: 'Operations Lead',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-m2',
    avatarIndex: 6,
    name: 'Alex Rivera',
    role: 'Portfolio Manager',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  },
  // 1 Elderly Male Avatar
  {
    id: 'avatar-elder-m',
    avatarIndex: 7,
    name: 'Robert Hastings',
    role: 'Senior Financial Advisor',
    gender: 'elderly_male',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80',
  },
];

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAvatarUpdated: (updatedUser: User) => void;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAvatarUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const match = PREDEFINED_AVATARS.find(a => a.url === currentUser.avatarUrl);
    return match ? match.id : PREDEFINED_AVATARS[0].id;
  });

  // Upload Photo State
  const [previewImage, setPreviewImage] = useState<string | null>(currentUser.avatarUrl || null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Preset Avatar Selection
  const handleSelectPreset = (avatar: PredefinedAvatar) => {
    setSelectedPresetId(avatar.id);
  };

  const handleSavePreset = () => {
    const target = PREDEFINED_AVATARS.find(a => a.id === selectedPresetId);
    if (!target) return;

    setIsSaving(true);
    const updated: User = {
      ...currentUser,
      avatarId: target.avatarIndex,
      avatarUrl: target.url,
    };
    store.updateUser(updated);
    onAvatarUpdated(updated);
    setIsSaving(false);
    onClose();
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please select a JPG, PNG, or WebP photo.');
      return;
    }

    // Validate size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      setZoomLevel(100);
    };
    reader.readAsDataURL(file);
  };

  // Save Uploaded Photo
  const handleSaveUploadedPhoto = () => {
    if (!previewImage) return;

    setIsSaving(true);
    const updated: User = {
      ...currentUser,
      avatarUrl: previewImage,
      avatarId: 99, // Custom photo marker
    };
    store.updateUser(updated);
    onAvatarUpdated(updated);
    setIsSaving(false);
    onClose();
  };

  // Remove Photo (revert to default initial)
  const handleRemovePhoto = () => {
    const updated: User = {
      ...currentUser,
      avatarUrl: undefined,
      avatarId: 1,
    };
    store.updateUser(updated);
    onAvatarUpdated(updated);
    setPreviewImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111116] border border-[#3A321C] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#282417] flex items-center justify-between bg-[#14141c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6B92F]/20 text-[#E6B92F] flex items-center justify-center border border-[#E6B92F]/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Change Profile Avatar
              </h3>
              <p className="text-[11px] text-[#A5A5AE]">
                Choose a ready-made avatar or upload from your device gallery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#A5A5AE] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-[#0d0d12] border-b border-[#282417] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#E6B92F] text-black shadow-md'
                : 'bg-[#181822] text-[#A5A5AE] hover:text-white hover:bg-[#20202c]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Choose an Avatar (7)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#E6B92F] text-black shadow-md'
                : 'bg-[#181822] text-[#A5A5AE] hover:text-white hover:bg-[#20202c]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your Photo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* ============================================================== */}
          {/* TAB 1: 7 PREDEFINED AVATARS (4 Female, 2 Male, 1 Elderly Male) */}
          {/* ============================================================== */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#A5A5AE]">
                <span>Select a ready-to-use profile avatar:</span>
                <span className="text-[10px] text-[#E6B92F] font-semibold">
                  4 Female • 2 Male • 1 Senior
                </span>
              </div>

              {/* Grid of 7 Avatars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PREDEFINED_AVATARS.map((avatar) => {
                  const isSelected = selectedPresetId === avatar.id;
                  return (
                    <div
                      key={avatar.id}
                      onClick={() => handleSelectPreset(avatar)}
                      className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center gap-2 group ${
                        isSelected
                          ? 'bg-[#181822] border-[#E6B92F] ring-2 ring-[#E6B92F]/50 shadow-[0_0_16px_rgba(230,185,47,0.25)]'
                          : 'bg-[#14141c] border-[#282417] hover:border-[#E6B92F]/40 hover:bg-[#181824]'
                      }`}
                    >
                      {/* Checkmark indicator */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#E6B92F] text-black flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Image Circle */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[#282417] group-hover:border-[#E6B92F]/60 transition-colors bg-[#0a0a0e] shrink-0">
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info */}
                      <div className="w-full truncate">
                        <span className="text-[11px] font-bold text-white block truncate">
                          {avatar.name}
                        </span>
                        <span className="text-[9px] text-[#A5A5AE] block truncate">
                          {avatar.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#282417]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[#181822] text-[#A5A5AE] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set as Profile Avatar</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: UPLOAD CUSTOM PHOTO FROM DEVICE GALLERY                 */}
          {/* ============================================================== */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Photo Preview & Fit Frame */}
              <div className="p-6 rounded-2xl bg-[#0c0c10] border border-[#282417] flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  {/* Circular preview viewport with golden guide */}
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#E6B92F] shadow-[0_0_25px_rgba(230,185,47,0.3)] bg-[#181822] flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile Preview"
                        style={{ transform: `scale(${zoomLevel / 100})` }}
                        className="w-full h-full object-cover transition-transform"
                      />
                    ) : (
                      <div className="text-center p-2 text-[#A5A5AE]">
                        <UserIcon className="w-12 h-12 mx-auto text-[#282417]" />
                        <span className="text-[10px] block mt-1">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#181822] border border-[#E6B92F]/50 text-[10px] font-bold text-[#E6B92F]">
                    Fit Preview
                  </div>
                </div>

                {/* Zoom Fit Slider */}
                {previewImage && (
                  <div className="w-full max-w-xs space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-[#A5A5AE]">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-[#E6B92F]" /> Zoom & Fit
                      </span>
                      <span className="font-mono text-white">{zoomLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={200}
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(Number(e.target.value))}
                      className="w-full accent-[#E6B92F] cursor-pointer"
                    />
                  </div>
                )}

                {/* Upload or Change button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-[#181822] hover:bg-[#222232] text-white border border-[#282417] hover:border-[#E6B92F]/50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#E6B92F]" />
                    <span>{previewImage ? 'Replace Photo' : 'Choose from Gallery / Files'}</span>
                  </button>

                  {currentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove custom photo"
                      className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-[#A5A5AE] max-w-xs">
                  Supports JPG, PNG, or WebP. High resolution photos will automatically crop to fit the circular profile avatar.
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#282417]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[#181822] text-[#A5A5AE] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUploadedPhoto}
                  disabled={!previewImage || isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
