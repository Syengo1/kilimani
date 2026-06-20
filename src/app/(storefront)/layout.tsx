import { CartProvider } from '@/components/storefront/cart/CartContext';
import StorefrontHeader from '@/components/storefront/StorefrontHeader';
import StorefrontMobileNav from '@/components/storefront/StorefrontMobileNav';
//import Footer from '@/components/layout/Footer';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col relative bg-background">
        
        {/* Fixed Header Height Offset */}
        <StorefrontHeader />
        
        {/* Main Content Workspace */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* Global Storefront Footer could go here 
        <Footer/>*/}

        {/* Mobile Navbar docked at the bottom */}
        <StorefrontMobileNav />
        
      </div>
    </CartProvider>
  );
}