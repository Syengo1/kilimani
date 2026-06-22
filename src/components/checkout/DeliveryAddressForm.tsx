'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { Navigation, LocateFixed, CheckCircle2, Loader2, Map as MapIcon, AlertCircle } from 'lucide-react';
import { CheckoutFormState, FormErrors } from '@/types/checkout';

const libraries: ("places")[] = ["places"];

// Default to Nairobi center for the map fallback
const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

interface DeliveryAddressFormProps {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: FormErrors;
  isPending: boolean;
  isAddressVerified: boolean;
  setIsAddressVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DeliveryAddressForm({
  form,
  setForm,
  errors,
  isPending,
  isAddressVerified,
  setIsAddressVerified
}: DeliveryAddressFormProps) {
  const [showMap, setShowMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // NEW: State for graceful error handling
  const [locationError, setLocationError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [mapCenter, setMapCenter] = useState(NAIROBI_CENTER);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const handleReverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const place = results[0];
        let city = '';

        place.address_components.forEach(component => {
          if (component.types.includes('locality')) city = component.long_name;
          if (component.types.includes('administrative_area_level_1') && !city) city = component.long_name; 
        });

        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          street: place.formatted_address || '',
          city: city || prev.city
        }));
        setIsAddressVerified(true);
        setLocationError(null); // Clear any previous errors on success
      }
    });
  }, [setForm, setIsAddressVerified]);

  // =======================================================================
  // UPGRADED HTML5 GEOLOCATION: Graceful Fallback Automation
  // =======================================================================
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          setShowMap(true); 
          handleReverseGeocode(lat, lng);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation failed or denied:", error);
          setIsLocating(false);
          
          // Graceful UX: Provide specific feedback based on the error code
          if (error.code === 1) { // PERMISSION_DENIED
            setLocationError("Location access blocked. Check your browser settings or pin your location on the map.");
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            setLocationError("GPS signal unavailable. Please type your address.");
          } else { // TIMEOUT
            setLocationError("Location request timed out. Please type your address.");
          }

          // AUTOMATION: Automatically focus the search bar so the user can keep moving
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Added timeout to prevent infinite hanging
      );
    } else {
      setIsLocating(false);
      setLocationError("Your browser does not support Geolocation.");
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        setIsAddressVerified(false);
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      handleReverseGeocode(lat, lng);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full bg-foreground/[0.02] border border-border/60 rounded-xl py-8 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm font-medium">Initializing Google Logistics...</span>
      </div>
    );
  }

  const currentPosition = {
    lat: typeof form.latitude === 'number' && form.latitude !== 0 ? form.latitude : mapCenter.lat,
    lng: typeof form.longitude === 'number' && form.longitude !== 0 ? form.longitude : mapCenter.lng
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="flex items-center justify-between ml-1">
        <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground block">Shipping Address</label>
        {isAddressVerified && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={12} /> Verified
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {/* THE SEARCH BAR WITH MAP TOGGLE */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isAddressVerified ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              <Navigation size={18} />
            </span>
            
            <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged} options={{ componentRestrictions: { country: 'ke' } }}>
              <input
                ref={searchInputRef} // Added Ref for Auto-Focus
                type="text"
                placeholder="Search for your building, street, or area..."
                disabled={isPending}
                value={form.street}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, street: e.target.value }));
                  setIsAddressVerified(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 pl-12 pr-12 text-sm outline-none transition-all duration-300 ${
                  errors.street ? 'border-destructive/60 focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </Autocomplete>

            {/* MAP TOGGLE ICON IN THE INPUT */}
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all active:scale-95 ${
                showMap ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
              }`}
              title="Toggle Interactive Map"
            >
              <MapIcon size={16} />
            </button>
          </div>
        </div>
        {errors.street && <p className="text-destructive text-xs ml-1 font-medium">{errors.street}</p>}

        {/* GPS "USE CURRENT LOCATION" & ERROR HANDLING */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors w-fit ml-1 active:scale-95"
          >
            {isLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            <span>Use my current GPS location</span>
          </button>
          
          {/* Graceful Inline Error Message */}
          {locationError && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg animate-in fade-in zoom-in-95">
              <AlertCircle size={14} />
              <p>{locationError}</p>
            </div>
          )}
        </div>

        {/* THE INTERACTIVE BOLT-STYLE MAP */}
        {showMap && (
          <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-border/50 shadow-inner relative animate-in fade-in zoom-in-95 duration-300">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentPosition}
              zoom={16}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              <Marker 
                position={currentPosition}
                draggable={!isPending}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    handleReverseGeocode(e.latLng.lat(), e.latLng.lng());
                  }
                }}
                animation={window.google.maps.Animation.DROP}
              />
            </GoogleMap>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md pointer-events-none whitespace-nowrap">
              Drag pin to adjust precision
            </div>
          </div>
        )}

        {/* SECONDARY ADDRESS FIELDS */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <input
            type="text"
            placeholder="Apartment, Suite, Unit"
            disabled={isPending}
            value={form.building}
            onChange={(e) => setForm(prev => ({ ...prev, building: e.target.value }))}
            className="w-full bg-foreground/[0.02] border border-border/60 focus:bg-background rounded-xl py-3.5 px-4 text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
          />
          <div className="relative">
            <input
              type="text"
              placeholder="City / Region"
              disabled={isPending}
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              className={`w-full bg-foreground/[0.02] border focus:bg-background rounded-xl py-3.5 px-4 text-sm outline-none transition-all duration-300 ${
                errors.city ? 'border-destructive/60 focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>
        </div>
        
        <input
          type="text"
          placeholder="Delivery Instructions (e.g. Leave with guard)"
          disabled={isPending}
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full bg-foreground/[0.02] border border-border/60 focus:bg-background rounded-xl py-3.5 px-4 text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}