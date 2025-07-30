import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe board', () => {
  render(<App />);
  // Main title should appear
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
  // Should render some squares
  expect(screen.getAllByRole('button', { name: /empty square/i }).length).toBeGreaterThanOrEqual(1);
});
