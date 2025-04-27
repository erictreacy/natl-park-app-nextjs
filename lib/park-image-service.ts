import { getParkCode } from "./park-codes"

// Cache for park images
const parkImageCache = new Map()

// In-memory flag to track if we're experiencing rate limiting
let isRateLimited = false
let rateLimitResetTime = 0
const RATE_LIMIT_COOLDOWN = 60000 // 1 minute cooldown when rate limited

// Track failed requests to implement backoff
const failedRequests = new Map()
const MAX_RETRIES = 3

function getPlaceholderImage(parkName: string): string {
  return `/placeholder.svg?height=800&width=1200&query=${encodeURIComponent(parkName)} National Park scenic landscape`
}

export async function fetchParkImages(parkName: string): Promise<string[]> {
  // Check cache first
  if (parkImageCache.has(parkName)) {
    return parkImageCache.get(parkName)
  }

  // If we're currently rate limited, use placeholder images
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    console.log(`Using placeholder for ${parkName} due to rate limiting`)
    const placeholderUrl = getPlaceholderImage(parkName)
    parkImageCache.set(parkName, [placeholderUrl])
    return [placeholderUrl]
  }

  // Check if this park has failed requests and implement backoff
  const failKey = `fail_${parkName}`
  if (failedRequests.has(failKey)) {
    const failData = failedRequests.get(failKey)
    if (failData.count >= MAX_RETRIES) {
      console.log(`Too many failed requests for ${parkName}, using placeholder`)
      const placeholderUrl = getPlaceholderImage(parkName)
      parkImageCache.set(parkName, [placeholderUrl])
      return [placeholderUrl]
    }
  }

  try {
    const parkCode = getParkCode(parkName)
    console.log(`Fetching images for ${parkName} (code: ${parkCode})`)

    const response = await fetch(`/api/park-images?parkCode=${parkCode}`)

    // Check for rate limiting response
    if (response.status === 429) {
      console.warn("Rate limited by NPS API, using placeholders for a while")
      isRateLimited = true
      rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN
      const placeholderUrl = getPlaceholderImage(parkName)
      parkImageCache.set(parkName, [placeholderUrl])
      return [placeholderUrl]
    }

    if (!response.ok) {
      // Record failed request
      const failKey = `fail_${parkName}`
      if (!failedRequests.has(failKey)) {
        failedRequests.set(failKey, { count: 1, lastAttempt: Date.now() })
      } else {
        const failData = failedRequests.get(failKey)
        failedRequests.set(failKey, {
          count: failData.count + 1,
          lastAttempt: Date.now(),
        })
      }

      // Try to get error text first
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Unknown error"
      }

      console.error(`Failed to fetch images for ${parkName}: ${response.status} ${errorText}`)

      // Use placeholder image as fallback
      const placeholderUrl = getPlaceholderImage(parkName)
      parkImageCache.set(parkName, [placeholderUrl])
      return [placeholderUrl]
    }

    // Safely parse JSON
    let data
    try {
      data = await response.json()
    } catch (e) {
      console.error(`Error parsing JSON for ${parkName}:`, e)
      const placeholderUrl = getPlaceholderImage(parkName)
      parkImageCache.set(parkName, [placeholderUrl])
      return [placeholderUrl]
    }

    // Check if the response indicates rate limiting
    if (data.rateLimited) {
      console.warn("Rate limited response from API, using placeholders for a while")
      isRateLimited = true
      rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN

      if (data.images && data.images.length > 0) {
        const imageUrls = data.images.map((img) => img.url)
        parkImageCache.set(parkName, imageUrls)
        return imageUrls
      }

      const placeholderUrl = getPlaceholderImage(parkName)
      parkImageCache.set(parkName, [placeholderUrl])
      return [placeholderUrl]
    }

    if (data.images && data.images.length > 0) {
      // Get image URLs
      const imageUrls = data.images.map((img) => img.url)
      console.log(`Found ${imageUrls.length} images for ${parkName}`)

      // Cache the results
      parkImageCache.set(parkName, imageUrls)

      // Reset failed requests counter on success
      failedRequests.delete(`fail_${parkName}`)

      return imageUrls
    }

    console.log(`No images found for ${parkName}, using placeholder`)
    const placeholderUrl = getPlaceholderImage(parkName)
    parkImageCache.set(parkName, [placeholderUrl])
    return [placeholderUrl]
  } catch (error) {
    console.error(`Error fetching images for ${parkName}:`, error)
    const placeholderUrl = getPlaceholderImage(parkName)
    parkImageCache.set(parkName, [placeholderUrl])
    return [placeholderUrl]
  }
}

export async function updateParkWithImages(park) {
  try {
    const images = await fetchParkImages(park.name)

    if (images.length > 0) {
      return {
        ...park,
        image: images[0], // Use the first image as the main image
        images: images, // Store all images
      }
    }

    return park
  } catch (error) {
    console.error(`Error updating park ${park.name} with images:`, error)
    return park
  }
}
