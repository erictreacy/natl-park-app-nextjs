import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const days = searchParams.get("days") || "7" // Default to 7-day forecast

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  // Get the API key
  const apiKey = process.env.OPENWEATHER_API_KEY

  // Check if API key is available
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenWeather API key is not configured. Please add your API key to the environment variables." },
      { status: 500 },
    )
  }

  try {
    // Using the OpenWeatherMap 5-day forecast API
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&cnt=${Number(days) * 8}` // 8 data points per day (every 3 hours)

    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Process the forecast data to get daily summaries
    const dailyForecasts = processForecastData(data)

    return NextResponse.json(dailyForecasts)
  } catch (error) {
    console.error("Error fetching forecast data:", error)
    return NextResponse.json({ error: "Failed to fetch forecast data from OpenWeather API." }, { status: 500 })
  }
}

// Helper function to process the 3-hour forecast data into daily summaries
function processForecastData(data) {
  const dailyData = {}

  // Group forecast data by day
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0]

    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        temps: [],
        conditions: [],
        icons: [],
        humidity: [],
        windSpeed: [],
        cityName: data.city.name,
        countryCode: data.city.country,
      }
    }

    dailyData[date].temps.push(item.main.temp)
    dailyData[date].conditions.push(item.weather[0].main)
    dailyData[date].icons.push(item.weather[0].icon)
    dailyData[date].humidity.push(item.main.humidity)
    dailyData[date].windSpeed.push(item.wind.speed)
  })

  // Calculate daily summaries
  const result = Object.values(dailyData).map((day) => {
    // Find the most common condition
    const conditionCounts = day.conditions.reduce((acc, condition) => {
      acc[condition] = (acc[condition] || 0) + 1
      return acc
    }, {})

    const mostCommonCondition = Object.keys(conditionCounts).reduce(
      (a, b) => (conditionCounts[a] > conditionCounts[b] ? a : b),
      Object.keys(conditionCounts)[0],
    )

    // Get the icon that corresponds to the most common condition
    const iconIndex = day.conditions.findIndex((c) => c === mostCommonCondition)
    const icon = day.icons[iconIndex >= 0 ? iconIndex : 0]

    return {
      date: day.date,
      highTemp: Math.round(Math.max(...day.temps)),
      lowTemp: Math.round(Math.min(...day.temps)),
      avgTemp: Math.round(day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length),
      condition: mostCommonCondition,
      icon,
      humidity: Math.round(day.humidity.reduce((sum, h) => sum + h, 0) / day.humidity.length),
      windSpeed: Math.round(day.windSpeed.reduce((sum, w) => sum + w, 0) / day.windSpeed.length),
      cityName: day.cityName,
      countryCode: day.countryCode,
    }
  })

  return result
}
