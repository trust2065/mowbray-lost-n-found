import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Tag,
  MapPin,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';

// --- Domain Models & Types ---

/**
 * 代表已存檔的遺失物資料結構
 */
interface Item {
  id: string;
  imageUrls: string[];
  nameTag: string;
  category: string;
  description: string;
  foundDate: string;
  location: string;
}

/**
 * 代表上傳暫存區中的物品，繼承 Item 但移除日期並加入 UI 狀態
 */
interface PendingItem extends Omit<Item, 'foundDate'> {
  customLocation?: string;
  isAnalyzing: boolean;
  activePreviewIdx: number;
}

/**
 * Gemini AI 回傳的 JSON 結構定義
 */
interface GeminiAnalysis {
  nameTag: string;
  category: string;
  description: string;
}

// --- Environment & Global Context ---

/**
 * 擴充 Vite 的環境變數型別定義
 */
interface ImportMetaEnv {
  readonly VITE_ADMIN_PASSCODE: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const getEnvVar = (key: keyof ImportMetaEnv, fallback: string): string => {
  try {
    // @ts-ignore - Vite process variable
    return import.meta.env[key] || fallback;
  } catch {
    return fallback;
  }
};

const API_KEY: string = getEnvVar('VITE_GEMINI_API_KEY', '');
const MODEL_NAME: string = "gemini-2.5-flash-preview-09-2025";
const ADMIN_PASSCODE: string = getEnvVar('VITE_ADMIN_PASSCODE', '1234');

const CATEGORIES: readonly string[] = ["School Hat", "Water Bottle", "Lunch Box"] as const;
const LOCATIONS: readonly string[] = [
  "Basketball Court",
  "After School Area",
  "Lunch Area",
  "Library Hall",
  "I'm not sure",
  "Other"
] as const;

type ViewMode = 'grid' | 'list';

const App: React.FC = () => {
  // --- State Management ---
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);

  const [items, setItems] = useState<Item[]>([
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

  // --- Actions & Handlers ---

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (passcodeAttempt === ADMIN_PASSCODE) {
      setIsAdmin(true);
      setShowPasscodeModal(false);
      setPasscodeAttempt('');
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasscodeAttempt('');
    }
  };

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

  const autoFillItem = async (index: number): Promise<void> => {
    if (!isAdmin) return;
    const item = pendingItems[index];
    if (!item || item.imageUrls.length === 0) return;

    const controller = new AbortController();
    abortControllers.current.set(item.id, controller);

    setPendingItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isAnalyzing: true };
      return next;
    });

    const prompt = `Analyze this lost item for Mowbray Public School. Categorize as: ${CATEGORIES.join(', ')}. Return JSON: { "nameTag": "string", "category": "string", "description": "string" }`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/png", data: item.imageUrls[0].split(',')[1] } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          }),
          signal: controller.signal
        }
      );

      const result = await response.json();
      const analysis: GeminiAnalysis = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);

      setPendingItems(prev => {
        const next = [...prev];
        if (next[index]?.id === item.id) {
          next[index] = {
            ...next[index],
            nameTag: analysis.nameTag || 'Unknown',
            category: analysis.category || CATEGORIES[0],
            description: analysis.description || '',
            isAnalyzing: false
          };
          setLastUsedCategory(analysis.category);
        }
        return next;
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error("AI Error:", err);
      setPendingItems(prev => {
        const next = [...prev];
        if (next[index]) next[index].isAnalyzing = false;
        return next;
      });
    } finally {
      abortControllers.current.delete(item.id);
    }
  };

  const cancelAiFill = (itemId: string): void => {
    abortControllers.current.get(itemId)?.abort();
    abortControllers.current.delete(itemId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!isAdmin && (pendingItems.length + files.length) > 5) {
      alert("Safety Guard: Max 5 items per upload for guests.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingItems(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          imageUrls: [reader.result as string],
          nameTag: '',
          category: lastUsedCategory,
          description: '',
          location: lastUsedLocation,
          customLocation: '',
          isAnalyzing: false,
          activePreviewIdx: 0
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const addMorePhotosToItem = (itemId: string, e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const itemIndex = pendingItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    if (!isAdmin && (pendingItems[itemIndex].imageUrls.length + files.length) > 3) {
      alert("Safety Guard: Max 3 photos per item.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              imageUrls: [...item.imageUrls, reader.result as string],
              activePreviewIdx: item.imageUrls.length
            };
          }
          return item;
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImageFromPending = (itemId: string, imgIndex: number): void => {
    setPendingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newUrls = item.imageUrls.filter((_, i) => i !== imgIndex);
        return {
          ...item,
          imageUrls: newUrls,
          activePreviewIdx: 0
        };
      }
      return item;
    }));
  };

  const removePendingItem = (id: string): void => {
    cancelAiFill(id);
    setPendingItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePendingField = <K extends keyof PendingItem>(index: number, field: K, value: PendingItem[K]): void => {
    if (field === 'category') setLastUsedCategory(value as string);
    if (field === 'location') setLastUsedLocation(value as string);

    setPendingItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const closeAndCancelAll = (): void => {
    // 終止所有進行中的 AI 辨識請求
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    setPendingItems([]);
    setIsUploadModalOpen(false);
  };

  const confirmUpload = (): void => {
    const now = new Date().toISOString().split('T')[0];
    const newEntries: Item[] = pendingItems.map(item => ({
      ...item,
      id: Date.now() + Math.random().toString(),
      foundDate: now,
      location: item.location === 'Other' ? (item.customLocation || 'Other Area') : item.location
    }));

    setItems(prev => [...newEntries, ...prev]);
    setPendingItems([]);
    setIsUploadModalOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // --- UI Components ---

  const Gallery: React.FC<{ urls: string[], isGrid?: boolean; }> = ({ urls, isGrid = true }) => {
    const [idx, setIdx] = useState(0);
    if (!urls.length) return <div className="bg-slate-100 w-full h-full" />;

    return (
      <div className="relative w-full h-full group">
        <img src={urls[idx]} className="w-full h-full object-cover transition-opacity duration-300" alt="item" />
        {urls.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {urls.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            Mowbray Public
            <span
              onDoubleClick={() => setShowPasscodeModal(true)}
              className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 font-bold block mt-1 cursor-default select-none"
            >
              Lost & Found Hub .
            </span>
          </h1>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-white text-emerald-600' : 'text-slate-50'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-white text-emerald-600' : 'text-slate-50'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </header>

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

        {/* Category Pills */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === 'All' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>All Items</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>{cat}</button>
          ))}
        </div>

        {/* Content Header */}
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
              <div key={item.id} className={viewMode === 'grid' ? "bg-white rounded-[2.5rem] overflow-hidden border hover:shadow-2xl transition-all" : "bg-white p-5 rounded-[2rem] border flex items-center gap-6"}>
                <div className={viewMode === 'grid' ? "aspect-[4/5] bg-slate-100" : "w-28 h-28 flex-shrink-0 rounded-[1.5rem] overflow-hidden"}>
                  <Gallery urls={item.imageUrls} />
                </div>
                <div className={viewMode === 'grid' ? "p-6" : "flex-1"}>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-base font-black text-slate-800 truncate">{item.nameTag || 'Unknown'}</span>
                  </div>
                  <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase inline-block mb-3">{item.category}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">{item.description}</p>
                  <div className="flex flex-col gap-2 pt-4 border-t text-[11px] text-slate-400 font-bold uppercase">
                    <span className="flex items-center gap-2 text-slate-700"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {item.location}</span>
                    <span className="flex items-center gap-2 font-medium"><Calendar className="w-3.5 h-3.5" /> Found {item.foundDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Staff Login Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl">
            <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"><KeyRound className="text-emerald-600 w-7 h-7" /></div>
            <h3 className="text-xl font-black text-center text-slate-800 mb-2">Staff Access</h3>
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <input type="password" placeholder="••••" autoFocus className={`w-full text-center text-3xl tracking-[0.5em] bg-slate-50 border-2 rounded-2xl py-4 outline-none ${loginError ? 'border-rose-200' : 'border-slate-100'}`} value={passcodeAttempt} onChange={(e) => setPasscodeAttempt(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPasscodeModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-2xl">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-10 py-7 border-b flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Upload Photos</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{isAdmin ? 'Staff Mode' : `Guest Mode: Max 5 items / 3 photos per item`}</p>
              </div>
              <button onClick={closeAndCancelAll} className="p-2"><X className="w-7 h-7 text-slate-300" /></button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50/50">
              {pendingItems.length === 0 ? (
                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer border-4 border-dashed rounded-[3rem] p-20 text-center hover:border-emerald-300">
                  <Upload className="w-14 h-14 mx-auto text-slate-200 mb-5" />
                  <p className="text-xl font-black text-slate-700">Select Item Photo(s)</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                </div>
              ) : (
                <div className="space-y-10">
                  {pendingItems.map((item, index) => (
                    <div key={item.id} className="bg-white p-7 rounded-[2.5rem] shadow-xl flex flex-col sm:flex-row gap-8">
                      <div className="w-full sm:w-36 flex-shrink-0 flex flex-col gap-4">
                        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100">
                          <img src={item.imageUrls[item.activePreviewIdx]} className="w-full h-full object-cover" alt="preview" />
                          <button onClick={() => removePendingItem(item.id)} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full border-2 border-white"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                          {item.imageUrls.map((img, i) => (
                            <div key={i} onClick={() => updatePendingField(index, 'activePreviewIdx', i)} className={`w-10 h-10 flex-shrink-0 cursor-pointer rounded-lg border-2 ${item.activePreviewIdx === i ? 'border-emerald-500' : 'border-transparent'}`}>
                              <img src={img} className="w-full h-full object-cover rounded-md" alt="thumb" />
                            </div>
                          ))}
                          {item.imageUrls.length < (isAdmin ? 10 : 3) && (
                            <button onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.onchange = (ev: Event) => {
                                const target = ev.target as HTMLInputElement;
                                if (target.files) {
                                  // Re-using the logic manually for the inline input
                                  const files = Array.from(target.files);
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setPendingItems(prev => prev.map(p => p.id === item.id ? {
                                        ...p, imageUrls: [...p.imageUrls, reader.result as string], activePreviewIdx: p.imageUrls.length
                                      } : p));
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }
                              };
                              input.click();
                            }} className="w-10 h-10 border-2 border-dashed rounded-lg flex items-center justify-center text-slate-300">+</button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-5">
                        <div className="flex items-center gap-4">
                          <input type="text" placeholder="Name on item" className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-black text-slate-700" value={item.nameTag} onChange={(e) => updatePendingField(index, 'nameTag', e.target.value)} />
                          {isAdmin && (
                            <button onClick={() => autoFillItem(index)} disabled={item.isAnalyzing} className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-sm">
                              {item.isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Fill
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <select className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600" value={item.category} onChange={(e) => updatePendingField(index, 'category', e.target.value)}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600" value={item.location} onChange={(e) => updatePendingField(index, 'location', e.target.value)}>
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <textarea placeholder="Description..." className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm min-h-[70px]" value={item.description} onChange={(e) => updatePendingField(index, 'description', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} disabled={!isAdmin && pendingItems.length >= 5} className="w-full py-5 border-2 border-dashed rounded-[2.5rem] text-slate-400 font-black text-sm hover:text-emerald-600">+ Add Another Item</button>
                </div>
              )}
            </div>

            {pendingItems.length > 0 && (
              <div className="p-8 border-t flex items-center gap-5">
                <button onClick={closeAndCancelAll} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
                <button onClick={confirmUpload} className="flex-[2] py-4.5 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-2xl active:scale-95 transition-all">Post {pendingItems.length} Item(s)</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4.5 rounded-[2rem] shadow-2xl flex items-center gap-4 z-[100] border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-black tracking-tight">Posted to Mowbray Hub!</span>
        </div>
      )}
    </div>
  );
};

export default App;