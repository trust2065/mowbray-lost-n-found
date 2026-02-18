import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PhotoViewer from '../PhotoViewer';

describe('PhotoViewer', () => {
  const defaultProps = {
    urls: ['http://example.com/1.jpg', 'http://example.com/2.jpg'],
    initialIndex: 0,
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<PhotoViewer {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders current image when open', () => {
    render(<PhotoViewer {...defaultProps} />);
    const images = screen.getAllByRole('img');
    // Check if at least one image is rendered and it matches the current index
    const currentImg = images.find(img => img.getAttribute('src') === defaultProps.urls[0]);
    expect(currentImg).toBeInTheDocument();
  });

  it('sets initial index correctly', () => {
    render(<PhotoViewer {...defaultProps} initialIndex={1} />);
    const images = screen.getAllByRole('img');
    const currentImg = images.find(img => img.getAttribute('src') === defaultProps.urls[1]);
    expect(currentImg).toBeInTheDocument();
    expect(screen.getByText(`2 / ${defaultProps.urls.length}`)).toBeInTheDocument();
  });

  it('navigates next/prev via buttons', () => {
    render(<PhotoViewer {...defaultProps} />);

    const nextBtn = screen.getByLabelText('Next photo');
    const prevBtn = screen.getByLabelText('Previous photo');

    // Initial state: index 0. image 1.
    let images = screen.getAllByRole('img');
    expect(images.find(img => img.getAttribute('src') === defaultProps.urls[0])).toBeInTheDocument();

    // Click Next -> Index 1
    fireEvent.click(nextBtn);
    images = screen.getAllByRole('img');
    expect(images.find(img => img.getAttribute('src') === defaultProps.urls[1])).toBeInTheDocument();

    // Click Next (loop) -> Index 0
    fireEvent.click(nextBtn);
    images = screen.getAllByRole('img');
    expect(images.find(img => img.getAttribute('src') === defaultProps.urls[0])).toBeInTheDocument();

    // Click Prev (loop) -> Index 1 (last)
    fireEvent.click(prevBtn);
    images = screen.getAllByRole('img');
    expect(images.find(img => img.getAttribute('src') === defaultProps.urls[1])).toBeInTheDocument();
  });

  it('closes on close button click', () => {
    const onCloseMock = vi.fn();
    render(<PhotoViewer {...defaultProps} onClose={onCloseMock} />);

    const closeBtn = screen.getByLabelText('Close viewer');
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('downloads photo on download button click', () => {
    // Mock createElement and appendChild to test download
    // Cannot spy on document.body.appendChild directly in JSDOM if not handled carefully
    // So for this test, let's just spy on createElement and link click if possible, or skip download logic deep test.
    // However, the error "Target container is not a DOM element" suggests `render` failed.
    // It might be due to `document.body` mock implementation interfering with React rendering which appends to body.

    const linkMock = document.createElement('a');
    const clickSpy = vi.spyOn(linkMock, 'click');

    // Store original implementation before spying
    const originalCreateElement = document.createElement.bind(document);

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === 'a') {
        return linkMock;
      }
      return originalCreateElement(tagName, options);
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    render(<PhotoViewer {...defaultProps} />);

    const downloadBtn = screen.getByLabelText('Download photo');
    fireEvent.click(downloadBtn);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(linkMock.href).toContain(defaultProps.urls[0]);
    expect(clickSpy).toHaveBeenCalled();

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });
});


