import { CheckoutCartItem, ShippingAddress } from '@/app/actions/checkout';

export interface CheckoutFormState {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: 'pickup' | 'delivery';
  street: string;
  building: string;
  city: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

export interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  street?: string;
  city?: string;
  global?: string;
}