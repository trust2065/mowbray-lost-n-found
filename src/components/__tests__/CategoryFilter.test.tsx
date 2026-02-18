import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategoryFilter from '../CategoryFilter';
import { CATEGORIES } from '../../constants';

describe('CategoryFilter', () => {
  const mockSetSelectedCategory = vi.fn();

  it('renders all category buttons', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        setSelectedCategory={mockSetSelectedCategory}
      />
    );

    expect(screen.getByText('All Items')).toBeInTheDocument();
    CATEGORIES.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('highlights the selected category', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        setSelectedCategory={mockSetSelectedCategory}
      />
    );

    const allButton = screen.getByText('All Items');
    expect(allButton).toHaveClass('bg-blue-600', 'text-white');

    // Check other buttons are not highlighted
    CATEGORIES.forEach(category => {
      const button = screen.getByText(category);
      expect(button).not.toHaveClass('bg-blue-600');
    });
  });

  it('calls setSelectedCategory when a category is clicked', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        setSelectedCategory={mockSetSelectedCategory}
      />
    );

    const firstCategory = CATEGORIES[0];
    const categoryButton = screen.getByText(firstCategory);

    fireEvent.click(categoryButton);

    expect(mockSetSelectedCategory).toHaveBeenCalledWith(firstCategory);
  });

  it('highlights a specific category when selected', () => {
    const selected = CATEGORIES[0];
    render(
      <CategoryFilter
        selectedCategory={selected}
        setSelectedCategory={mockSetSelectedCategory}
      />
    );

    const selectedButton = screen.getByText(selected);
    expect(selectedButton).toHaveClass('bg-blue-600', 'text-white');

    const allButton = screen.getByText('All Items');
    expect(allButton).not.toHaveClass('bg-blue-600');
  });

  it('calls setSelectedCategory("All") when "All Items" is clicked', () => {
    render(
      <CategoryFilter
        selectedCategory={CATEGORIES[0]}
        setSelectedCategory={mockSetSelectedCategory}
      />
    );

    const allButton = screen.getByText('All Items');
    fireEvent.click(allButton);

    expect(mockSetSelectedCategory).toHaveBeenCalledWith('All');
  });
});

