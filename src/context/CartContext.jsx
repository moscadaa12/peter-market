import { createContext, useReducer, useEffect } from 'react';

export const CartContext = createContext(null);

const STORAGE_KEY = 'peter-market-cart';

// Lee el carrito desde localStorage al iniciar
function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { items: parsed.items || [], totalPrice: calcTotalPrice(parsed.items) };
    }
  } catch {
    // Si hay error al parsear, inicia vacío
  }
  return { items: [], totalPrice: 0 };
}

function calcTotalPrice(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const product = action.payload;
      const existingIndex = state.items.findIndex((i) => i.id === product.id);
      let items;

      if (existingIndex >= 0) {
        items = state.items.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        items = [...state.items, { ...product, quantity: 1 }];
      }

      return { items, totalPrice: calcTotalPrice(items) };
    }

    case 'REMOVE_FROM_CART': {
      const items = state.items.filter((i) => i.id !== action.payload);
      return { items, totalPrice: calcTotalPrice(items) };
    }

    case 'UPDATE_QUANTITY': {
      const { id, amount } = action.payload;
      if (amount <= 0) {
        // Si la cantidad es 0 o negativa, remueve el producto
        const items = state.items.filter((i) => i.id !== id);
        return { items, totalPrice: calcTotalPrice(items) };
      }
      const items = state.items.map((i) =>
        i.id === id ? { ...i, quantity: amount } : i
      );
      return { items, totalPrice: calcTotalPrice(items) };
    }

    case 'CLEAR_CART':
      return { items: [], totalPrice: 0 };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadInitialState);

  // Persiste cada cambio en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
  }, [state.items]);

  const addToCart = (product) => dispatch({ type: 'ADD_TO_CART', payload: product });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  const updateQuantity = (id, amount) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, amount } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice: state.totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
