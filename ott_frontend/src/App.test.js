import { render, screen } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
test('renders the OTT Match Viewer header and watch button', () => {
  render(<App />);
  // Check actual elements from the custom OTT App, not CRA template text
  expect(screen.getByText(/OTT Match Viewer/i)).toBeInTheDocument();
  expect(screen.getByTestId('watch-video')).toBeInTheDocument();
});
