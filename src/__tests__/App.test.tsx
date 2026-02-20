import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import type { Item } from '../types';

// --- Mocks ---

// Mock Hooks
const mockToggleDarkMode = vi.fn();

vi.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: mockToggleDarkMode,
  }),
}));

const mockAutoFillItem = vi.fn();
const mockCancelAiFill = vi.fn();
const mockCleanup = vi.fn();

vi.mock('../hooks/useGeminiAPI', () => ({
  useGeminiAPI: () => ({
    autoFillItem: mockAutoFillItem,
    cancelAiFill: mockCancelAiFill,
    cleanup: mockCleanup,
  }),
}));

const mockHandleFileSelect = vi.fn();
const mockUpdatePendingField = vi.fn();
const mockRemovePendingItem = vi.fn();
const mockConfirmUpload = vi.fn();
const mockCloseAndCancelAll = vi.fn();
const mockCleanupReaders = vi.fn();

vi.mock('../hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    handleFileSelect: mockHandleFileSelect,
    updatePendingField: mockUpdatePendingField,
    removePendingItem: mockRemovePendingItem,
    confirmUpload: mockConfirmUpload,
    closeAndCancelAll: mockCloseAndCancelAll,
    cleanupReaders: mockCleanupReaders,
  }),
}));

// Mock Services
const mockSubscribeToItems = vi.fn();
const mockDeleteItem = vi.fn();

vi.mock('../services/firestore', () => ({
  subscribeToItems: (callback: (items: Item[]) => void) => {
    mockSubscribeToItems(callback);
    return () => { }; // return unsubscribe function
  },
  deleteItem: (id: string) => mockDeleteItem(id),
  deleteAllItems: vi.fn(),
  updateItem: vi.fn(),
}));

// Mock Utils
vi.mock('../utils/migration', () => ({
  migrateBlurhashes: vi.fn(),
}));

// Mock Child Components to simplify App test
// We want to test integration/interaction, but detailed rendering of complex children 
// might clutter or fail due to context. However, App passes props to them.
// Let's mock the heavy ones or ones that rely on complex DOM (like Gallery/PhotoViewer) 
// if they cause issues, but generally integration tests prefer real components.
// Given we have unit tests for components, we can potentially use them, 
// but mocking them allows verifying that App passes correct props.
// Let's start with REAL components (except the ones that are portals or very complex).
// Actually, using real components is better for "Integration".
// But we need to mock imports inside them if any.
// Since we mocked hooks and services at top level, children using them *might* be unaffected 
// if they don't import them directly.
// Wait, ItemCard imports `deleteItem`? No, App passes `onDelete`.
// PhotoViewer is purely presentational.
// UploadModal is presentational + hooks (which we mocked in App, but UploadModal MIGHT use them? 
// Checking UploadModal imports... it receives props from App which uses hooks.
// Checked UploadModal code: it imports `compressImage` etc.
// We should probably mock util libraries globally if real components use them.

vi.mock('../utils/imageCompression', () => ({
  compressImage: vi.fn(),
  needsCompression: vi.fn(),
  formatFileSize: vi.fn(),
  isFileTooLarge: vi.fn(),
}));

vi.mock('../utils/blurhash', () => ({
  encodeImageToBlurhash: vi.fn(),
}));

// Mock constants so we can control ADMIN_PASSCODE
vi.mock('../constants', async () => {
  const actual = await vi.importActual<typeof import('../constants')>('../constants');
  return {
    ...actual,
    ADMIN_PASSCODE: 'test-passcode',
  };
});

// Mock Lucide icons to avoid SVGs cluttering snapshots or errors
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    // create simple mocks for icons to avoid rendering large SVGs
    Plus: () => <div data-testid="icon-plus" />,
    ShieldCheck: () => <div data-testid="icon-shield" />,
    Search: () => <div data-testid="icon-search" />,
    ChevronLeft: () => <div data-testid="icon-left" />,
    ChevronRight: () => <div data-testid="icon-right" />,
    LayoutGrid: () => <div data-testid="icon-grid" />,
    List: () => <div data-testid="icon-list" />,
    Sun: () => <div data-testid="icon-sun" />,
    Moon: () => <div data-testid="icon-moon" />,
    X: () => <div data-testid="icon-x" />,
    Upload: () => <div data-testid="icon-upload" />,
    Trash2: () => <div data-testid="icon-trash" />,
  };
});


describe('App Integration', () => {
  // Use recent dates so items pass the 14-day filter in App
  const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

  const mockItems: Item[] = [
    {
      id: '1',
      nameTag: 'Red Hat',
      category: 'School Hat',
      location: 'Playground',
      description: 'A red baseball cap',
      foundDate: recentDate,
      imageUrls: ['img1.jpg'],
      blurhashes: [],
    },
    {
      id: '2',
      nameTag: 'Blue Bottle',
      category: 'Water Bottle',
      location: 'Canteen',
      description: 'Metal water bottle',
      foundDate: recentDate,
      imageUrls: ['img2.jpg'],
      blurhashes: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for subscription: return items immediately
    mockSubscribeToItems.mockImplementation((callback) => {
      callback(mockItems);
    });
    // Ensure public access is authorized for integration tests
    localStorage.setItem('public_access_authorized', 'true');
  });

  it('renders header and initial items', async () => {
    render(<App />);
    // Use getAllByText because title might appear in Header and Footer
    expect(screen.getAllByText(/Mowbray Public/i)[0]).toBeInTheDocument();

    // Use findByText to wait for items to load via useEffect
    expect(await screen.findByText('Red Hat')).toBeInTheDocument();
    expect(screen.getByText('Blue Bottle')).toBeInTheDocument();
  });

  it('filters items by search query', async () => {
    render(<App />);
    // Wait for items to load first
    await screen.findByText('Red Hat');

    const searchInput = screen.getByPlaceholderText(/search by name/i);

    // Search for "Bottle"
    fireEvent.change(searchInput, { target: { value: 'Bottle' } });

    // Expect "Blue Bottle" to remain, "Red Hat" to disappear
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle')).toBeInTheDocument();
      expect(screen.queryByText('Red Hat')).not.toBeInTheDocument();
    });
  });

  it('filters items by category', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    // Click 'School Hat' category (Red Hat is School Hat)
    const schoolHatBtn = screen.getByRole('button', { name: /School Hat/i });
    fireEvent.click(schoolHatBtn);

    await waitFor(() => {
      expect(screen.getByText('Red Hat')).toBeInTheDocument();
      expect(screen.queryByText('Blue Bottle')).not.toBeInTheDocument();
    });
  });

  it('opens staff login modal on title double click', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    // Target the h1 element directly to avoid multiple text matches
    const h1 = screen.getByRole('heading', { level: 1 });
    fireEvent.doubleClick(h1.closest('.cursor-pointer')!);

    expect(screen.getByText('Staff Access')).toBeInTheDocument();
  });

  it('accepts correct passcode and enters admin mode', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    const h1 = screen.getByRole('heading', { level: 1 });
    fireEvent.doubleClick(h1.closest('.cursor-pointer')!);
    expect(screen.getByText('Staff Access')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: 'test-passcode' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.queryByText('Staff Access')).not.toBeInTheDocument();
      expect(screen.getByText('Staff Mode Enabled')).toBeInTheDocument();
    });
  });

  it('shows login error on wrong passcode', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    const h1 = screen.getByRole('heading', { level: 1 });
    fireEvent.doubleClick(h1.closest('.cursor-pointer')!);

    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Staff Access')).toBeInTheDocument(); // modal stays open
    });
  });

  it('opens upload modal when floating button is clicked', () => {
    render(<App />);
    const fab = screen.getByLabelText('Post new item');
    fireEvent.click(fab);
    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
  });

  // --- Helper: login as admin ---
  async function loginAsAdmin() {
    const h1 = screen.getByRole('heading', { level: 1 });
    fireEvent.doubleClick(h1.closest('.cursor-pointer')!);
    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: 'test-passcode' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.queryByText('Staff Access')).not.toBeInTheDocument());
  }

  it('admin mode shows items older than 14 days', async () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const oldItem: Item = {
      id: '3',
      nameTag: 'Old Lunch Box',
      category: 'Lunch Box',
      location: 'Library Hall',
      description: 'Old item',
      foundDate: oldDate,
      imageUrls: ['img3.jpg'],
      blurhashes: [],
    };

    mockSubscribeToItems.mockImplementation((callback) => {
      callback([...mockItems, oldItem]);
    });

    render(<App />);
    await screen.findByText('Red Hat');

    // Old item should be hidden by default
    expect(screen.queryByText('Old Lunch Box')).not.toBeInTheDocument();

    // Login as admin
    await loginAsAdmin();

    // Old item should now appear
    await waitFor(() => {
      expect(screen.getByText('Old Lunch Box')).toBeInTheDocument();
    });
  });

  it('admin can delete an item', async () => {
    mockDeleteItem.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);
    await screen.findByText('Red Hat');
    await loginAsAdmin();

    // After login, admin trash buttons appear on ItemCards
    const trashButtons = await screen.findAllByTitle('Delete item');
    expect(trashButtons.length).toBeGreaterThan(0);

    // Click delete on the first item
    fireEvent.click(trashButtons[0]);

    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith('1');
    });
  });

  it('delete is cancelled when confirm is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<App />);
    await screen.findByText('Red Hat');
    await loginAsAdmin();

    const trashButtons = await screen.findAllByTitle('Delete item');
    fireEvent.click(trashButtons[0]);

    expect(mockDeleteItem).not.toHaveBeenCalled();
  });

  it('admin mode toggle button logs out', async () => {
    render(<App />);
    await screen.findByText('Red Hat');
    await loginAsAdmin();

    // Admin banner should be visible
    expect(screen.getByText('Staff Mode Enabled')).toBeInTheDocument();

    // Click ADMIN MODE toggle in header to log out
    const adminToggleButtons = screen.getAllByText(/ADMIN MODE/i);
    fireEvent.click(adminToggleButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Staff Mode Enabled')).not.toBeInTheDocument();
    });
  });

  it('search and category filter work together', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    // Filter by School Hat category
    fireEvent.click(screen.getByRole('button', { name: /School Hat/i }));

    // Then also search for "red"
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), { target: { value: 'red' } });

    await waitFor(() => {
      expect(screen.getByText('Red Hat')).toBeInTheDocument();
      expect(screen.queryByText('Blue Bottle')).not.toBeInTheDocument();
    });
  });

  it('closing upload modal hides it', async () => {
    render(<App />);

    // Open modal
    fireEvent.click(screen.getByLabelText('Post new item'));
    expect(screen.getByText('Upload Photos')).toBeInTheDocument();

    // Close via X button
    const closeBtn = screen.getByTestId('icon-x').closest('button')!;
    fireEvent.click(closeBtn);

    // closeAndCancelAll is mocked; verify it was called (real impl closes modal)
    expect(mockCloseAndCancelAll).toHaveBeenCalled();
  });

  // ---- Photo Viewer ----

  it('clicking item image opens photo viewer', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    // In grid view, Gallery renders an img. Click the image.
    // Gallery renders <img> tags for each url. 
    // The first img in the document should belong to the first item.
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);

    // PhotoViewer should open and show a close button
    await waitFor(() => {
      expect(screen.getByLabelText('Close viewer')).toBeInTheDocument();
    });
  });

  it('closing photo viewer hides it', async () => {
    render(<App />);
    await screen.findByText('Red Hat');

    // Open viewer
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);
    await screen.findByLabelText('Close viewer');

    // Close it
    fireEvent.click(screen.getByLabelText('Close viewer'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Close viewer')).not.toBeInTheDocument();
    });
  });

  // ---- Pagination ----

  it('pagination appears when items exceed 10', async () => {
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const manyItems: Item[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      nameTag: `Item ${i + 1}`,
      category: 'School Hat',
      location: 'Playground',
      description: 'desc',
      foundDate: recentDate,
      imageUrls: [`img${i + 1}.jpg`],
      blurhashes: [],
    }));

    mockSubscribeToItems.mockImplementation((cb) => cb(manyItems));

    render(<App />);
    await screen.findByText('Item 1');

    // Only first 10 items shown on page 1
    expect(screen.getByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 11')).not.toBeInTheDocument();

    // Next page button should appear
    const nextBtn = screen.getByLabelText(/next page/i);
    expect(nextBtn).toBeInTheDocument();

    // Navigate to page 2
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('Item 11')).toBeInTheDocument();
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });

  // ---- Empty state ----

  it('shows empty state when no items returned from Firestore', async () => {
    mockSubscribeToItems.mockImplementation((cb) => cb([]));

    render(<App />);

    // App renders the empty state message when filtered list is empty
    await waitFor(() => {
      expect(screen.getByText(/No results matching your request/i)).toBeInTheDocument();
    });
  });

  // ---- Dark Mode ----

  it('dark mode toggle calls toggleDarkMode when clicked', async () => {
    render(<App />);

    const darkToggleBtns = screen.getAllByLabelText(/toggle dark mode/i);
    fireEvent.click(darkToggleBtns[0]);

    expect(mockToggleDarkMode).toHaveBeenCalled();
  });
});
