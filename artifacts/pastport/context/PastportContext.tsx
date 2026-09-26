import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mockSavedSiteIds, mockVisitedSiteIds } from '@/data/pastport';
import type { PeopleExperience } from '@/data/peoplesExperiences';

type PastportContextValue = {
  savedSites: string[];
  visitedSites: string[];
  selectedYear: number;
  sharedExperiences: PeopleExperience[];
  hydrated: boolean;
  toggleSaved: (siteId: string) => void;
  markVisited: (siteId: string) => void;
  setSelectedYear: (year: number) => void;
  addSharedExperience: (experience: PeopleExperience) => void;
};

const STORAGE_KEY = '@pastport/journey';
const SHARED_EXPERIENCES_KEY = '@pastport/shared-experiences';
const PastportContext = createContext<PastportContextValue | null>(null);

export function PastportProvider({ children }: { children: React.ReactNode }) {
  const [savedSites, setSavedSites] = useState<string[]>([]);
  const [visitedSites, setVisitedSites] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(1920);
  const [sharedExperiences, setSharedExperiences] = useState<PeopleExperience[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(SHARED_EXPERIENCES_KEY)])
      .then(([value, shared]) => {
        if (value) {
          const parsed = JSON.parse(value) as Partial<{
            savedSites: string[];
            visitedSites: string[];
            selectedYear: number;
          }>;
          const saved = parsed.savedSites ?? [];
          const visited = parsed.visitedSites ?? [];
          const emptyArchive = saved.length === 0 && visited.length === 0;
          setSavedSites(emptyArchive ? mockSavedSiteIds : saved);
          setVisitedSites(emptyArchive ? mockVisitedSiteIds : visited);
          setSelectedYear(parsed.selectedYear ?? 1920);
        } else {
          setSavedSites(mockSavedSiteIds);
          setVisitedSites(mockVisitedSiteIds);
        }
        if (shared) {
          const parsedShared = JSON.parse(shared) as PeopleExperience[];
          if (Array.isArray(parsedShared)) setSharedExperiences(parsedShared.filter(isSharedExperience));
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

  useEffect(() => {
    if (!didHydrate.current) return;
    AsyncStorage.setItem(SHARED_EXPERIENCES_KEY, JSON.stringify(sharedExperiences)).catch(() => undefined);
  }, [sharedExperiences]);

  const value = useMemo(
    () => ({
      savedSites,
      visitedSites,
      selectedYear,
      sharedExperiences,
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
      addSharedExperience: (experience: PeopleExperience) =>
        setSharedExperiences((current) => [experience, ...current.filter((item) => item.id !== experience.id)]),
    }),
    [hydrated, savedSites, selectedYear, sharedExperiences, visitedSites],
  );

  return <PastportContext.Provider value={value}>{children}</PastportContext.Provider>;
}

export function usePastport() {
  const context = useContext(PastportContext);
  if (!context) throw new Error('usePastport must be used within PastportProvider');
  return context;
}

function isSharedExperience(value: PeopleExperience): value is PeopleExperience {
  return Boolean(value && value.id && value.siteId && value.displayName && value.quote);
}