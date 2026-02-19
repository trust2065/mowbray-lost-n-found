import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ADMIN_PASSCODE, CATEGORIES, LOCATIONS } from './constants';
import { cosineSimilarity } from './utils/vector';
import type { Item, PendingItem, ViewMode } from './types';
import { useGeminiAPI } from './hooks/useGeminiAPI';
import { useFileUpload } from './hooks/useFileUpload';
import { useDarkMode } from './hooks/useDarkMode';
import { subscribeToItemsSmart, deleteAllItems, deleteItem } from './services/firestore';
import { migrateBlurhashes } from './utils/migration';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ItemCard from './components/ItemCard';
import StaffLoginModal from './components/StaffLoginModal';
import UploadModal from './components/UploadModal';
import SuccessToast from './components/SuccessToast';
import PhotoViewer from './components/PhotoViewer';

declare global {
  interface Window {
    migrateBlurhashes: () => Promise<void>;
  }
}

const App: React.FC = () => {
  // --- State Management ---
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);

  const [items, setItems] = useState<Item[]>([]);

  // --- Instance Refs ---
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optimisticIds = useRef<Set<string>>(new Set());

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToItemsSmart((fetchedItems) => {
      setItems(fetchedItems);
    }, optimisticIds);

    return () => {
      unsubscribe();
    };
  }, [optimisticIds]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const [lastUsedCategory, setLastUsedCategory] = useState<string>(CATEGORIES[0]);
  const [lastUsedLocation, setLastUsedLocation] = useState<string>(LOCATIONS[0]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const [isSemanticSearch, setIsSemanticSearch] = useState<boolean>(false);
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [isEmbeddingLoading, setIsEmbeddingLoading] = useState<boolean>(false);

  const [photoViewer, setPhotoViewer] = useState<{ isOpen: boolean; urls: string[]; index: number; }>({
    isOpen: false,
    urls: [],
    index: 0
  });

  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const { autoFillItem, cancelAiFill, cleanup, generateEmbedding } = useGeminiAPI();
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
    setLastUsedLocation,
    optimisticIds
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item.');
    }
  }, []);

  // --- Cleanup on component unmount ---
  useEffect(() => {
    // Expose migration tool
    window.migrateBlurhashes = migrateBlurhashes;

    return () => {
      // Cleanup all abort controllers
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();

      // Cleanup all FileReaders
      cleanupReaders();

      // Cleanup AI requests
      cleanup(abortControllers);
    };
  }, []); // Empty dependency array - only run on unmount

  const [isIndexing, setIsIndexing] = useState(false);
  const handleIndexItems = async () => {
    if (!isAdmin) return;
    if (!confirm('This will generate AI embeddings for all items. Continue?')) return;

    setIsIndexing(true);
    const { getItemSearchText } = await import('./utils/vector');
    const { updateItem } = await import('./services/firestore');

    try {
      let count = 0;
      let skipped = 0;
      let failed = 0;

      console.log(`[Indexing] Starting scan of ${items.length} items...`);
      console.table(items.map(i => ({
        id: i.id,
        name: i.nameTag,
        hasEmbedding: !!i.embedding && i.embedding.length > 0
      })));

      for (const item of items) {
        const hasEmbedding = !!item.embedding && item.embedding.length > 0;

        if (!hasEmbedding) {
          try {
            console.log(`[Indexing] Working on: ${item.nameTag} (${item.id})`);
            const searchText = getItemSearchText(item);
            const embedding = await generateEmbedding(searchText, 'RETRIEVAL_DOCUMENT');

            if (embedding && embedding.length > 0) {
              await updateItem(item.id, { embedding });
              console.log(`[Indexing] ✅ Success: ${item.nameTag}`);
              count++;
            } else {
              console.warn(`[Indexing] ⚠️ No embedding returned for: ${item.nameTag}`);
              failed++;
            }
          } catch (itemError) {
            console.error(`[Indexing] ❌ Error processing ${item.nameTag}:`, itemError);
            failed++;
          }
        } else {
          skipped++;
        }
      }

      const summary = `Index scan finished!\n- Newly indexed: ${count}\n- Already had index: ${skipped}\n- Failed: ${failed}`;
      console.log(summary);
      alert(summary);
    } catch (error) {
      console.error('[Indexing] Critical failure:', error);
      alert('Indexing failed due to a critical error.');
    } finally {
      setIsIndexing(false);
    }
  };

  const handlePhotoClick = useCallback((urls: string[], index: number) => {
    setPhotoViewer({ isOpen: true, urls, index });
  }, []);

  const handleAdminLogout = useCallback((): void => setIsAdmin(false), []);

  const handleDeleteAllItems = useCallback(async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete ALL items and photos? This cannot be undone!')) {
      return;
    }

    try {
      await deleteAllItems();
      console.log('All items deleted successfully');
    } catch (error) {
      console.error('Failed to delete all items:', error);
      alert('Failed to delete items. Please try again.');
    }
  }, []);

  // --- Semantic Search Logic ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isSemanticSearch && searchQuery.trim().length > 2) {
        setIsEmbeddingLoading(true);
        const embedding = await generateEmbedding(searchQuery, 'RETRIEVAL_QUERY');
        setQueryEmbedding(embedding);
        setIsEmbeddingLoading(false);
      } else {
        setQueryEmbedding(null);
      }
    }, 500); // Debounce AI request

    return () => clearTimeout(timer);
  }, [searchQuery, isSemanticSearch]);

  const filteredItems = useMemo(() => {
    const isRecent = (dateStr: string): boolean => {
      const diff = Math.abs(Date.now() - new Date(dateStr).getTime());
      return diff <= 14 * 24 * 60 * 60 * 1000; // 14 days in ms
    };

    let result = items.filter(item => {
      if (!isAdmin && !isRecent(item.foundDate)) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!isSemanticSearch || !queryEmbedding) {
        const q = searchQuery.toLowerCase();
        return item.nameTag.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q);
      }
      return true; // If semantic search is on, we filter/sort by similarity later
    });

    // Semantic Ranking
    if (isSemanticSearch && queryEmbedding) {
      result = result
        .map(item => ({
          ...item,
          similarity: item.embedding ? cosineSimilarity(queryEmbedding, item.embedding) : 0
        }))
        .filter(item => {
          if (searchQuery.length < 5) return true; // Less aggressive filtering for short queries
          return item.similarity > 0.4;
        })
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    }

    return result;
  }, [items, searchQuery, selectedCategory, isAdmin, isSemanticSearch, queryEmbedding]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, isAdmin]);

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
    confirmUpload(pendingItems, setPendingItems, setIsUploadModalOpen, setShowSuccessToast, generateEmbedding, setItems);
  };

  const autoFillItemWrapper = (index: number): void => {
    const item = pendingItems[index];
    if (item) {
      autoFillItem(item, index, setPendingItems, abortControllers);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isAdmin={isAdmin}
        onAdminToggle={() => setIsAdmin(!isAdmin)}
        onTitleDoubleClick={ADMIN_PASSCODE ? () => setShowPasscodeModal(true) : undefined}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isSemanticSearch={isSemanticSearch}
        setIsSemanticSearch={setIsSemanticSearch}
        isEmbeddingLoading={isEmbeddingLoading}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full">
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-3xl flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Staff Mode Enabled</p>
                <p className="text-[11px] font-medium opacity-70">Full history access active.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleIndexItems}
                disabled={isIndexing || items.length === 0}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIndexing ? 'Indexing...' : 'Re-index Smart Search'}
              </button>
              <button onClick={handleDeleteAllItems} className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl shadow-sm transition-colors">Delete All</button>
              <button onClick={handleAdminLogout} className="text-xs font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Logout</button>
            </div>
          </div>
        )}

        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{isAdmin ? 'All items' : 'Recent Discoveries'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">{isAdmin ? `${filteredItems.length} items` : `Items found in the last 14 days.`}</p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-32 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed rounded-[3rem] border-blue-200 dark:border-slate-700">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-10 text-blue-400 dark:text-slate-400" />
            <p className="text-lg font-bold">No items found.</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" : "space-y-4"}>
              {paginatedItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  viewMode={viewMode}
                  onPhotoClick={handlePhotoClick}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  similarity={(item as any).similarity}
                />
              ))}
            </div>

            {filteredItems.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <PhotoViewer
        isOpen={photoViewer.isOpen}
        urls={photoViewer.urls}
        initialIndex={photoViewer.index}
        onClose={() => setPhotoViewer(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Action Button for New Item */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-900 dark:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all hover:bg-blue-800 dark:hover:bg-blue-500"
        aria-label="Post new item"
      >
        <Plus className="w-8 h-8" />
      </button>

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

      <footer className="bg-blue-900 text-white text-xs py-8 transition-colors">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left - About */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-sm mb-3">About</h3>
            <p className="mb-2">Mowbray Public Lost & Found</p>
            <p>Helping items find their way home.</p>
          </div>

          {/* Middle - Contact */}
          <div className="text-center">
            <h3 className="font-bold text-sm mb-3">Contact</h3>
            <p className="mb-2">Email: <a href="mailto:chocous8@gmail.com" className="hover:text-blue-200 underline">chocous8@gmail.com</a></p>
            <p>Location: Lane Cove, NSW</p>
          </div>

          {/* Right - Legal */}
          <div className="text-center md:text-right">
            <h3 className="font-bold text-sm mb-3">Legal</h3>
            <p className="mb-2"> 2026 Choco Li. All rights reserved.</p>
            <p><button onClick={() => setShowPrivacyModal(true)} className="hover:text-blue-200 underline">Privacy Policy</button></p>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl transition-colors">
            <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
              <h2 className="text-2xl font-bold dark:text-slate-100">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 text-sm dark:text-slate-300">
              <section>
                <h3 className="text-lg font-bold mb-3 dark:text-slate-100">1. Data Collection & Usage</h3>
                <p className="mb-3">
                  This website is designed solely to facilitate the return of lost items within the Mowbray Public School community. We only collect or display:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Photographs of lost items.</li>
                  <li>Descriptions of items (e.g., color, brand).</li>
                  <li>Contact information provided by users reporting or claiming items.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold mb-3 dark:text-slate-100">2. Photo Privacy</h3>
                <p className="mb-3">
                  To protect student privacy, we strictly adhere to the following:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>No Faces:</strong> Photographs must only show the lost objects. Please ensure no students' faces are visible in the background.</li>
                  <li><strong>No Personal IDs:</strong> We avoid displaying sensitive personal information (like full names on tags) unless necessary for identification.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold mb-3 dark:text-slate-100">3. Third-Party Sharing</h3>
                <p>
                  We do not sell or share any data with third-party advertisers. All information stays within the context of the school's lost and found process.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last updated: February 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;