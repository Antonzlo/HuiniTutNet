"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const Ctx = createContext({ query: "", setQuery: (_q: string) => {} });

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <Ctx.Provider value={{ query, setQuery: setQuery }}>{children}</Ctx.Provider>;
}

export function useSearch() {
  return useContext(Ctx);
}
