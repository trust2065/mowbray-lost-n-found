import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SuccessToast from '../SuccessToast';

describe('SuccessToast', () => {
    it('renders nothing when show is false', () => {
        const { container } = render(<SuccessToast show={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders success message when show is true', () => {
        render(<SuccessToast show={true} />);
        expect(screen.getByText('Posted to Mowbray Hub!')).toBeInTheDocument();
    });
});
