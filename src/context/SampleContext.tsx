'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { SampleItem, SampleContextType } from '@/types';
import { MAX_FREE_SAMPLES, SAMPLE_STORAGE_KEY } from '@/data/samples';

// NOTE: This context intentionally does NOT import or call any analytics
// (`shopify-analytics`). A free sample is not a sale — it must never fire
// add-to-cart, checkout, or purchase events, nor contribute to revenue metrics.

const SampleContext = createContext<SampleContextType | undefined>(undefined);

export const useSamples = () => {
  const context = useContext(SampleContext);
  if (!context) {
    throw new Error('useSamples must be used within a SampleProvider');
  }
  return context;
};

interface SampleProviderProps {
  children: ReactNode;
}

export const SampleProvider = ({ children }: SampleProviderProps) => {
  const hasInitializedRef = useRef(false);
  const [samples, setSamples] = useState<SampleItem[]>([]);

  // Load the persisted basket once on mount. Sample state is local-only, matching
  // the priced cart, to avoid a runtime database dependency.
  useEffect(() => {
    const loadLocalSamples = (): SampleItem[] => {
      const saved = localStorage.getItem(SAMPLE_STORAGE_KEY);
      if (!saved) return [];

      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? (parsed as SampleItem[]) : [];
      } catch (error) {
        console.error('Error loading sample basket:', error);
        localStorage.removeItem(SAMPLE_STORAGE_KEY);
        return [];
      }
    };

    const localSamples = loadLocalSamples();
    queueMicrotask(() => {
      setSamples(localSamples);
      hasInitializedRef.current = true;
    });
  }, []);

  // Persist on change (skip the initial hydration write).
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    if (samples.length > 0) {
      localStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(samples));
    } else {
      localStorage.removeItem(SAMPLE_STORAGE_KEY);
    }
  }, [samples]);

  const addSample = useCallback((sample: SampleItem) => {
    setSamples((prev) => {
      // Dedupe by variant, and never exceed the cap.
      if (prev.some((s) => s.variantId === sample.variantId)) return prev;
      if (prev.length >= MAX_FREE_SAMPLES) return prev;
      return [...prev, sample];
    });
  }, []);

  const removeSample = useCallback((variantId: string) => {
    setSamples((prev) => prev.filter((s) => s.variantId !== variantId));
  }, []);

  const isInBasket = useCallback(
    (variantId: string) => samples.some((s) => s.variantId === variantId),
    [samples]
  );

  const clearSamples = useCallback(() => {
    setSamples([]);
    localStorage.removeItem(SAMPLE_STORAGE_KEY);
  }, []);

  return (
    <SampleContext.Provider
      value={{
        samples,
        count: samples.length,
        isFull: samples.length >= MAX_FREE_SAMPLES,
        addSample,
        removeSample,
        isInBasket,
        clearSamples,
      }}
    >
      {children}
    </SampleContext.Provider>
  );
};
