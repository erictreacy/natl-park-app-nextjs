import { NextResponse } from "next/server"

// Simple in-memory cache to reduce API calls
const weatherCache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes in milliseconds

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  // Create a cache key based on coordinates
  const cacheKey = `${lat},${lon}`

  // Check if we have a valid cached response
  const cachedData = weatherCache.get(cacheKey)
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    console.log(`Using cached weather data for [${lat}, ${lon}]`)
    return NextResponse.json(cachedData.data)
  }

  // Get the API key
  const apiKey = process.env.OPENWEATHER_API_KEY

  // Debug logging for environment variables
  console.log("Environment variables check:")
  console.log("- OPENWEATHER_API_KEY exists:", !!apiKey)
  if (apiKey) {
    console.log("- OPENWEATHER_API_KEY length:", apiKey.length)
    console.log("- OPENWEATHER_API_KEY first 4 chars:", apiKey.substring(0, 4))
    console.log("- OPENWEATHER_API_KEY last 4 chars:", apiKey.substring(apiKey.length - 4))
  }

  // Check if API key is available
  if (!apiKey) {
    console.error("OpenWeather API key is not configured")
    const mockData = generateMockWeatherData(lat, lon)
    return NextResponse.json(
      {
        error: "OpenWeather API key is not configured. Please add your API key to the environment variables.",
        useMockData: true,
        mockData,
      },
      { status: 200 }, // Return 200 with mock data
    )
  }

  try {
    // Construct the OpenWeather API URL - ensure no spaces or special characters in the key
    const cleanApiKey = apiKey.trim()
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${cleanApiKey}&units=imperial`

    console.log(`Fetching weather data from: ${apiUrl.replace(cleanApiKey, "API_KEY_HIDDEN")}`)

    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store", // Disable caching to ensure fresh data
    })

    // Handle non-OK responses
    if (!response.ok) {
      // Try to get the response text first
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Could not read error response"
      }

      console.error(`Weather API error (${response.status}): ${errorText}`)

      // Handle specific error cases
      if (response.status === 401) {
        console.warn("Invalid OpenWeather API key, using mock data instead")
        const mockData = generateMockWeatherData(lat, lon)
        return NextResponse.json(
          {
            error:
              "Invalid OpenWeather API key. Please check your API key or get a new one at https://openweathermap.org/api.",
            useMockData: true,
            mockData,
          },
          { status: 200 },
        )
      } else if (response.status === 429) {
        console.warn("OpenWeather API rate limit exceeded, using mock data instead")
        const mockData = generateMockWeatherData(lat, lon)
        return NextResponse.json(
          {
            error: "OpenWeather API rate limit exceeded. Using simulated weather data instead.",
            useMockData: true,
            mockData,
          },
          { status: 200 },
        )
      }

      // For other errors, throw with status code
      throw new Error(`Weather API responded with status: ${response.status}`)
    }

    // Parse the JSON response safely
    let data
    try {
      data = await response.json()
    } catch (error) {
      console.error("Error parsing weather API response:", error)
      const mockData = generateMockWeatherData(lat, lon)
      return NextResponse.json(
        {
          error: "Failed to parse weather data response. Using simulated weather data instead.",
          useMockData: true,
          mockData,
        },
        { status: 200 },
      )
    }

    // Log successful response
    console.log(
      `Weather data received for coordinates [${lat}, ${lon}]:`,
      JSON.stringify(data).substring(0, 200) + "...",
    )

    // Format the response
    const weatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: data.weather[0].icon,
      cityName: data.name,
      countryCode: data.sys.country,
      timestamp: new Date().toISOString(),
    }

    // Cache the successful response
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    })

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Error fetching weather data:", error.message)

    // Return mock data on error
    const mockData = generateMockWeatherData(lat, lon)
    return NextResponse.json(
      {
        error: `Failed to fetch weather data: ${error.message}. Using simulated weather data instead.`,
        useMockData: true,
        mockData,
      },
      { status: 200 }, // Return 200 with mock data
    )
  }
}

// Generate realistic mock weather data based on location and season
function generateMockWeatherData(lat, lon) {
  // Parse coordinates
  const latitude = Number.parseFloat(lat)
  const longitude = Number.parseFloat(lon)

  // Get current date for seasonal adjustments
  const now = new Date()
  const month = now.getMonth() // 0-11

  // Determine if northern or southern hemisphere
  const isNorthernHemisphere = latitude > 0

  // Adjust season based on hemisphere
  let isSummer
  if (isNorthernHemisphere) {
    // Northern hemisphere: summer is June-August
    isSummer = month >= 5 && month <= 7
  } else {
    // Southern hemisphere: summer is December-February
    isSummer = month >= 11 || month <= 1
  }

  // Temperature based on latitude and season
  let baseTemp
  if (Math.abs(latitude) < 23.5) {
    // Tropical: warm year-round
    baseTemp = 85
  } else if (Math.abs(latitude) < 45) {
    // Temperate
    baseTemp = isSummer ? 75 : 45
  } else {
    // Polar regions
    baseTemp = isSummer ? 50 : 20
  }

  // Add some randomness
  const tempVariation = Math.floor(Math.random() * 20) - 10
  const temperature = baseTemp + tempVariation

  // Determine condition based on temperature and randomness
  const conditions = [
    { name: "Clear", weight: 0.4 },
    { name: "Clouds", weight: 0.3 },
    { name: "Rain", weight: 0.15 },
    { name: "Snow", weight: 0.1 },
    { name: "Thunderstorm", weight: 0.05 },
  ]

  // Adjust weights based on temperature
  if (temperature < 32) {
    // More likely to snow when cold
    conditions.find((c) => c.name === "Snow").weight = 0.4
    conditions.find((c) => c.name === "Clear").weight = 0.3
    conditions.find((c) => c.name === "Clouds").weight = 0.2
    conditions.find((c) => c.name === "Rain").weight = 0.1
    conditions.find((c) => c.name === "Thunderstorm").weight = 0
  } else if (temperature > 90) {
    // More likely to be clear or thunderstorm when hot
    conditions.find((c) => c.name === "Clear").weight = 0.5
    conditions.find((c) => c.name === "Thunderstorm").weight = 0.2
    conditions.find((c) => c.name === "Clouds").weight = 0.2
    conditions.find((c) => c.name === "Rain").weight = 0.1
    conditions.find((c) => c.name === "Snow").weight = 0
  }

  // Select condition based on weights
  const random = Math.random()
  let cumulativeWeight = 0
  let selectedCondition = conditions[0].name

  for (const condition of conditions) {
    cumulativeWeight += condition.weight
    if (random <= cumulativeWeight) {
      selectedCondition = condition.name
      break
    }
  }

  // Generate description based on condition
  let description
  switch (selectedCondition) {
    case "Clear":
      description = "clear sky"
      break
    case "Clouds":
      description = Math.random() > 0.5 ? "scattered clouds" : "broken clouds"
      break
    case "Rain":
      description = Math.random() > 0.5 ? "light rain" : "moderate rain"
      break
    case "Snow":
      description = Math.random() > 0.5 ? "light snow" : "snow"
      break
    case "Thunderstorm":
      description = "thunderstorm"
      break
    default:
      description = "clear sky"
  }

  // Generate icon code based on condition
  let icon
  switch (selectedCondition) {
    case "Clear":
      icon = "01d"
      break
    case "Clouds":
      icon = Math.random() > 0.5 ? "02d" : "03d"
      break
    case "Rain":
      icon = Math.random() > 0.5 ? "10d" : "09d"
      break
    case "Snow":
      icon = "13d"
      break
    case "Thunderstorm":
      icon = "11d"
      break
    default:
      icon = "01d"
  }

  // Generate humidity and wind speed
  const humidity = Math.floor(Math.random() * 40) + 40 // 40-80%
  const windSpeed = Math.floor(Math.random() * 15) + 5 // 5-20 mph

  // Generate city name based on coordinates (very approximate)
  const cityName = "Unknown Location"
  const countryCode = "US"

  // Return the mock weather data
  return {
    temperature: Math.round(temperature),
    condition: selectedCondition,
    description: description,
    humidity: humidity,
    windSpeed: windSpeed,
    icon: icon,
    cityName: cityName,
    countryCode: countryCode,
    timestamp: new Date().toISOString(),
    isMockData: true,
  }
}
