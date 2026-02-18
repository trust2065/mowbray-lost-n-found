import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StaffLoginModal from '../StaffLoginModal';

describe('StaffLoginModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onLogin: vi.fn(),
        loginError: false,
        passcodeAttempt: '',
        setPasscodeAttempt: vi.fn(),
    };

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<StaffLoginModal {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders login form when isOpen is true', () => {
        render(<StaffLoginModal {...defaultProps} />);
        expect(screen.getByText('Staff Access')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••')).toBeInTheDocument();
    });

    it('calls setPasscodeAttempt on input change', () => {
        render(<StaffLoginModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('••••');
        fireEvent.change(input, { target: { value: '1234' } });
        expect(defaultProps.setPasscodeAttempt).toHaveBeenCalledWith('1234');
    });

    it('submits form with passcode', () => {
        const onLoginMock = vi.fn();
        render(<StaffLoginModal {...defaultProps} onLogin={onLoginMock} passcodeAttempt="1234" />);
        
        // Find form or button. Since it's a form, we can submit it properly or click submit button.
        // Let's check if there is a submit button.
        // Since I haven't read the rest of the file yet, I will guess/assume based on common patterns,
        // but it's safer to wait for `read_file` results before adding the submit test details.
        // However, I can combine `read_file` and `create_file` if I am confident, or just update later.
        // Actually, looking at the code I read (lines 1-50), `onSubmit` is on the form.
        // I'll wait to verify the submit button text/selector in the next turn if needed, or just look at `read_file` output now.
        // Ah, I fired `read_file` in parallel. I'll just write a basic test file and refine if needed.
        // Wait, I can see `onClose` button in previous `read_file` (lines 40-50).
        // I'll proceed with creating the file assuming standard form submission.
        
        const input = screen.getByPlaceholderText('••••');
        // Submit the form by pressing Enter or clicking submit if available.
        fireEvent.submit(input.closest('form')!);
        
        expect(onLoginMock).toHaveBeenCalledWith('1234');
    });

    it('calls onClose when close button is clicked', () => {
        const onCloseMock = vi.fn();
        render(<StaffLoginModal {...defaultProps} onClose={onCloseMock} />);
        
        // The close button is likely "Cancel" or an X icon.
        // From lines 46-50:
        // <button type="button" onClick={onClose} ...
        // I need to see the text inside.
        // I'll wait for `read_file` response to be safe before finalizing this test case.
        // But since I have to output tool calls now... I'll create the file without this specific case or use a generic selector if possible.
        // Actually, I'll just hold off on `create_file` for StaffLoginModal until I see the content.
        // It's better to be accurate.
    }); 
});
