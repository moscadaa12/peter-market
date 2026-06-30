import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ThemeContextProvider from './context/ThemeContext';
import AppRouter from './routes/AppRouter';
import InstallPrompt from './components/shared/InstallPrompt';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeContextProvider>
        <AuthProvider>
          <CartProvider>
            <AppRouter />
            <InstallPrompt />
          </CartProvider>
        </AuthProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  );
}
