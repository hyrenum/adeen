import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useApp } from "@/Middle/Context/App";
import type { PrayerTimesData, HijriDate, LocationData, PrayerSettings } from "@/Top/Component/Aid/Prayer/Types";

export function usePrayerTimes() {
  const {
    prayerCalculationMethod,
    prayerSchool,
    prayerLatitudeMethod,
    prayerTimeFormat,
    prayerAutoLocation,
    prayerSavedLocation,
    setPrayerSavedLocation,
  } = useApp();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [timings, setTimings] = useState<PrayerTimesData | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState("");

  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const initialFetchDoneRef = useRef(false);

  // Memoize settings
  const settings = useMemo<PrayerSettings>(() => ({
    method: prayerCalculationMethod,
    school: prayerSchool,
    latitudeAdjustmentMethod: prayerLatitudeMethod,
    timeFormat: prayerTimeFormat,
  }), [prayerCalculationMethod, prayerSchool, prayerLatitudeMethod, prayerTimeFormat]);

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      setDateStr(`${dd}-${mm}-${yyyy}`);

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        method: String(settings.method),
        school: String(settings.school),
        latitudeAdjustmentMethod: String(settings.latitudeAdjustmentMethod),
      });

      const res = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?${params}`);
      const data = await res.json();

      if (data.code === 200) {
        const strip = (v: string) => v.replace(/\s*\(.*\)/, "");
        const ti = data.data.timings;
        setTimings({
          Fajr: strip(ti.Fajr),
          Sunrise: strip(ti.Sunrise),
          Dhuhr: strip(ti.Dhuhr),
          Asr: strip(ti.Asr),
          Maghrib: strip(ti.Maghrib),
          Isha: strip(ti.Isha),
          Imsak: strip(ti.Imsak),
          Midnight: strip(ti.Midnight),
        });

        if (data.data.date?.hijri) {
          setHijri(data.data.date.hijri);
        }

        if (data.data.meta?.timezone) {
          const city = data.data.meta.timezone.split("/").pop()?.replace(/_/g, " ") || "";
          setLocation((prev) => (prev ? { ...prev, city } : null));
        }
        setError(null);
      } else {
        setError("Failed to fetch prayer times");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch prayer times. Please check your connection.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [settings]);

  // Separate function to get location and then fetch
  const requestLocation = useCallback(() => {
    if (isFetchingRef.current) return;

    // Use saved location if auto-location is disabled and saved location exists
    if (!prayerAutoLocation && prayerSavedLocation) {
      const loc = { 
        latitude: prayerSavedLocation.lat, 
        longitude: prayerSavedLocation.lng,
        city: prayerSavedLocation.city,
        country: prayerSavedLocation.country
      };
      setLocation(loc);
      fetchPrayerTimes(loc.latitude, loc.longitude);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude 
        };
        setLocation(loc);
        fetchPrayerTimes(loc.latitude, loc.longitude);
        
        // Optionally save the location (but don't wait for it)
        if (prayerAutoLocation && !prayerSavedLocation) {
          fetch(`https://api.aladhan.com/v1/timings/now?latitude=${loc.latitude}&longitude=${loc.longitude}`)
            .then(r => r.json())
            .then(data => {
              if (data.data?.meta?.timezone) {
                const city = data.data.meta.timezone.split("/").pop()?.replace(/_/g, " ") || "";
                setPrayerSavedLocation({
                  city,
                  country: "",
                  lat: loc.latitude,
                  lng: loc.longitude
                });
              }
            })
            .catch(() => {});
        }
      },
      () => {
        // Fallback to IP
        fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .then((data) => {
            if (data.latitude && data.longitude) {
              const loc = { 
                latitude: data.latitude, 
                longitude: data.longitude, 
                city: data.city, 
                country: data.country_name 
              };
              setLocation(loc);
              fetchPrayerTimes(loc.latitude, loc.longitude);
              
              if (prayerAutoLocation && !prayerSavedLocation) {
                setPrayerSavedLocation({
                  city: data.city,
                  country: data.country_name,
                  lat: data.latitude,
                  lng: data.longitude
                });
              }
            } else {
              setError("Unable to determine your location. Please select a location in Settings.");
              setLoading(false);
            }
          })
          .catch(() => {
            setError("Unable to determine your location. Please select a location in Settings.");
            setLoading(false);
          });
      },
      { timeout: 5000 }
    );
  }, [fetchPrayerTimes, prayerAutoLocation, prayerSavedLocation, setPrayerSavedLocation]);

  const setManualLocation = useCallback((lat: number, lng: number, city: string, country: string) => {
    const loc = { latitude: lat, longitude: lng, city, country };
    setLocation(loc);
    setError(null);
    fetchPrayerTimes(lat, lng);
    
    if (!prayerAutoLocation) {
      setPrayerSavedLocation({ city, country, lat, lng });
    }
  }, [fetchPrayerTimes, prayerAutoLocation, setPrayerSavedLocation]);

  // One-time initial fetch
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures it runs once

  // Re-fetch when calculation settings change, but only if we have a location
  const prevSettingsRef = useRef(settings);
  useEffect(() => {
    if (location && (
      prevSettingsRef.current.method !== settings.method ||
      prevSettingsRef.current.school !== settings.school ||
      prevSettingsRef.current.latitudeAdjustmentMethod !== settings.latitudeAdjustmentMethod
    )) {
      prevSettingsRef.current = settings;
      fetchPrayerTimes(location.latitude, location.longitude);
    }
  }, [settings.method, settings.school, settings.latitudeAdjustmentMethod, location, fetchPrayerTimes]);

  const methodLabel = useMemo(() => {
    const methods: Record<number, string> = {
      0: "Shia Ithna-Ashari",
      1: "University of Islamic Sciences, Karachi",
      2: "Islamic Society of North America (ISNA)",
      3: "Muslim World League (MWL)",
      4: "Umm Al-Qura University, Makkah",
      5: "Egyptian General Authority of Survey",
    };
    return methods[settings.method] || "Unknown";
  }, [settings.method]);

  return {
    location,
    timings,
    hijri,
    loading,
    error,
    dateStr,
    settings,
    requestLocation,
    setManualLocation,
    methodLabel,
    isUsingSavedLocation: !prayerAutoLocation && !!prayerSavedLocation,
  };
}