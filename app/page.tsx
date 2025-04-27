"use client"

import { useState, useEffect, useRef } from "react"
import type { Park, WeatherData, Coordinates } from "@/lib/types"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  MapIcon,
  ImageIcon,
  Locate,
  AlertTriangle,
  MapPin,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nationalParks } from "@/lib/park-data"
import Image from "next/image"
import ParkHoverCard from "@/components/park-hover-card"
import ParkSidebarCard from "@/components/park-sidebar-card"
import { updateParkWithImages } from "@/lib/park-image-service"
import { useGeolocation } from "@/hooks/use-geolocation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Client-side cache for weather data to reduce API calls
const weatherCache = new Map()
const WEATHER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

// Dynamically import the MapComponent with no SSR to avoid mapbox issues
const DynamicMapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto"></div>
        <p className="mt-2 text-green-800">Loading map...</p>
      </div>
    </div>
  ),
})

// Popular locations for manual selection
const popularLocations = [
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "Chicago", lat: 41.8781, lon: -87.6298 },
  { name: "Denver", lat: 39.7392, lon: -104.9903 },
  { name: "Seattle", lat: 47.6062, lon: -122.3321 },
  { name: "Miami", lat: 25.7617, lon: -80.1918 },
  { name: "Yellowstone", lat: 44.428, lon: -110.5885 },
  { name: "Grand Canyon", lat: 36.0544, lon: -112.2401 },
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredParks, setFilteredParks] = useState<Park[]>(nationalParks)
  const [parksWithImages, setParksWithImages] = useState<Park[]>(nationalParks)
  const [selectedPark, setSelectedPark] = useState<Park | null>(null)
  const [hoveredPark, setHoveredPark] = useState<Park | null>(null)

  // Load park images when component mounts
  useEffect(() => {
    const loadParkImages = async () => {
      setIsLoadingImages(true)
      try {
        const updatedParks = await Promise.all(
          nationalParks.map(async (park) => {
            const updatedPark = await updateParkWithImages(park)
            setLoadedImageCount(prev => prev + 1)
            return updatedPark
          })
        )
        setParksWithImages(updatedParks)
      } catch (error) {
        console.error('Error loading park images:', error)
      } finally {
        setIsLoadingImages(false)
      }
    }

    loadParkImages()
  }, [])
  const [weatherData, setWeatherData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [weatherError, setWeatherError] = useState<Record<string, string>>({})
  const [weatherApiKeyError, setWeatherApiKeyError] = useState(false)

  // Function to fetch weather data for a park
  const fetchWeatherData = async (parkId: number, lat: number, lon: number) => {
    if (isLoading[parkId]) return
    
    setIsLoading(prev => ({ ...prev, [parkId]: true }))
    setWeatherError(prev => ({ ...prev, [parkId]: '' }))

    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }
      const data = await response.json()
      setWeatherData(prev => ({ ...prev, [parkId]: data }))
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeatherError(prev => ({ ...prev, [parkId]: error.message }))
      if (error.message.includes('API key')) {
        setWeatherApiKeyError(true)
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [parkId]: false }))
    }
  }
  const [activeView, setActiveView] = useState("map")
  const [mapCenter, setMapCenter] = useState({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3.5,
  })
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [loadedImageCount, setLoadedImageCount] = useState(0)
  const [usingMockWeather, setUsingMockWeather] = useState(false)
  const [nearbyParks, setNearbyParks] = useState([])
  const [mapError, setMapError] = useState(null)
  const [showLocationDialog, setShowLocationDialog] = useState(false)

  // Close location dialog when coordinates are obtained
  useEffect(() => {
    if (latitude && longitude) {
      setShowLocationDialog(false)
    }
  }, [latitude, longitude])

  // Refs for hover card positioning
  const hoverCardRef = useRef(null)
  const [hoverCardPosition, setHoverCardPosition] = useState({ top: 0, left: 0 })
  const [showMapHoverCard, setShowMapHoverCard] = useState(false)

  // Clean up hover card when component unmounts or view changes
  useEffect(() => {
    return () => {
      setShowMapHoverCard(false)
      setHoveredPark(null)
    }
  }, [activeView])

  // Fetch weather data when a park is selected
  useEffect(() => {
    if (selectedPark) {
      fetchWeatherData(selectedPark.id, selectedPark.latitude, selectedPark.longitude)
    }
  }, [selectedPark])

  // Get user location
  const {
    latitude,
    longitude,
    accuracy,
    loading: locationLoading,
    error: locationError,
    isSupported: geolocationSupported,
    debugInfo,
    requestLocation,
    setManualLocation,
    forceLocationRequest,
  } = useGeolocation()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const parksPerPage = 5 // Reduced to show fewer parks per page since cards are larger now

  // Fetch real images for parks
  useEffect(() => {
    async function fetchAllParkImages() {
      setIsLoadingImages(true)
      setLoadedImageCount(0)

      try {
        // Process parks in smaller batches with longer delays to avoid rate limiting
        const batchSize = 2 // Reduced batch size
        let updatedParks = [...nationalParks]
        let loadedCount = 0

        for (let i = 0; i < updatedParks.length; i += batchSize) {
          const batch = updatedParks.slice(i, i + batchSize)
          const updatedBatch = await Promise.all(batch.map((park) => updateParkWithImages(park)))

          updatedParks = [...updatedParks.slice(0, i), ...updatedBatch, ...updatedParks.slice(i + batchSize)]
          loadedCount += batch.length
          setLoadedImageCount(loadedCount)

          // Update state incrementally to show progress
          setParksWithImages(updatedParks)

          // Add a much longer delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      } catch (error) {
        console.error("Error fetching park images:", error)
        // Even if there's an error, still update the state with what we have
        setParksWithImages(nationalParks)
      } finally {
        setIsLoadingImages(false)
      }
    }

    fetchAllParkImages()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = parksWithImages.filter(
        (park) =>
          park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          park.state.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredParks(filtered)
      setCurrentPage(1) // Reset to first page on new search
    } else {
      setFilteredParks(parksWithImages)
    }
  }, [searchQuery, parksWithImages])

  // Find nearby parks when user location is available
  useEffect(() => {
    if (latitude && longitude) {
      // Calculate distance to each park
      const parksWithDistance = nationalParks.map((park) => {
        const distance = calculateDistance(latitude, longitude, park.latitude, park.longitude)
        return { ...park, distance }
      })

      // Sort by distance and take the closest 10
      const closest = [...parksWithDistance].sort((a, b) => a.distance - b.distance).slice(0, 10)
      setNearbyParks(closest)
    }
  }, [latitude, longitude])

  // Calculate distance between two points using Haversine formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8 // Earth's radius in miles
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function toRad(value) {
    return (value * Math.PI) / 180
  }

  const fetchWeather = async (park) => {
    // Skip if we already have data for this park
    if (weatherData[park.id]) return

    // Check client-side cache first
    const cacheKey = `${park.latitude},${park.longitude}`
    const cachedData = weatherCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < WEATHER_CACHE_TTL) {
      console.log(`Using cached weather data for ${park.name}`)
      setWeatherData((prev) => ({
        ...prev,
        [park.id]: cachedData.data,
      }))
      return
    }

    // Set loading state for this specific park
    setIsLoading((prev) => ({ ...prev, [park.id]: true }))
    setWeatherError((prev) => ({ ...prev, [park.id]: null }))

    try {
      const response = await fetch(`/api/weather?lat=${park.latitude}&lon=${park.longitude}`)

      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Handle error with mock data
      if (data.error) {
        console.warn(`Weather API error for ${park.name}:`, data.error)

        // Check if it's an API key issue
        if (data.error.includes("API key")) {
          setWeatherApiKeyError(true)
        }

        // Check if we're using rate-limited mock data
        if (data.error.includes("rate limit")) {
          setUsingMockWeather(true)
        }

        // If we have mock data, use it
        if (data.useMockData && data.mockData) {
          const mockData = { ...data.mockData, isMockData: true }
          setWeatherData((prev) => ({
            ...prev,
            [park.id]: mockData,
          }))

          // Cache the mock data too
          weatherCache.set(cacheKey, {
            data: mockData,
            timestamp: Date.now(),
          })

          return
        }

        throw new Error(data.error)
      }

      // Store the weather data in state
      setWeatherData((prev) => ({
        ...prev,
        [park.id]: data,
      }))

      // Cache the data
      weatherCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error(`Error fetching weather for ${park.name}:`, error)
      setWeatherError((prev) => ({
        ...prev,
        [park.id]: error.message || "Failed to load weather data.",
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, [park.id]: false }))
    }
  }

  // Handle park hover from map
  const handleParkHover = (park) => {
    setHoveredPark(park)
    setShowMapHoverCard(true)
    fetchWeather(park)
  }

  // Handle park leave from map
  const handleParkLeave = () => {
    setShowMapHoverCard(false)
  }

  // Update the handleParkClick function to ensure smooth transitions when selecting parks
  const handleParkClick = (park) => {
    setSelectedPark(park)
    fetchWeather(park)

    // Center the map on the selected park with a smooth animation
    setMapCenter({
      longitude: park.longitude,
      latitude: park.latitude,
      zoom: 8,
    })
  }

  // Update the handleSearch function to improve the search experience
  const handleSearch = (e) => {
    e.preventDefault()
    if (filteredParks.length > 0) {
      // Center the map on the first result
      const firstPark = filteredParks[0]
      setSelectedPark(firstPark)
      fetchWeather(firstPark)

      setMapCenter({
        longitude: firstPark.longitude,
        latitude: firstPark.latitude,
        zoom: 6,
      })
    }
  }

  // Handle user location button click
  const handleLocateMe = () => {
    console.log("Requesting location...")
    requestLocation()
  }

  // Force location request regardless of environment detection
  const handleForceLocateMe = () => {
    console.log("Forcing location request...")
    forceLocationRequest()
  }

  // Handle manual location selection
  const handleSelectLocation = (lat, lon, name) => {
    console.log(`Selected location: ${name} (${lat}, ${lon})`)
    setManualLocation(lat, lon)
    setShowLocationDialog(false)

    // Update map center
    setMapCenter({
      latitude: lat,
      longitude: lon,
      zoom: 9,
    })
  }

  // Update map when user location is available
  useEffect(() => {
    if (latitude && longitude) {
      console.log("User location updated:", latitude, longitude)
      setMapCenter({
        latitude,
        longitude,
        zoom: 9,
      })

      // Find nearby parks when location is available
      const parksWithDistance = parksWithImages.map((park) => {
        const distance = calculateDistance(latitude, longitude, park.latitude, park.longitude)
        return { ...park, distance }
      })

      // Sort by distance and take the closest 10
      const closest = [...parksWithDistance].sort((a, b) => a.distance - b.distance).slice(0, 10)
      setNearbyParks(closest)
    }
  }, [latitude, longitude, parksWithImages])

  // Calculate pagination
  const indexOfLastPark = currentPage * parksPerPage
  const indexOfFirstPark = indexOfLastPark - parksPerPage
  const currentParks = filteredParks.slice(indexOfFirstPark, indexOfLastPark)
  const totalPages = Math.ceil(filteredParks.length / parksPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle map errors
  const handleMapError = (error) => {
    console.error("Map error:", error)
    setMapError(error)
  }

  // Fetch weather for visible parks
  useEffect(() => {
    // Fetch weather for currently visible parks
    currentParks.forEach((park) => {
      fetchWeather(park)
    })
  }, [currentParks])

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-green-800 text-white p-4">
        <h1 className="text-2xl font-bold">National Parks Explorer</h1>
        <p className="text-sm opacity-80">Discover America's natural treasures</p>
      </div>

      {(weatherApiKeyError || usingMockWeather) && (
        <Alert variant="warning" className="m-4 bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {usingMockWeather
              ? "Using simulated weather data due to API rate limits. Weather data is being simulated based on location and season."
              : "Using simulated weather data. To see real weather conditions, please add a valid OpenWeather API key to your environment variables."}
          </AlertDescription>
        </Alert>
      )}

      {mapError && (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading map: {mapError}. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 p-4 bg-stone-100 overflow-y-auto">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              placeholder="Search parks or states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* User location button */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                      onClick={handleLocateMe}
                      disabled={locationLoading}
                    >
                      <Locate className="h-4 w-4" />
                      {locationLoading
                        ? "Getting location..."
                        : geolocationSupported
                          ? "Find parks near me"
                          : "Select location"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {geolocationSupported
                      ? "Use your current location to find nearby parks"
                      : "Select a location to find nearby parks"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="secondary"
                size="icon"
                onClick={handleForceLocateMe}
                disabled={locationLoading}
                title="Force location request"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>

            {locationError && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{locationError}</span>
                <Button
                  variant="link"
                  className="text-sm p-0 h-auto text-blue-600"
                  onClick={() => setShowLocationDialog(true)}
                >
                  Select location manually
                </Button>
              </div>
            )}

            {/* Debug information */}
            <details className="mt-2 text-xs text-gray-500 border-t pt-2">
              <summary className="cursor-pointer">Geolocation Debug Info</summary>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                <p>Supported: {geolocationSupported ? "Yes" : "No"}</p>
                <p>Loading: {locationLoading ? "Yes" : "No"}</p>
                <p>Error: {locationError || "None"}</p>
                <p>Coordinates: {latitude && longitude ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "None"}</p>
                <p>Accuracy: {accuracy ? `${accuracy.toFixed(1)}m` : "Unknown"}</p>
                {debugInfo && <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>}
              </div>
            </details>
          </div>

          {/* Nearby parks section */}
          {nearbyParks.length > 0 && (
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-2">Parks Near You</h2>
              <div className="space-y-2">
                {nearbyParks.slice(0, 3).map((park) => (
                  <Card
                    key={`nearby-${park.id}`}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleParkClick(park)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{park.name}</h3>
                          <p className="text-xs text-muted-foreground">{Math.round(park.distance)} miles away</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          Nearby
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="border-t my-4"></div>
            </div>
          )}

          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">All Parks ({filteredParks.length})</h2>
            {filteredParks.length > parksPerPage && (
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isLoadingImages ? (
            <div className="flex flex-col items-center py-8">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mr-2"></div>
                <span className="text-green-800">Loading park data...</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Loaded {loadedImageCount} of {nationalParks.length} parks
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-800 h-2.5 rounded-full"
                  style={{ width: `${(loadedImageCount / nationalParks.length) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : filteredParks.length === 0 ? (
            <p className="text-muted-foreground">No parks found. Try a different search.</p>
          ) : (
            currentParks.map((park) => (
              <ParkSidebarCard
                key={park.id}
                park={park}
                weather={weatherData[park.id]}
                isLoading={isLoading[park.id]}
                weatherError={weatherError[park.id]}
                isSelected={selectedPark?.id === park.id}
                onClick={() => handleParkClick(park)}
              />
            ))
          )}

          {filteredParks.length > parksPerPage && (
            <div className="flex justify-center mt-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 relative h-full">
          <Tabs value={activeView} className="absolute top-4 right-4 z-10">
            <TabsList>
              <TabsTrigger value="map" onClick={() => setActiveView("map")}>
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </TabsTrigger>
              <TabsTrigger value="photos" onClick={() => setActiveView("photos")}>
                <ImageIcon className="h-4 w-4 mr-1" />
                Photos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeView === "map" && (
            <div className="h-full w-full relative">
              <DynamicMapComponent
                center={mapCenter}
                parks={filteredParks}
                selectedPark={selectedPark}
                onParkClick={handleParkClick}
                onParkHover={handleParkHover}
                onParkLeave={handleParkLeave}
                userLocation={latitude && longitude ? { latitude, longitude, accuracy } : null}
                onError={handleMapError}
                weatherData={weatherData}
                isLoadingWeather={isLoading}
                weatherError={weatherError}
              />

              {/* Map hover card */}
              {showMapHoverCard && hoveredPark && (
                <div className="absolute top-4 left-4 z-20 map-hover-card">
                  <ParkHoverCard
                    park={hoveredPark}
                    weather={weatherData[hoveredPark.id]}
                    isLoading={isLoading[hoveredPark.id]}
                    weatherError={weatherError[hoveredPark.id]}
                    onFetchWeather={fetchWeather}
                  />
                </div>
              )}
            </div>
          )}

          {activeView === "photos" && (
            <div className="h-full w-full p-4 overflow-y-auto">
              {isLoadingImages ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-800 mr-3"></div>
                    <span className="text-xl text-green-800">Loading park images...</span>
                  </div>
                  <div className="mt-4 text-muted-foreground">
                    Loaded {loadedImageCount} of {nationalParks.length} parks
                  </div>
                  <div className="w-1/2 bg-gray-200 rounded-full h-2.5 mt-4">
                    <div
                      className="bg-green-800 h-2.5 rounded-full"
                      style={{ width: `${(loadedImageCount / nationalParks.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredParks.map((park) => (
                    <div
                      key={park.id}
                      className="relative h-60 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => handleParkClick(park)}
                    >
                      <Image
                        src={park.image || `/placeholder.svg?height=300&width=500&query=${park.name} national park`}
                        alt={park.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-3 text-white">
                        <h3 className="font-bold text-lg drop-shadow-md">{park.name}</h3>
                        <p className="text-sm text-white/80 drop-shadow-md">{park.state}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location selection dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select your location</DialogTitle>
            <DialogDescription>
              {geolocationSupported
                ? "We couldn't access your location. Please select a location to find nearby parks."
                : "Geolocation is not available in this environment. Please select a location to find nearby parks."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {popularLocations.map((location) => (
              <Button
                key={location.name}
                variant="outline"
                className="flex items-center justify-start gap-2"
                onClick={() => handleSelectLocation(location.lat, location.lon, location.name)}
              >
                <MapPin className="h-4 w-4" />
                {location.name}
              </Button>
            ))}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="secondary" onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                // Default to center of US if user cancels
                handleSelectLocation(39.8283, -98.5795, "United States")
                setShowLocationDialog(false)
              }}
            >
              Show All Parks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
