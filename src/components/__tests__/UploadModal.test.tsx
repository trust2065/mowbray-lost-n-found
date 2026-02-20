import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UploadModal from '../UploadModal';
import type { PendingItem } from '../../types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Upload: () => <span data-testid="icon-upload" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  AlertCircle: () => <span data-testid="icon-alert" />
}));

// Mock utils
vi.mock('../../utils/imageCompression', () => ({
  compressImage: vi.fn(),
  needsCompression: vi.fn().mockReturnValue(false),
  formatFileSize: vi.fn(),
  isFileTooLarge: vi.fn().mockReturnValue(false)
}));

vi.mock('../../utils/blurhash', () => ({
  encodeImageToBlurhash: vi.fn().mockResolvedValue('L6PZfSi_*.L6PZfSi_')
}));

describe('UploadModal', () => {
  const mockOnClose = vi.fn();
  const mockOnFileSelect = vi.fn();
  const mockOnUpdatePendingField = vi.fn();
  const mockOnRemovePendingItem = vi.fn();
  const mockOnAutoFillItem = vi.fn();
  const mockOnAutoFillAll = vi.fn();
  const mockOnConfirmUpload = vi.fn();
  const fileInputRef = { current: null } as unknown as React.RefObject<HTMLInputElement>;

  const defaultProps = {
    isOpen: true,
    isAdmin: false,
    pendingItems: [],
    onClose: mockOnClose,
    onFileSelect: mockOnFileSelect,
    onUpdatePendingField: mockOnUpdatePendingField,
    onRemovePendingItem: mockOnRemovePendingItem,
    onAutoFillItem: mockOnAutoFillItem,
    onAutoFillAll: mockOnAutoFillAll,
    onConfirmUpload: mockOnConfirmUpload,
    fileInputRef
  };

  const mockPendingItem: PendingItem = {
    id: '1',
    nameTag: 'Test Item',
    category: 'Clothing',
    location: 'Main Building',
    description: 'A blue shirt',
    imageUrls: ['blob:url'],
    blurhashes: [],
    activePreviewIdx: 0,
    isAnalyzing: false
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<UploadModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders upload area when pendingItems is empty', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
    expect(screen.getByText('Select up to 5 photo(s)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<UploadModal {...defaultProps} />);
    const closeBtn = screen.getByTestId('icon-x').closest('button');
    fireEvent.click(closeBtn!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders pending items correctly', () => {
    render(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
      />
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A blue shirt')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('calls onUpdatePendingField when fields change', () => {
    render(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Item');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(mockOnUpdatePendingField).toHaveBeenCalledWith(0, 'nameTag', 'New Name');

    const descInput = screen.getByDisplayValue('A blue shirt');
    fireEvent.change(descInput, { target: { value: 'New Desc' } });
    expect(mockOnUpdatePendingField).toHaveBeenCalledWith(0, 'description', 'New Desc');

    // Select category (using label or role needs aria-label or id usage from component)
    // The component uses native select. 
    // We can find by display value or by role 'combobox' if there are multiple, need specific.
    // The component has nice structure, let's look at implementation for select.
  });

  it('calls onRemovePendingItem when trash button is clicked', () => {
    render(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
      />
    );

    const removeBtn = screen.getByTitle('Remove item');
    fireEvent.click(removeBtn);
    expect(mockOnRemovePendingItem).toHaveBeenCalledWith('1');
  });

  it('calls onConfirmUpload when Post button is clicked', () => {
    render(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
      />
    );

    const postBtn = screen.getByText(/Post 1 Item/);
    fireEvent.click(postBtn);
    expect(mockOnConfirmUpload).toHaveBeenCalled();
  });

  it('shows AI fill button only for admin', () => {
    const { rerender } = render(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
        isAdmin={false}
      />
    );
    expect(screen.queryByText('AI Fill')).not.toBeInTheDocument();

    rerender(
      <UploadModal
        {...defaultProps}
        pendingItems={[mockPendingItem]}
        isAdmin={true}
      />
    );
    expect(screen.getByText('AI Fill')).toBeInTheDocument();
  });
});
