'use client';

import { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

export interface ProductImage {
  id: string;
  url: string;
  display_order: number;
}

interface MediaSectionProps {
  existingImages: ProductImage[];
  setExistingImages: React.Dispatch<React.SetStateAction<ProductImage[]>>;
  setDeletedImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
  newImages: File[];
  setNewImages: React.Dispatch<React.SetStateAction<File[]>>;
  newPreviewUrls: string[];
  setNewPreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isWorking: boolean;
}

export default function MediaSection({
  existingImages, setExistingImages, setDeletedImageUrls,
  newImages, setNewImages, newPreviewUrls, setNewPreviewUrls, isWorking
}: MediaSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...selectedFiles]);
      const urls = selectedFiles.map(file => URL.createObjectURL(file));
      setNewPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeNewImage = (indexToRemove: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setNewPreviewUrls(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const removeExistingImage = (idToRemove: string, urlToRemove: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== idToRemove));
    setDeletedImageUrls(prev => [...prev, urlToRemove]);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          2. Product Media
        </h2>
        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md">
          {existingImages.length + newImages.length} Attached
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => !isWorking && fileInputRef.current?.click()}
          className={`col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 h-32 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center transition-all ${isWorking ? 'bg-secondary/20 cursor-not-allowed opacity-50' : 'bg-background/50 hover:bg-secondary/50 hover:border-primary/50 cursor-pointer group'}`}
        >
          <UploadCloud className="text-muted-foreground mb-2 group-hover:text-primary transition-colors" size={24} />
          <p className="text-xs font-bold text-foreground/70">Click to upload</p>
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" disabled={isWorking} />
        </div>

        {existingImages.map((img, idx) => (
          <div key={img.id} className="relative h-32 rounded-xl border border-border overflow-hidden">
            <Image src={img.url} alt={`Existing ${idx}`} fill className="object-cover" unoptimized />
            {!isWorking && (
              <button type="button" onClick={() => removeExistingImage(img.id, img.url)} className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur text-foreground border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors shadow-sm z-10"><X size={14} /></button>
            )}
          </div>
        ))}

        {newPreviewUrls.map((url, idx) => (
          <div key={url} className="relative h-32 rounded-xl border border-primary/50 overflow-hidden shadow-[0_0_0_2px_rgba(var(--primary),0.2)]">
            <Image src={url} alt={`New ${idx}`} fill className="object-cover" unoptimized />
            {!isWorking && (
              <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur text-foreground border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors shadow-sm z-10"><X size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}