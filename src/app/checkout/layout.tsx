import { CartProvider } from '@/components/storefront/cart/CartContext';

export const metadata = {
  title: 'Secure Checkout | Kilimani Hair',
  description: 'Complete your purchase securely.',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We provide a fresh Cart instance here. 
    // Because of our elite cross-tab sync engine, it will instantly 
    // grab the items from localStorage and hydrate the checkout page perfectly!
    <CartProvider>
      {children}
    </CartProvider>
  );
}