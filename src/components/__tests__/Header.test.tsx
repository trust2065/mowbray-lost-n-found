import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

describe('Header', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    viewMode: 'grid' as const,
    setViewMode: vi.fn(),
    onTitleDoubleClick: vi.fn(),
    isAdmin: false,
    onAdminToggle: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    isSemanticSearch: false,
    setIsSemanticSearch: vi.fn(),
    isEmbeddingLoading: false,
  };

  it('renders the title correctly', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Mowbray Public/i)).toBeInTheDocument();
    expect(screen.getByText(/Lost & Found Hub/i)).toBeInTheDocument();
  });

  it('calls setSearchQuery when search input changes', () => {
    const setSearchQueryMock = vi.fn();
    render(<Header {...defaultProps} setSearchQuery={setSearchQueryMock} />);

    const searchInput = screen.getByPlaceholderText(/Search items.../i);
    fireEvent.change(searchInput, { target: { value: 'hat' } });

    expect(setSearchQueryMock).toHaveBeenCalledWith('hat');
  });

  it('calls setViewMode when view mode buttons are clicked', () => {
    const setViewModeMock = vi.fn();
    render(<Header {...defaultProps} setViewMode={setViewModeMock} />);

    // Use getAllByLabelText because there are mobile and desktop versions
    const gridButtons = screen.getAllByLabelText(/Grid View/i);
    const listButtons = screen.getAllByLabelText(/List View/i);

    // Test list view toggle
    fireEvent.click(listButtons[0]);
    // The mock should be called with 'list'
    expect(setViewModeMock).toHaveBeenCalledWith('list');

    setViewModeMock.mockClear();

    // Test grid view toggle
    fireEvent.click(gridButtons[0]);
    // The mock should be called with 'grid'
    expect(setViewModeMock).toHaveBeenCalledWith('grid');
  });

  it('calls toggleDarkMode when dark mode button is clicked', () => {
    const toggleDarkModeMock = vi.fn();
    render(<Header {...defaultProps} toggleDarkMode={toggleDarkModeMock} />);

    const darkModeButtons = screen.getAllByLabelText(/Toggle Dark Mode/i);
    fireEvent.click(darkModeButtons[0]);

    expect(toggleDarkModeMock).toHaveBeenCalled();
  });

  it('calls onTitleDoubleClick when title area is double clicked', () => {
    const onTitleDoubleClickMock = vi.fn();
    render(<Header {...defaultProps} onTitleDoubleClick={onTitleDoubleClickMock} />);

    const titleElement = screen.getByText(/Mowbray Public/i).closest('div');
    if (titleElement) {
      fireEvent.doubleClick(titleElement);
      expect(onTitleDoubleClickMock).toHaveBeenCalled();
    } else {
      throw new Error('Title element not found');
    }
  });

  it('does not show cursor-pointer when onTitleDoubleClick is missing', () => {
    render(<Header {...defaultProps} onTitleDoubleClick={undefined} />);
    const titleParent = screen.getByText(/Mowbray Public/i).closest('.cursor-pointer');
    expect(titleParent).not.toBeInTheDocument();
  });
});

