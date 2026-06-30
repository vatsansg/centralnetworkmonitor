import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { venuesApi, favouritesApi, authApi } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [venues, setVenues] = useState([]);
  const [activeVenueId, setActiveVenueId] = useState(null);
  const [venueData, setVenueData] = useState({});
  const [favourite, setFavouriteState] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const venueDataRef = useRef(venueData);
  venueDataRef.current = venueData;

  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
    if (userData.theme) setTheme(userData.theme);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setVenues([]);
    setVenueData({});
    setActiveVenueId(null);
    setFavouriteState(null);
    window.location.href = '/login';
  }, []);

  const loadVenues = useCallback(async ({ bust = false } = {}) => {
    setIsLoading(true);
    try {
      const fn = bust ? venuesApi.refresh : venuesApi.list;
      const [venueRes, favRes] = await Promise.all([fn(), favouritesApi.get()]);
      const list = venueRes.data;
      setVenues(list);

      let fav = favRes.data.venue_id;
      if (fav && !list.find(v => v.venue_id === fav)) fav = null;
      setFavouriteState(fav);

      const sorted = fav
        ? [list.find(v => v.venue_id === fav), ...list.filter(v => v.venue_id !== fav)]
        : list;

      if (sorted.length > 0) {
        setActiveVenueId(prev => prev && list.find(v => v.venue_id === prev) ? prev : sorted[0].venue_id);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      if (err.response?.status !== 401) console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveVenue = useCallback(async (venueId) => {
    setActiveVenueId(venueId);
    if (venueDataRef.current[venueId]) return;
    try {
      const res = await venuesApi.get(venueId);
      setVenueData(prev => ({ ...prev, [venueId]: res.data }));
    } catch {}
  }, []);

  const refreshActiveVenue = useCallback(async (venueId) => {
    if (!venueId) return;
    try {
      const res = await venuesApi.get(venueId);
      setVenueData(prev => ({ ...prev, [venueId]: res.data }));
      setLastRefreshed(new Date());
    } catch {}
  }, []);

  const setFavourite = useCallback(async (venueId) => {
    if (venueId) {
      await favouritesApi.set(venueId);
      setFavouriteState(venueId);
    } else {
      await favouritesApi.clear();
      setFavouriteState(null);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { await authApi.updatePreferences({ theme: next }); } catch {}
    setUser(prev => prev ? { ...prev, theme: next } : prev);
    localStorage.setItem('user', JSON.stringify({ ...user, theme: next }));
  }, [theme, user]);

  return (
    <AppContext.Provider value={{
      user, token, venues, activeVenueId, venueData, favourite,
      lastRefreshed, isLoading, theme,
      login, logout, loadVenues, setActiveVenue, refreshActiveVenue,
      setFavourite, toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
