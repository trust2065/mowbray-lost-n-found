import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Gallery from '../Gallery';

// Mock react-blurhash
vi.mock('react-blurhash', () => ({
  Blurhash: () => <div data-testid="mock-blurhash">Blurhash</div>,
}));

describe('Gallery', () => {
  const urls = ['http://example.com/1.jpg', 'http://example.com/2.jpg'];
  const blurhashes = ['L6PZfSi_*.L6PZfSi_', 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'];

  it('renders the first image by default', () => {
    render(<Gallery urls={urls} blurhashes={blurhashes} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', urls[0]);
  });

  it('shows navigation dots for multiple images', () => {
    render(<Gallery urls={urls} blurhashes={blurhashes} />);
    // Based on logic: urls.length > 1
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('changes image when clicking a dot', () => {
    render(<Gallery urls={urls} blurhashes={blurhashes} />);
    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[1]);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', urls[1]);
  });

  it('calls onPhotoClick when image is clicked', () => {
    const onPhotoClickMock = vi.fn();
    render(<Gallery urls={urls} blurhashes={blurhashes} onPhotoClick={onPhotoClickMock} />);

    // Find the container or image that has the click handler
    // The outer div has onClick
    // const container = screen.getByRole('img').parentElement; // Might be risky if structure changes
    // Better: render puts it in a container. The root element of Gallery is the div with onClick.
    // We can click the image itself as it bubbles up

    const img = screen.getByRole('img');
    fireEvent.click(img);

    expect(onPhotoClickMock).toHaveBeenCalledWith(0);
  });

  it('renders placeholder if no urls', () => {
    const { container } = render(<Gallery urls={[]} />);
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });
});
