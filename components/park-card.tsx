import Image from "next/image"
import { ExternalLink, Calendar, Users, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import WeatherDisplay from "@/components/weather-display"

export default function ParkCard({ park, weather, isLoading, weatherError }) {
  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={park.image || `/placeholder.svg?height=300&width=500&query=national park landscape ${park.name}`}
          alt={park.name}
          fill
          className="object-cover"
          priority={true}
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

      <CardContent className="p-4">
        <p className="text-sm mb-4 line-clamp-3">{park.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Est. {park.established}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{park.visitors.toLocaleString()} visitors/year</span>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 p-2 bg-slate-50 rounded-md animate-pulse">
            <p className="text-center text-sm text-muted-foreground">Loading weather data...</p>
          </div>
        ) : weatherError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{weatherError}</AlertDescription>
          </Alert>
        ) : weather ? (
          <WeatherDisplay weather={weather} />
        ) : null}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
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
