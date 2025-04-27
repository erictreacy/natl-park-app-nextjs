"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Calendar, Users, ExternalLink, ImageOff, AlertCircle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import WeatherDisplay from "@/components/weather-display"

import type { Park, WeatherData } from "@/lib/types"

interface ParkHoverCardProps {
  park: Park
  children: React.ReactNode
  weather?: WeatherData
  isLoading?: boolean
  weatherError?: string
  onFetchWeather?: (park: Park) => void
}

export default function ParkHoverCard({ 
  park, 
  children, 
  weather, 
  isLoading, 
  weatherError, 
  onFetchWeather 
}: ParkHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [hasTriedFetchingWeather, setHasTriedFetchingWeather] = useState(false)

  // Reset state when park changes or component unmounts
  useEffect(() => {
    return () => {
      setIsOpen(false)
      setHasTriedFetchingWeather(false)
    }
  }, [park?.id])

  // Fetch weather data when hover card is opened
  useEffect(() => {
    if (isOpen && onFetchWeather && park && !hasTriedFetchingWeather) {
      onFetchWeather(park)
      setHasTriedFetchingWeather(true)
    }
  }, [isOpen, park, onFetchWeather, hasTriedFetchingWeather])

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <HoverCard openDelay={200} closeDelay={200} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-0 z-50 shadow-lg border border-gray-200">
        <div className="relative h-32 w-full">
          {imageError ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <ImageOff className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">Image not available</p>
              </div>
            </div>
          ) : (
            <Image
              src={park.image || `/placeholder.svg?height=300&width=500&query=${park.name} national park`}
              alt={park.name}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-3 text-white">
            <Badge variant="outline" className="bg-green-50/20 text-white border-white/30 mb-1">
              {park.type}
            </Badge>
            <h3 className="font-bold text-lg drop-shadow-md">{park.name}</h3>
            <p className="text-sm text-white/80 drop-shadow-md">{park.state}</p>
          </div>
        </div>

        <div className="p-3">
          <p className="text-sm mb-3 line-clamp-2">{park.description}</p>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>Est. {park.established}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span>{park.visitors.toLocaleString()} visitors/year</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-2 bg-slate-50 rounded-md animate-pulse">
              <p className="text-center text-xs text-muted-foreground">Loading weather...</p>
            </div>
          ) : weatherError ? (
            <div className="p-2 bg-red-50 rounded-md">
              <div className="flex items-center text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Error loading weather data</span>
              </div>
            </div>
          ) : weather ? (
            <WeatherDisplay weather={weather} />
          ) : (
            <div className="p-2 bg-slate-50 rounded-md">
              <p className="text-center text-xs text-muted-foreground">Weather data not available</p>
            </div>
          )}

          <div className="flex justify-between mt-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href={park.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs"
              >
                Visit Website
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs"
              >
                Directions
              </a>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
