import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ItemCard from '../ItemCard';
import type { Item } from '../../types';

// Mock Gallery component
vi.mock('../Gallery', () => ({
  default: ({ onPhotoClick }: { onPhotoClick: (index: number) => void; }) => (
    <div data-testid="mock-gallery" onClick={() => onPhotoClick(0)}>
      Mock Gallery
    </div>
  ),
}));

// Mock react-blurhash
vi.mock('react-blurhash', () => ({
  Blurhash: () => <div data-testid="mock-blurhash">Blurhash</div>,
}));

describe('ItemCard', () => {
  const mockItem: Item = {
    id: '123',
    nameTag: 'Blue Hat',
    category: 'School Hat',
    location: 'Playground',
    description: 'A blue school hat found near the slide',
    foundDate: '2023-01-01T10:00:00Z',
    imageUrls: ['http://example.com/image1.jpg'],
    blurhashes: ['LEHV6nWB2yk8pyo0adR*.7kCMdnj']
  };

  const defaultProps = {
    item: mockItem,
    viewMode: 'grid' as const,
    onPhotoClick: vi.fn(),
    isAdmin: false,
    onDelete: vi.fn(),
  };

  // Setup window.confirm mock
  const confirmSpy = vi.spyOn(window, 'confirm');

  beforeEach(() => {
    confirmSpy.mockReset();
    // Default to true for confirm dialogs
    confirmSpy.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders item details correctly in grid view', () => {
    render(<ItemCard {...defaultProps} viewMode="grid" />);

    expect(screen.getByText('Blue Hat')).toBeInTheDocument();
    expect(screen.getByText('School Hat')).toBeInTheDocument();

    // Location should be visible in grid view
    expect(screen.getByText('Playground')).toBeInTheDocument();

    // Should render Gallery mock
    expect(screen.getByTestId('mock-gallery')).toBeInTheDocument();
  });

  it('renders item details correctly in list view', () => {
    render(<ItemCard {...defaultProps} viewMode="list" />);

    expect(screen.getByText('Blue Hat')).toBeInTheDocument();
    expect(screen.getByText('Playground')).toBeInTheDocument();

    // Should render image directly
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://example.com/image1.jpg');
  });

  it('handles photo click in grid view', () => {
    const onPhotoClickMock = vi.fn();
    render(<ItemCard {...defaultProps} viewMode="grid" onPhotoClick={onPhotoClickMock} />);

    const gallery = screen.getByTestId('mock-gallery');
    fireEvent.click(gallery);

    expect(onPhotoClickMock).toHaveBeenCalledWith(mockItem.imageUrls, 0);
  });

  it('handles photo click in list view', () => {
    const onPhotoClickMock = vi.fn();
    render(<ItemCard {...defaultProps} viewMode="list" onPhotoClick={onPhotoClickMock} />);

    const img = screen.getByRole('img');
    fireEvent.click(img);

    expect(onPhotoClickMock).toHaveBeenCalledWith(mockItem.imageUrls, 0);
  });

  it('shows delete button and calls onDelete when confirmed (Grid View)', () => {
    const onDeleteMock = vi.fn();
    render(<ItemCard {...defaultProps} viewMode="grid" isAdmin={true} onDelete={onDeleteMock} />);

    const deleteBtn = screen.getByTitle('Delete item');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Mark this item as deleted?');
    expect(onDeleteMock).toHaveBeenCalledWith(mockItem.id);
  });

  it('shows delete button and calls onDelete when confirmed (List View)', () => {
    const onDeleteMock = vi.fn();
    render(<ItemCard {...defaultProps} viewMode="list" isAdmin={true} onDelete={onDeleteMock} />);

    const deleteBtn = screen.getByTitle('Delete item');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Mark this item as deleted?');
    expect(onDeleteMock).toHaveBeenCalledWith(mockItem.id);
  });

  it('does NOT call onDelete if cancel is clicked in confirm dialog', () => {
    confirmSpy.mockReturnValue(false);
    const onDeleteMock = vi.fn();
    render(<ItemCard {...defaultProps} viewMode="grid" isAdmin={true} onDelete={onDeleteMock} />);

    const deleteBtn = screen.getByTitle('Delete item');
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteMock).not.toHaveBeenCalled();
  });

  it('does not show delete button if not admin', () => {
    render(<ItemCard {...defaultProps} isAdmin={false} />);
    const deleteBtn = screen.queryByTitle('Delete item');
    expect(deleteBtn).not.toBeInTheDocument();
  });
});
