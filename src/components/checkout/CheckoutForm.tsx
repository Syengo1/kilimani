'use client';

import React, { useState, useTransition } from 'react';
import { processSecureCheckout, CheckoutCartItem } from '@/app/actions/checkout';
import { CheckoutFormState, FormErrors } from '@/types/checkout';
import FulfillmentToggle from './FulfillmentToggle';
import { MapPin, Phone, Mail, User, CreditCard, Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  cartItems: CheckoutCartItem[];
  subtotal: number;
  onSuccess: (orderRef: string) => void;
}

export default function CheckoutForm({ cartItems, subtotal, onSuccess }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [form, setForm] = useState<CheckoutFormState>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_type: 'delivery',
    street: '',
    building: '',
    city: 'Nairobi',
    notes: '',
    // Simulated coordinates for Kilimani/Ngong area delivery zone matching
    latitude: -1.2921,
    longitude: 36.8219,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = 'Full name is required.';
    
    // Strict email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.customer_email)) newErrors.customer_email = 'Provide a valid email address.';

    // M-Pesa standard regex matching 2547..., 2541..., 07..., 01... formats
    const phoneRegex = /^(?:254|\+254|0)?([71]\d{8})$/;
    if (!phoneRegex.test(form.customer_phone.replace(/\s+/g, ''))) {
      newErrors.customer_phone = 'Enter a valid Safaricom phone number.';
    }

    if (form.delivery_type === 'delivery') {
      if (!form.street.trim()) newErrors.street = 'Delivery address or street details required.';
      if (!form.city.trim()) newErrors.city = 'City field cannot be empty.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cleanPhoneNumber = (phone: string): string => {
    const raw = phone.replace(/\s+/g, '').replace('+', '');
    if (raw.startsWith('0')) return `254${raw.substring(1)}`;
    if (raw.startsWith('7') || raw.startsWith('1')) return `254${raw}`;
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      const formattedPayload = {
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim().toLowerCase(),
        customer_phone: cleanPhoneNumber(form.customer_phone),
        delivery_type: form.delivery_type,
        latitude: form.delivery_type === 'delivery' ? form.latitude : undefined,
        longitude: form.delivery_type === 'delivery' ? form.longitude : undefined,
        shipping_address: form.delivery_type === 'delivery' ? {
          street: form.street.trim(),
          building: form.building.trim(),
          city: form.city.trim(),
          notes: form.notes.trim()
        } : null,
        cart_items: cartItems
      };

      const response = await processSecureCheckout(formattedPayload);

      if (!response.success) {
        setErrors({ global: response.message || 'An error occurred during verification.' });
        return;
      }

      if (response.orderRef) {
        onSuccess(response.orderRef);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto w-full">
      {errors.global && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium rounded-xl">
          {errors.global}
        </div>
      )}

      {/* Fulfillment Toggle Block */}
      <div className="space-y-3">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Fulfillment Method</label>
        <FulfillmentToggle 
          value={form.delivery_type} 
          onChange={(val) => setForm(prev => ({ ...prev, delivery_type: val }))} 
        />
      </div>

      {/* Customer Information Cards */}
      <div className="space-y-5">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground block">Customer Information</label>
        
        <div className="space-y-4">
          {/* Full Name */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><User size={16} /></span>
            <input
              type="text"
              placeholder="Full Name"
              disabled={isPending}
              value={form.customer_name}
              onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 ${
                errors.customer_name ? 'border-destructive/60 focus:ring-1 focus:ring-destructive/30' : 'border-border/60 focus:ring-1 focus:ring-foreground/20'
              }`}
            />
            {errors.customer_name && <p className="text-destructive text-xs mt-1.5 pl-1 font-medium">{errors.customer_name}</p>}
          </div>

          {/* Email Address */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail size={16} /></span>
            <input
              type="email"
              placeholder="Email Address"
              disabled={isPending}
              value={form.customer_email}
              onChange={(e) => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 ${
                errors.customer_email ? 'border-destructive/60 focus:ring-1 focus:ring-destructive/30' : 'border-border/60 focus:ring-1 focus:ring-foreground/20'
              }`}
            />
            {errors.customer_email && <p className="text-destructive text-xs mt-1.5 pl-1 font-medium">{errors.customer_email}</p>}
          </div>

          {/* M-Pesa Number Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Phone size={16} /></span>
            <input
              type="text"
              placeholder="M-Pesa Phone Number (e.g., 0712345678)"
              disabled={isPending}
              value={form.customer_phone}
              onChange={(e) => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 ${
                errors.customer_phone ? 'border-destructive/60 focus:ring-1 focus:ring-destructive/30' : 'border-border/60 focus:ring-1 focus:ring-foreground/20'
              }`}
            />
            {errors.customer_phone && <p className="text-destructive text-xs mt-1.5 pl-1 font-medium">{errors.customer_phone}</p>}
          </div>
        </div>
      </div>

      {/* Delivery Addressing Module (Conditionally Controlled Animation) */}
      {form.delivery_type === 'delivery' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground block">Delivery Address</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative md:col-span-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><MapPin size={16} /></span>
              <input
                type="text"
                placeholder="Street / Route Description"
                disabled={isPending}
                value={form.street}
                onChange={(e) => setForm(prev => ({ ...prev, street: e.target.value }))}
                className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 ${
                  errors.street ? 'border-destructive/60 focus:ring-1 focus:ring-destructive/30' : 'border-border/60 focus:ring-1 focus:ring-foreground/20'
                }`}
              />
              {errors.street && <p className="text-destructive text-xs mt-1.5 pl-1 font-medium">{errors.street}</p>}
            </div>

            <input
              type="text"
              placeholder="Apartment, Building, Suite (Optional)"
              disabled={isPending}
              value={form.building}
              onChange={(e) => setForm(prev => ({ ...prev, building: e.target.value }))}
              className="w-full bg-foreground/[0.02] border border-border/60 focus:bg-background rounded-xl py-3.5 px-4 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-foreground/20"
            />

            <input
              type="text"
              placeholder="City / Region"
              disabled={isPending}
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              className="w-full bg-foreground/[0.02] border border-border/60 focus:bg-background rounded-xl py-3.5 px-4 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-foreground/20"
            />
          </div>
        </div>
      )}

      {/* Pickup Information Panel */}
      {form.delivery_type === 'pickup' && (
        <div className="p-4 bg-foreground/[0.02] border border-border/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3">
            <MapPin className="text-muted-foreground shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Kilimani Flagship Studio Pick-Up</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Galana Road, Nairobi. Ready for pickup within 2 hours of payment confirmation. We will call you immediately your package is compiled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Order Trigger */}
      <button
        type="submit"
        disabled={isPending || cartItems.length === 0}
        className="w-full bg-foreground text-background font-semibold py-4 px-6 rounded-xl text-sm transition-all duration-300 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-foreground/5"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Securing Stock...</span>
          </>
        ) : (
          <>
            <CreditCard size={16} />
            <span>Authorize STK Push payment</span>
          </>
        )}
      </button>
    </form>
  );
}