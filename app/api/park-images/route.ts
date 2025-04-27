import { NextResponse } from "next/server"

// National Park Service API endpoint
const NPS_API_BASE_URL = "https://developer.nps.gov/api/v1"

// Simple in-memory cache to reduce API calls
const imageCache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const parkCode = searchParams.get("parkCode")

    if (!parkCode) {
      return NextResponse.json({ error: "Park code is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `park-images-${parkCode}`
    const cachedData = imageCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`Using cached images for park code: ${parkCode}`)
      return NextResponse.json(cachedData.data)
    }

    // Get the API key from environment variables
    const apiKey = process.env.NPS_API_KEY

    if (!apiKey) {
      console.error("NPS API key is not configured")
      return NextResponse.json(
        { error: "NPS API key is not configured. Please add your API key to the environment variables.", images: [] },
        { status: 200 }, // Return 200 with error message instead of 500
      )
    }

    // Log the API key format (first and last 4 characters only for security)
    const keyLength = apiKey.length
    const maskedKey = keyLength > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength - 4)}` : "****"
    console.log(`Using NPS API key format: ${maskedKey} (length: ${keyLength})`)

    // Fetch park data from NPS API
    const apiUrl = `${NPS_API_BASE_URL}/parks?parkCode=${parkCode}&fields=images`
    console.log(`Fetching from NPS API: ${apiUrl}`)

    const response = await fetch(`${NPS_API_BASE_URL}/parks?parkCode=${parkCode}&fields=images`, {
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    // Handle rate limiting specifically
    if (response.status === 429) {
      console.warn("Rate limited by NPS API")
      // Return a placeholder image instead of trying to parse the response
      const placeholderUrl = `/placeholder.svg?height=800&width=1200&query=${encodeURIComponent(parkCode)} National Park scenic landscape`

      const result = {
        images: [{ url: placeholderUrl }],
        rateLimited: true,
      }

      // Cache the result to avoid hammering the API
      imageCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      })

      return NextResponse.json(result, { status: 200 })
    }

    // Handle API response
    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Could not read error response"
      }

      console.error(`NPS API error (${response.status}): ${errorText}`)

      // Check if it's an API key issue
      if (response.status === 403) {
        return NextResponse.json(
          {
            error:
              "Invalid NPS API key. Please check your API key or get a new one at https://www.nps.gov/subjects/developer/get-started.htm",
            details: errorText,
            images: [],
          },
          { status: 200 }, // Return 200 with error message instead of 403
        )
      }

      return NextResponse.json(
        { error: `NPS API responded with status: ${response.status}`, details: errorText, images: [] },
        { status: 200 }, // Return 200 with error message instead of passing through the error status
      )
    }

    // Safely parse the response
    let data
    try {
      data = await response.json()
    } catch (error) {
      console.error("Error parsing NPS API response:", error)
      // Return placeholder instead of error
      const placeholderUrl = `/placeholder.svg?height=800&width=1200&query=${encodeURIComponent(parkCode)} National Park scenic landscape`
      return NextResponse.json({ images: [{ url: placeholderUrl }] }, { status: 200 })
    }

    // Extract images from the response
    if (data.data && data.data.length > 0 && data.data[0].images && data.data[0].images.length > 0) {
      const result = { images: data.data[0].images }

      // Cache the successful response
      imageCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      })

      return NextResponse.json(result)
    } else {
      // Return placeholder if no images found
      const placeholderUrl = `/placeholder.svg?height=800&width=1200&query=${encodeURIComponent(parkCode)} National Park scenic landscape`
      return NextResponse.json({ images: [{ url: placeholderUrl }] })
    }
  } catch (error) {
    console.error("Error fetching park images:", error)
    // Return placeholder instead of error
    const parkCode = new URL(request.url).searchParams.get("parkCode") || "national park"
    const placeholderUrl = `/placeholder.svg?height=800&width=1200&query=${encodeURIComponent(parkCode)} National Park scenic landscape`
    return NextResponse.json(
      {
        error: "Failed to fetch park images",
        details: error.message,
        images: [{ url: placeholderUrl }],
      },
      { status: 200 },
    )
  }
}
