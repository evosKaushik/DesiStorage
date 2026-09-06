"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type SearchCtx = { query: string; setQuery: (v: string) => void };
const SearchCtx = createContext<SearchCtx | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <SearchCtx.Provider value={{ query, setQuery }}>
      {children}
    </SearchCtx.Provider>
  );
}

export function useDashboardSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx)
    throw new Error("useDashboardSearch must be used inside DashboardShell");
  return ctx;
}