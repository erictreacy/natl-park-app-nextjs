"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"
import { createRoot } from "react-dom/client"
import MapPopup from "./map-popup"

export default function MapComponent({
  center,
  parks,
  selectedPark,
  onParkClick,
  userLocation,
  onError,
  onParkHover,
  onParkLeave,
  weatherData,
  isLoadingWeather,
  weatherError,
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const popupRef = useRef(null)
  const popupRootRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const resizeListener = useRef(null)
  const [hoveredPark, setHoveredPark] = useState(null)
  const [popupCoordinates, setPopupCoordinates] = useState(null)

  // Cleanup function for React roots
  const cleanupPopupRoot = () => {
    if (popupRootRef.current) {
      popupRootRef.current.unmount()
      popupRootRef.current = null
    }
  }

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return // Initialize map only once

    const initializeMap = async () => {
      try {
        // Dynamically import mapboxgl to avoid SSR issues
        const mapboxgl = (await import("mapbox-gl")).default
        await import("mapbox-gl/dist/mapbox-gl.css")

        if (!mapContainer.current) return

        // Get Mapbox token
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        if (!mapboxToken) {
          console.error("Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.")
          setMapError("Mapbox token is missing")
          return
        }

        // Set the access token
        mapboxgl.accessToken = mapboxToken

        // Create the map instance
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/outdoors-v12",
          center: [center.longitude, center.latitude],
          zoom: center.zoom,
        })

        // Add error handler
        map.current.on("error", (e) => {
          console.error("Mapbox error:", e)
          setMapError(`Mapbox error: ${e.error?.message || "Unknown error"}`)
          if (onError) onError(`Mapbox error: ${e.error?.message || "Unknown error"}`)
        })

        map.current.on("load", () => {
          setMapLoaded(true)
          console.log("Mapbox map loaded successfully")

          // Create a safe resize handler that checks if map exists
          const handleResize = () => {
            if (map.current) {
              map.current.resize()
            }
          }

          // Store the handler reference for cleanup
          resizeListener.current = handleResize

          // Ensure the map resizes correctly when container changes
          window.addEventListener("resize", handleResize)

          // Add clustering for better performance with many parks
          map.current.addSource("parks", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: parks.map((park) => ({
                type: "Feature",
                properties: {
                  id: park.id,
                  name: park.name,
                  type: park.type,
                  state: park.state,
                  isSelected: selectedPark?.id === park.id,
                },
                geometry: {
                  type: "Point",
                  coordinates: [park.longitude, park.latitude],
                },
              })),
            },
            cluster: true,
            clusterMaxZoom: 12, // Max zoom to cluster points
            clusterRadius: 50, // Radius of each cluster when clustering points
          })

          // Add cluster circles
          map.current.addLayer({
            id: "clusters",
            type: "circle",
            source: "parks",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": ["step", ["get", "point_count"], "#51bbd6", 10, "#f1f075", 30, "#f28cb1"],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20, // base radius
                10,
                25, // 10+ points: radius 25
                30,
                30, // 30+ points: radius 30
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          })

          // Add cluster count text
          map.current.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "parks",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
          })

          // Add individual park markers with improved styling
          map.current.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "parks",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": [
                "case",
                ["==", ["get", "isSelected"], true],
                "#dc2626", // Red for selected park
                "#15803d", // Green for unselected parks
              ],
              "circle-radius": [
                "case",
                ["==", ["get", "isSelected"], true],
                10, // Larger radius for selected park
                8, // Normal radius for unselected parks
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          })

          // Add park name labels that appear on hover
          map.current.addLayer({
            id: "park-labels",
            type: "symbol",
            source: "parks",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
              "text-offset": [0, 1.5],
              "text-variable-anchor": ["top", "bottom", "left", "right"],
              "text-radial-offset": 0.5,
              "text-optional": true,
              "text-allow-overlap": false,
            },
            paint: {
              "text-color": "#333",
              "text-halo-color": "#fff",
              "text-halo-width": 1,
            },
          })

          // Create a popup but don't add it to the map yet
          const initializePopup = async () => {
            const mapboxgl = (await import("mapbox-gl")).default
            const Popup = mapboxgl.Popup
            popupRef.current = new Popup({
              closeButton: false,
              closeOnClick: false,
              maxWidth: "320px",
              offset: 15,
            })
          }

          initializePopup()
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError(`Failed to initialize map: ${error.message}`)
        if (onError) onError(`Failed to initialize map: ${error.message}`)
      }
    }

    initializeMap().catch(console.error)

    // Cleanup function
    return () => {
      // Remove event listener if it exists
      if (resizeListener.current) {
        window.removeEventListener("resize", resizeListener.current)
        resizeListener.current = null
      }

      // Clean up any popups
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      cleanupPopupRoot()

      // Remove the map if it exists
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update map center when center prop changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      try {
        map.current.flyTo({
          center: [center.longitude, center.latitude],
          zoom: center.zoom,
          essential: true,
        })
      } catch (error) {
        console.error("Error updating map center:", error)
      }
    }
  }, [center, mapLoaded])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      // Add click handler for clusters to zoom in
      const handleClusterClick = (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        })

        if (!features.length) return

        const clusterId = features[0].properties.cluster_id
        map.current.getSource("parks").getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return

          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          })
        })
      }

      // Add click handler for individual park points
      const handleParkClick = (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        })
        if (!features.length) return

        const clickedPoint = features[0]
        const parkId = clickedPoint.properties.id
        const clickedPark = parks.find((park) => park.id === Number.parseInt(parkId))

        if (clickedPark) {
          onParkClick(clickedPark)
        }
      }

      // Add hover handler for park points
      const handleParkMouseEnter = (e) => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer"

          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ["unclustered-point"],
          })

          if (features.length > 0) {
            const hoveredFeature = features[0]
            const parkId = hoveredFeature.properties.id
            const park = parks.find((p) => p.id === Number.parseInt(parkId))

            if (park) {
              setHoveredPark(park)
              setPopupCoordinates([park.longitude, park.latitude])

              // Call the onParkHover callback to show the hover card
              if (onParkHover) {
                onParkHover(park)
              }
            }
          }
        }
      }

      const handleParkMouseLeave = () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = ""
          setHoveredPark(null)
          setPopupCoordinates(null)

          if (popupRef.current) {
            popupRef.current.remove()
          }
          cleanupPopupRoot()

          // Call the onParkLeave callback to hide the hover card
          if (onParkLeave) {
            onParkLeave()
          }
        }
      }

      // Add cursor style handlers
      const handleClusterMouseEnter = () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer"
      }

      const handleClusterMouseLeave = () => {
        if (map.current) map.current.getCanvas().style.cursor = ""
      }

      // Add event listeners
      map.current.on("click", "clusters", handleClusterClick)
      map.current.on("click", "unclustered-point", handleParkClick)
      map.current.on("mouseenter", "clusters", handleClusterMouseEnter)
      map.current.on("mouseleave", "clusters", handleClusterMouseLeave)
      map.current.on("mouseenter", "unclustered-point", handleParkMouseEnter)
      map.current.on("mouseleave", "unclustered-point", handleParkMouseLeave)

      // Cleanup function to remove event listeners
      return () => {
        if (map.current) {
          map.current.off("click", "clusters", handleClusterClick)
          map.current.off("click", "unclustered-point", handleParkClick)
          map.current.off("mouseenter", "clusters", handleClusterMouseEnter)
          map.current.off("mouseleave", "clusters", handleClusterMouseLeave)
          map.current.off("mouseenter", "unclustered-point", handleParkMouseEnter)
          map.current.off("mouseleave", "unclustered-point", handleParkMouseLeave)
        }
      }
    } catch (error) {
      console.error("Error setting up map event handlers:", error)
    }
  }, [mapLoaded, parks, onParkClick, onParkHover, onParkLeave])

  // Handle popup display when hoveredPark changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !popupRef.current) return

    if (hoveredPark && popupCoordinates) {
      try {
        // Create a div for the popup content
        const popupNode = document.createElement("div")
        popupNode.className = "park-popup-content"

        // Get weather data for this park
        const parkWeather = weatherData ? weatherData[hoveredPark.id] : null
        const isLoadingParkWeather = isLoadingWeather ? isLoadingWeather[hoveredPark.id] : false
        const parkWeatherError = weatherError ? weatherError[hoveredPark.id] : null

        // Use ReactDOM.createRoot for React 18
        const root = createRoot(popupNode)
        root.render(
          <MapPopup
            park={hoveredPark}
            weather={parkWeather}
            isLoading={isLoadingParkWeather}
            weatherError={parkWeatherError}
          />,
        )

        // Set the popup content and add it to the map
        popupRef.current.setLngLat(popupCoordinates).setDOMContent(popupNode).addTo(map.current)
      } catch (error) {
        console.error("Error rendering popup:", error)
      }
    } else if (popupRef.current) {
      // Remove the popup if no park is hovered
      popupRef.current.remove()
    }
  }, [hoveredPark, popupCoordinates, mapLoaded, weatherData, isLoadingWeather, weatherError])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      // Update the GeoJSON data to reflect the current selected park
      if (map.current.getSource("parks")) {
        map.current.getSource("parks").setData({
          type: "FeatureCollection",
          features: parks.map((park) => ({
            type: "Feature",
            properties: {
              id: park.id,
              name: park.name,
              type: park.type,
              state: park.state,
              isSelected: selectedPark?.id === park.id,
            },
            geometry: {
              type: "Point",
              coordinates: [park.longitude, park.latitude],
            },
          })),
        })

        // Update the paint properties to highlight the selected park
        map.current.setPaintProperty("unclustered-point", "circle-color", [
          "case",
          ["==", ["get", "isSelected"], true],
          "#dc2626", // Red for selected park
          "#15803d", // Green for unselected parks
        ])

        map.current.setPaintProperty("unclustered-point", "circle-radius", [
          "case",
          ["==", ["get", "isSelected"], true],
          10, // Larger radius for selected park
          8, // Normal radius for unselected parks
        ])
      }
    } catch (error) {
      console.error("Error updating park selection:", error)
    }
  }, [parks, selectedPark, mapLoaded])

  // Handle user location updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return

    const addUserMarker = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default

        // Remove existing marker if it exists
        if (userMarker.current) {
          userMarker.current.remove()
        }

        // Create a DOM element for the marker
        const el = document.createElement("div")
        el.className = "user-location-marker"
        el.style.width = "20px"
        el.style.height = "20px"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#4338ca" // Indigo color
        el.style.border = "3px solid white"
        el.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.1)"

        // Add a pulsing effect
        const pulse = document.createElement("div")
        pulse.className = "user-location-pulse"
        pulse.style.position = "absolute"
        pulse.style.width = "100%"
        pulse.style.height = "100%"
        pulse.style.borderRadius = "50%"
        pulse.style.backgroundColor = "rgba(67, 56, 202, 0.4)"
        pulse.style.animation = "pulse 2s infinite"
        el.appendChild(pulse)

        // Add the CSS for the pulse animation
        if (!document.getElementById("user-location-style")) {
          const style = document.createElement("style")
          style.id = "user-location-style"
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              70% { transform: scale(3); opacity: 0; }
              100% { transform: scale(1); opacity: 0; }
            }
          `
          document.head.appendChild(style)
        }

        // Create and add the marker
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map.current)

        // Add a popup with accuracy information
        if (userLocation.accuracy) {
          new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 25 })
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .setHTML(`<p>You are here (±${Math.round(userLocation.accuracy)}m)</p>`)
            .addTo(map.current)
        }
      } catch (error) {
        console.error("Error adding user location marker:", error)
      }
    }

    addUserMarker()
  }, [userLocation, mapLoaded])

  return (
    <div ref={mapContainer} className="w-full h-full absolute inset-0">
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto"></div>
            <p className="mt-2 text-green-800">Loading map...</p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-md p-4">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Map Error</h3>
            <p className="mt-2 text-gray-600">{mapError}</p>
            <p className="mt-4 text-sm text-gray-500">
              Please make sure you have added the NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
