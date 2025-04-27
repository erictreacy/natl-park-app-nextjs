"use client"

import Image from "next/image"
import { ExternalLink, Calendar, Users } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import WeatherDisplay from "@/components/weather-display"

export default function ParkSidebarCard({ park, weather, isLoading, weatherError, isSelected, onClick }) {
  return (
    <Card
      className={`w-full overflow-hidden cursor-pointer hover:shadow-md transition-shadow mb-3 ${
        isSelected ? "border-green-500 border-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative h-32 w-full">
        <Image
          src={park.image || `/placeholder.svg?height=300&width=500&query=national park landscape ${park.name}`}
          alt={park.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 text-white">
          <Badge variant="outline" className="bg-green-50/20 text-white border-white/30 mb-1">
            {park.type}
          </Badge>
          <h3 className="font-bold text-lg drop-shadow-md">{park.name}</h3>
          <p className="text-sm text-white/80 drop-shadow-md">{park.state}</p>
        </div>
      </div>

      <CardContent className="p-3">
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

        {weather && <WeatherDisplay weather={weather} isLoading={isLoading} weatherError={weatherError} />}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <a href={park.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            Visit Website
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>

        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            Directions
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
