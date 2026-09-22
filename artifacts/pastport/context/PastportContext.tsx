import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type PastportContextValue = {
  savedSites: string[];
  visitedSites: string[];
  selectedYear: number;
  hydrated: boolean;
  toggleSaved: (siteId: string) => void;
  markVisited: (siteId: string) => void;
  setSelectedYear: (year: number) => void;
};

const STORAGE_KEY = '@pastport/journey';
const PastportContext = createContext<PastportContextValue | null>(null);

export function PastportProvider({ children }: { children: React.ReactNode }) {
  const [savedSites, setSavedSites] = useState<string[]>([]);
  const [visitedSites, setVisitedSites] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(1920);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as Partial<{
            savedSites: string[];
            visitedSites: string[];
            selectedYear: number;
          }>;
          setSavedSites(parsed.savedSites ?? []);
          setVisitedSites(parsed.visitedSites ?? []);
          setSelectedYear(parsed.selectedYear ?? 1920);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        didHydrate.current = true;
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!didHydrate.current) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedSites, visitedSites, selectedYear }),
    ).catch(() => undefined);
  }, [savedSites, visitedSites, selectedYear]);

  const value = useMemo(
    () => ({
      savedSites,
      visitedSites,
      selectedYear,
      hydrated,
      toggleSaved: (siteId: string) =>
        setSavedSites((current) =>
          current.includes(siteId)
            ? current.filter((id) => id !== siteId)
            : [...current, siteId],
        ),
      markVisited: (siteId: string) =>
        setVisitedSites((current) =>
          current.includes(siteId) ? current : [...current, siteId],
        ),
      setSelectedYear,
    }),
    [hydrated, savedSites, selectedYear, visitedSites],
  );

  return <PastportContext.Provider value={value}>{children}</PastportContext.Provider>;
}

export function usePastport() {
  const context = useContext(PastportContext);
  if (!context) throw new Error('usePastport must be used within PastportProvider');
  return context;
}