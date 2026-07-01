'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { processSecureCheckout, CheckoutCartItem } from '@/app/actions/checkout';
import { CheckoutFormState, FormErrors } from '@/types/checkout';
import FulfillmentToggle from './FulfillmentToggle';
import DeliveryAddressForm from './DeliveryAddressForm';
import { MapPin, Phone, Mail, User, Loader2 } from 'lucide-react';
import { calculateDistance, calculateDeliveryFee } from '@/lib/checkout/haversine';

interface CheckoutFormProps {
  formId?: string; // NEW: Allows the parent to link a detached submit button
  cartItems: CheckoutCartItem[];
  subtotal: number;
  onSuccess: (orderRef: string) => void;
  onDeliveryFeeCalculated: (fee: number) => void; 
  onSubmittingChange?: (isSubmitting: boolean) => void; // NEW: Tells the parent when to show the spinner
}

export default function CheckoutForm({ 
  formId = 'checkout-form', 
  cartItems, 
  subtotal, 
  onSuccess, 
  onDeliveryFeeCalculated,
  onSubmittingChange 
}: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAddressVerified, setIsAddressVerified] = useState(false);

  const [form, setForm] = useState<CheckoutFormState>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_type: 'delivery',
    street: '',
    building: '',
    city: '',
    notes: '',
    latitude: 0,
    longitude: 0,
  });

  // Sync the pending state to the parent page's detached button
  useEffect(() => {
    onSubmittingChange?.(isPending);
  }, [isPending, onSubmittingChange]);

  // =======================================================================
  // REAL-TIME LOGISTICS CALCULATOR
  // =======================================================================
  useEffect(() => {
    let fee = 0;
    
    if (form.delivery_type === 'pickup') {
      fee = 0;
    } else if (form.delivery_type === 'delivery' && form.latitude && form.longitude && isAddressVerified) {
      const distance = calculateDistance(form.latitude, form.longitude);
      fee = Math.round(calculateDeliveryFee(distance));
    }
    
    onDeliveryFeeCalculated(fee);
  }, [form.delivery_type, form.latitude, form.longitude, isAddressVerified, onDeliveryFeeCalculated]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = 'Full name is required.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.customer_email)) newErrors.customer_email = 'Provide a valid email address.';

    const phoneRegex = /^(?:254|\+254|0)?([71]\d{8})$/;
    if (!phoneRegex.test(form.customer_phone.replace(/\s+/g, ''))) {
      newErrors.customer_phone = 'Enter a valid Safaricom phone number.';
    }

    if (form.delivery_type === 'delivery') {
      if (!isAddressVerified || form.latitude === 0) {
        newErrors.street = 'Please select a verified address from the map or dropdown.';
      }
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
    // THE FORM ID: This allows the external button on the parent page to trigger this form
    <form id={formId} onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto w-full">
      {errors.global && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <Loader2 size={16} className="shrink-0" />
          {errors.global}
        </div>
      )}

      {/* Fulfillment Toggle Block */}
      <div className="space-y-3">
        <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground ml-1">Fulfillment Method</label>
        <FulfillmentToggle 
          value={form.delivery_type} 
          onChange={(val) => setForm(prev => ({ ...prev, delivery_type: val }))} 
        />
      </div>

      {/* Customer Information Cards */}
      <div className="space-y-4">
        <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground ml-1 block">Customer Details</label>
        
        <div className="space-y-3">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><User size={18} /></span>
            <input
              type="text"
              placeholder="Full Name"
              disabled={isPending}
              value={form.customer_name}
              onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all duration-300 ${
                errors.customer_name ? 'border-destructive/60 focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:ring-2 focus:ring-primary/20 hover:border-border'
              }`}
            />
            {errors.customer_name && <p className="text-destructive text-xs mt-1.5 pl-1 font-bold">{errors.customer_name}</p>}
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Mail size={18} /></span>
            <input
              type="email"
              placeholder="Email Address (For receipts)"
              disabled={isPending}
              value={form.customer_email}
              onChange={(e) => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all duration-300 ${
                errors.customer_email ? 'border-destructive/60 focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:ring-2 focus:ring-primary/20 hover:border-border'
              }`}
            />
            {errors.customer_email && <p className="text-destructive text-xs mt-1.5 pl-1 font-bold">{errors.customer_email}</p>}
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Phone size={18} /></span>
            <input
              type="text"
              placeholder="M-Pesa Phone Number (e.g., 0712345678)"
              disabled={isPending}
              value={form.customer_phone}
              onChange={(e) => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all duration-300 ${
                errors.customer_phone ? 'border-destructive/60 focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:ring-2 focus:ring-primary/20 hover:border-border'
              }`}
            />
            {errors.customer_phone && <p className="text-destructive text-xs mt-1.5 pl-1 font-bold">{errors.customer_phone}</p>}
          </div>
        </div>
      </div>

      {/* The Extracted Delivery & Map Module */}
      {form.delivery_type === 'delivery' && (
        <DeliveryAddressForm 
          form={form}
          setForm={setForm}
          errors={errors}
          isPending={isPending}
          isAddressVerified={isAddressVerified}
          setIsAddressVerified={setIsAddressVerified}
        />
      )}

      {/* Pickup Information Panel */}
      {form.delivery_type === 'pickup' && (
        <div className="p-5 bg-foreground/[0.02] border border-border/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
          <div className="flex gap-4">
            <div className="p-2.5 bg-background rounded-full border border-border/50 shadow-sm h-fit">
              <MapPin className="text-foreground shrink-0" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Kilimani Flagship Studio Pick-Up</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Latema Road, Nairobi. Ready for pickup within 2 hours of payment confirmation. We will call you immediately your package is compiled.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}