"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Users, ExternalLink, Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle } from "lucide-react"
import Image from "next/image"

export default function MapPopup({ park, weather, isLoading, weatherError }) {
  if (!park) return null

  return (
    <div className="park-popup-content">
      <div className="relative h-24 w-full">
        <Image
          src={park.image || `/placeholder.svg?height=300&width=500&query=${park.name} national park`}
          alt={park.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2 text-white">
          <Badge variant="outline" className="bg-green-50/20 text-white border-white/30 mb-1 text-xs">
            {park.type}
          </Badge>
          <h3 className="font-bold text-sm drop-shadow-md">{park.name}</h3>
          <p className="text-xs text-white/80 drop-shadow-md">{park.state}</p>
        </div>
      </div>

      <div className="p-2">
        <p className="text-xs mb-2 line-clamp-2">{park.description}</p>

        <div className="grid grid-cols-2 gap-1 text-xs mb-2">
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
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Error loading weather</span>
            </div>
          </div>
        ) : weather ? (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-1">
                  {getWeatherIcon(weather.condition)}
                  {weather.temperature}°F
                  {weather.isMockData && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded-full flex items-center">
                      <AlertTriangle className="h-2 w-2 mr-0.5" />
                      Sim
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{weather.description}</div>
              </div>
              {weather.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                  alt={weather.description}
                  className="w-10 h-10"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplets className="h-2 w-2" />
                <span>Humidity: {weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-2 w-2" />
                <span>Wind: {weather.windSpeed} mph</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between mt-2">
          <a
            href={park.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Visit Website
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-muted-foreground">Click for details</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to get weather icon
function getWeatherIcon(condition) {
  const code = condition?.toLowerCase() || ""

  if (code.includes("rain") || code.includes("drizzle") || code.includes("shower")) {
    return <CloudRain className="h-3 w-3 text-blue-500" />
  } else if (code.includes("cloud") || code.includes("overcast")) {
    return <Cloud className="h-3 w-3 text-gray-500" />
  } else {
    return <Sun className="h-3 w-3 text-yellow-500" />
  }
}
