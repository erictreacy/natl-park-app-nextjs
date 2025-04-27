import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, Loader2 } from "lucide-react"

export default function WeatherDisplay({ weather, isLoading, weatherError }) {
  if (isLoading) {
    return (
      <div className="mt-2 p-2 bg-slate-50 rounded-md">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          <p className="text-sm text-muted-foreground">Loading weather...</p>
        </div>
      </div>
    )
  }

  if (weatherError) {
    return (
      <div className="mt-2 p-2 bg-red-50 rounded-md">
        <div className="flex items-center text-xs text-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span>Error loading weather data</span>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const getWeatherIcon = (condition) => {
    const code = condition?.toLowerCase() || ""

    if (code.includes("rain") || code.includes("drizzle") || code.includes("shower")) {
      return <CloudRain className="h-5 w-5 text-blue-500" />
    } else if (code.includes("cloud") || code.includes("overcast")) {
      return <Cloud className="h-5 w-5 text-gray-500" />
    } else {
      return <Sun className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold flex items-center gap-2">
            {getWeatherIcon(weather.condition)}
            {weather.temperature}°F
            {weather.isMockData && (
              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Simulated
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground capitalize">{weather.description}</div>
          {weather.cityName && (
            <div className="text-xs text-muted-foreground mt-1">
              Location: {weather.cityName}, {weather.countryCode}
            </div>
          )}
        </div>
        {weather.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-14 h-14"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3" />
          <span>Humidity: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3" />
          <span>Wind: {weather.windSpeed} mph</span>
        </div>
      </div>
    </div>
  )
}
