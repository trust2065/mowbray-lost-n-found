import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, ShieldCheck, Search } from 'lucide-react';
import { ADMIN_PASSCODE, CATEGORIES, LOCATIONS } from './constants';
import type { Item, PendingItem, ViewMode } from './types';
import { useGeminiAPI } from './hooks/useGeminiAPI';
import { useFileUpload } from './hooks/useFileUpload';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ItemCard from './components/ItemCard';
import StaffLoginModal from './components/StaffLoginModal';
import UploadModal from './components/UploadModal';
import SuccessToast from './components/SuccessToast';

const App: React.FC = () => {
  // --- State Management ---
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);

  const [items, setItems] = useState<Item[]>([
    // TODO: Implement pagination to handle unbounded state growth
    // Current implementation stores all items in memory which can cause performance issues
    {
      id: 'sample-1',
      imageUrls: ['https://images.unsplash.com/photo-1519327232521-1ea2c736d34d?auto=format&fit=crop&q=80&w=400'],
      nameTag: 'Jack W.',
      category: 'Water Bottle',
      description: 'Blue water bottle, scratched at the bottom.',
      foundDate: new Date().toISOString().split('T')[0],
      location: 'Lunch Area'
    }
  ]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [lastUsedCategory, setLastUsedCategory] = useState<string>(CATEGORIES[0]);
  const [lastUsedLocation, setLastUsedLocation] = useState<string>(LOCATIONS[0]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // --- Instance Refs ---
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { autoFillItem, cancelAiFill } = useGeminiAPI();
  const {
    handleFileSelect,
    updatePendingField,
    removePendingItem,
    confirmUpload,
    closeAndCancelAll,
    cleanupReaders
  } = useFileUpload(
    lastUsedCategory,
    lastUsedLocation,
    setLastUsedCategory,
    setLastUsedLocation
  );

  // --- Cleanup on component unmount ---
  useEffect(() => {
    return () => {
      // Cleanup all abort controllers
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();

      // Cleanup all FileReaders
      cleanupReaders();
    };
  }, [cleanupReaders]);

  // --- Actions & Handlers ---

  const handleAdminLogout = useCallback((): void => setIsAdmin(false), []);

  const filteredItems = useMemo(() => {
    const isRecent = (dateStr: string): boolean => {
      const diff = Math.abs(Date.now() - new Date(dateStr).getTime());
      return diff <= 14 * 24 * 60 * 60 * 1000; // 14 days in ms
    };

    return items.filter(item => {
      if (!isAdmin && !isRecent(item.foundDate)) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.nameTag.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory, isAdmin]);

  const handleFileSelectWrapper = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFileSelect(e, setPendingItems, isAdmin, pendingItems);
  };

  const updatePendingFieldWrapper = <K extends keyof PendingItem>(index: number, field: K, value: PendingItem[K]): void => {
    updatePendingField(index, field, value, setPendingItems);
  };

  const removePendingItemWrapper = (id: string): void => {
    removePendingItem(id, setPendingItems, (itemId) => cancelAiFill(itemId, abortControllers));
  };

  const closeAndCancelAllWrapper = (): void => {
    closeAndCancelAll(abortControllers, setPendingItems, setIsUploadModalOpen);
  };

  const confirmUploadWrapper = (): void => {
    confirmUpload(pendingItems, setItems, setPendingItems, setIsUploadModalOpen, setShowSuccessToast);
  };

  const autoFillItemWrapper = (index: number): void => {
    const item = pendingItems[index];
    if (item) {
      autoFillItem(item, index, setPendingItems, abortControllers);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onTitleDoubleClick={() => setShowPasscodeModal(true)}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {isAdmin && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-800">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Staff Mode Enabled</p>
                <p className="text-[11px] font-medium opacity-70">Full history access active.</p>
              </div>
            </div>
            <button onClick={handleAdminLogout} className="text-xs font-bold bg-white text-amber-700 px-4 py-2 rounded-xl shadow-sm">Logout</button>
          </div>
        )}

        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{isAdmin ? 'School Archive' : 'Recent Discoveries'}</h2>
            <p className="text-slate-500 text-sm italic">{isAdmin ? `Records: ${filteredItems.length}` : `Items found in the last 14 days.`}</p>
          </div>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-7 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            <span>Post New Item</span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-32 text-center text-slate-400 border-2 border-dashed rounded-[3rem]">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-bold">No items found.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} viewMode={viewMode} />
            ))}
          </div>
        )}
      </main>

      <StaffLoginModal
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onLogin={(passcode) => {
          if (passcode === ADMIN_PASSCODE) {
            setIsAdmin(true);
            setShowPasscodeModal(false);
            setPasscodeAttempt('');
            setLoginError(false);
          } else {
            setLoginError(true);
            setPasscodeAttempt('');
          }
        }}
        loginError={loginError}
        passcodeAttempt={passcodeAttempt}
        setPasscodeAttempt={setPasscodeAttempt}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        isAdmin={isAdmin}
        pendingItems={pendingItems}
        onClose={closeAndCancelAllWrapper}
        onFileSelect={handleFileSelectWrapper}
        onUpdatePendingField={updatePendingFieldWrapper}
        onRemovePendingItem={removePendingItemWrapper}
        onAutoFillItem={autoFillItemWrapper}
        onConfirmUpload={confirmUploadWrapper}
        fileInputRef={fileInputRef}
      />

      <SuccessToast show={showSuccessToast} />
    </div>
  );
};

export default App;