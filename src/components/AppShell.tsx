"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerPanelProvider } from "@/context/PlayerPanelContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { LibraryItemsProvider } from "@/context/LibraryItemsContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { SavedReleasesProvider } from "@/context/SavedReleasesContext";
import { SavedPlaylistsProvider } from "@/context/SavedPlaylistsContext";
import { WhatsNewProvider } from "@/context/WhatsNewContext";
import { SearchProvider, useSearch } from "@/context/SearchContext";
import { HomeFeedProvider } from "@/context/HomeFeedContext";
import { AppLayout } from "@/components/Layout/AppLayout";
import { useBlockContextMenu } from "@/hooks/useBlockContextMenu";
import { AuthGateSkeleton } from "@/components/Skeleton";

const AUTH_ROUTES = ["/login", "/register"];

function ShellInner({ children }: { children: ReactNode }) {
  const { setQuery } = useSearch();
  return <AppLayout onSearch={(q) => setQuery(q)}>{children}</AppLayout>;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isAuthPage) router.replace("/login");
    if (isAuthenticated && isAuthPage) router.replace("/");
  }, [loading, isAuthenticated, isAuthPage, router]);

  if (loading) return <AuthGateSkeleton />;

  if (!isAuthenticated && !isAuthPage) return null;
  if (isAuthenticated && isAuthPage) return null;

  if (isAuthPage) return <>{children}</>;

  return (
    <PlayerProvider>
      <PlayerPanelProvider>
      <FavoritesProvider>
        <SavedReleasesProvider>
        <SavedPlaylistsProvider>
        <WhatsNewProvider>
        <HomeFeedProvider>
        <LibraryProvider>
          <LibraryItemsProvider>
            <SearchProvider>
              <ShellInner>{children}</ShellInner>
            </SearchProvider>
          </LibraryItemsProvider>
        </LibraryProvider>
        </HomeFeedProvider>
        </WhatsNewProvider>
        </SavedPlaylistsProvider>
        </SavedReleasesProvider>
      </FavoritesProvider>
      </PlayerPanelProvider>
    </PlayerProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useBlockContextMenu();
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
