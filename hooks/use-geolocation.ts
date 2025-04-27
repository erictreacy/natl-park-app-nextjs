"use client"

import { useState, useEffect } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
  isSupported: boolean
  debugInfo: string | null
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    isSupported: true, // Default to true until we determine otherwise
    debugInfo: null,
  })

  // Check if geolocation is supported
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      try {
        // Check if geolocation is available in the browser
        const geolocationSupported = "geolocation" in navigator

        // Collect debug info
        const debugInfo = {
          userAgent: navigator.userAgent,
          geolocationInNavigator: geolocationSupported,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          referrer: document.referrer || "none",
        }

        console.log("Geolocation environment check:", debugInfo)

        setLocation((prev) => ({
          ...prev,
          isSupported: geolocationSupported,
          debugInfo: JSON.stringify(debugInfo),
        }))
      } catch (e) {
        console.error("Error checking geolocation support:", e)
        setLocation((prev) => ({
          ...prev,
          isSupported: false,
          debugInfo: `Error checking support: ${e.message}`,
        }))
      }
    }
  }, [])

  const requestLocation = (forceAttempt = false) => {
    // If geolocation isn't supported and we're not forcing an attempt, don't try
    if (!location.isSupported && !forceAttempt) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not available in this browser",
        loading: false,
      }))
      return false
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser",
      }))
      return false
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }))

    try {
      console.log("Attempting to get geolocation...")

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Geolocation success:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })

          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            loading: false,
            error: null,
            isSupported: true,
            debugInfo: location.debugInfo,
          })
        },
        (error) => {
          console.error("Geolocation error:", error)
          let errorMessage = "Unknown error"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services in your browser settings."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out"
              break
          }

          // Check for permissions policy error
          if (error.message && error.message.includes("permissions policy")) {
            errorMessage =
              "Geolocation is restricted by permissions policy. This may be due to iframe restrictions or security settings."
          }

          setLocation((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
      return true
    } catch (e) {
      console.error("Geolocation exception:", e)
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: `Unable to access location services: ${e.message}`,
      }))
      return false
    }
  }

  // Provide a method to manually set location
  const setManualLocation = (lat: number, lon: number) => {
    setLocation({
      latitude: lat,
      longitude: lon,
      accuracy: null,
      loading: false,
      error: null,
      isSupported: location.isSupported,
      debugInfo: location.debugInfo,
    })
  }

  return {
    ...location,
    requestLocation,
    setManualLocation,
    forceLocationRequest: () => requestLocation(true),
  }
}
