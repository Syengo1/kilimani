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
    // Because we upgraded to Zustand, the cart state automatically hydrates globally.
    // No context providers are needed here anymore!
    <>
      {children}
    </>
  );
}