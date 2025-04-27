// Weather condition categories
export const weatherCategories = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
}

// Park climate categories
export const parkClimateTypes = {
  DESERT: "desert",
  MOUNTAIN: "mountain",
  COASTAL: "coastal",
  FOREST: "forest",
  TROPICAL: "tropical",
  ARCTIC: "arctic",
}

// Assign climate types to parks
export const parkClimates = {
  // Desert parks
  "Grand Canyon": parkClimateTypes.DESERT,
  Arches: parkClimateTypes.DESERT,
  Canyonlands: parkClimateTypes.DESERT,
  "Capitol Reef": parkClimateTypes.DESERT,
  "Death Valley": parkClimateTypes.DESERT,
  "Joshua Tree": parkClimateTypes.DESERT,
  Saguaro: parkClimateTypes.DESERT,
  "White Sands": parkClimateTypes.DESERT,
  "Petrified Forest": parkClimateTypes.DESERT,

  // Mountain parks
  Yellowstone: parkClimateTypes.MOUNTAIN,
  "Rocky Mountain": parkClimateTypes.MOUNTAIN,
  "Grand Teton": parkClimateTypes.MOUNTAIN,
  Glacier: parkClimateTypes.MOUNTAIN,
  Yosemite: parkClimateTypes.MOUNTAIN,
  Sequoia: parkClimateTypes.MOUNTAIN,
  "Kings Canyon": parkClimateTypes.MOUNTAIN,
  "Mount Rainier": parkClimateTypes.MOUNTAIN,
  "North Cascades": parkClimateTypes.MOUNTAIN,
  "Great Smoky Mountains": parkClimateTypes.MOUNTAIN,
  Shenandoah: parkClimateTypes.MOUNTAIN,

  // Coastal parks
  Acadia: parkClimateTypes.COASTAL,
  Olympic: parkClimateTypes.COASTAL,
  "Channel Islands": parkClimateTypes.COASTAL,
  "Dry Tortugas": parkClimateTypes.COASTAL,
  Biscayne: parkClimateTypes.COASTAL,
  "Virgin Islands": parkClimateTypes.COASTAL,
  "Point Reyes": parkClimateTypes.COASTAL,
  "Cape Cod": parkClimateTypes.COASTAL,
  "Assateague Island": parkClimateTypes.COASTAL,

  // Forest parks
  Redwood: parkClimateTypes.FOREST,
  Congaree: parkClimateTypes.FOREST,
  Voyageurs: parkClimateTypes.FOREST,
  "Isle Royale": parkClimateTypes.FOREST,
  "Cuyahoga Valley": parkClimateTypes.FOREST,

  // Tropical parks
  Everglades: parkClimateTypes.TROPICAL,
  "Hawaii Volcanoes": parkClimateTypes.TROPICAL,
  Haleakalā: parkClimateTypes.TROPICAL,
  "American Samoa": parkClimateTypes.TROPICAL,

  // Arctic parks
  Denali: parkClimateTypes.ARCTIC,
  "Gates of the Arctic": parkClimateTypes.ARCTIC,
  "Glacier Bay": parkClimateTypes.ARCTIC,
  Katmai: parkClimateTypes.ARCTIC,
  "Kenai Fjords": parkClimateTypes.ARCTIC,
  "Kobuk Valley": parkClimateTypes.ARCTIC,
  "Lake Clark": parkClimateTypes.ARCTIC,
  "Wrangell-St. Elias": parkClimateTypes.ARCTIC,
}

// Default climate for parks not explicitly categorized
export const getClimateType = (parkName) => {
  for (const [key, value] of Object.entries(parkClimates)) {
    if (parkName.includes(key)) {
      return value
    }
  }
  return parkClimateTypes.FOREST // Default
}

// Evaluate weather conditions for a specific climate type
export const evaluateWeatherForClimate = (forecast, climateType) => {
  const condition = forecast.condition.toLowerCase()
  const temp = forecast.avgTemp

  // Base scores for different weather conditions
  let score = 0

  // Temperature evaluation
  if (climateType === parkClimateTypes.DESERT) {
    // Desert parks are best when not too hot
    if (temp >= 60 && temp <= 85) score += 3
    else if (temp > 85 && temp <= 95) score += 1
    else if (temp > 95) score -= 2
    else if (temp >= 45 && temp < 60) score += 2
    else score -= 1
  } else if (climateType === parkClimateTypes.MOUNTAIN) {
    // Mountain parks are best in mild temperatures
    if (temp >= 50 && temp <= 75) score += 3
    else if ((temp >= 40 && temp < 50) || (temp > 75 && temp <= 85)) score += 2
    else if (temp < 32) score -= 2
    else score += 0
  } else if (climateType === parkClimateTypes.COASTAL) {
    // Coastal parks are good in moderate temperatures
    if (temp >= 60 && temp <= 80) score += 3
    else if ((temp >= 50 && temp < 60) || (temp > 80 && temp <= 90)) score += 2
    else score += 0
  } else if (climateType === parkClimateTypes.FOREST) {
    // Forest parks are best in mild temperatures
    if (temp >= 55 && temp <= 80) score += 3
    else if ((temp >= 45 && temp < 55) || (temp > 80 && temp <= 90)) score += 2
    else if (temp < 32) score -= 1
    else score += 0
  } else if (climateType === parkClimateTypes.TROPICAL) {
    // Tropical parks are good when not too hot or rainy
    if (temp >= 70 && temp <= 85) score += 3
    else if (temp > 85 && temp <= 95) score += 1
    else score += 0
  } else if (climateType === parkClimateTypes.ARCTIC) {
    // Arctic parks are best in summer
    if (temp >= 50 && temp <= 70) score += 3
    else if (temp >= 40 && temp < 50) score += 2
    else if (temp >= 32 && temp < 40) score += 1
    else if (temp < 32) score -= 1
    else score += 0
  }

  // Weather condition evaluation
  if (condition.includes("clear") || condition.includes("sun")) {
    score += 2
  } else if (condition.includes("cloud") || condition.includes("partly")) {
    score += 1
  } else if (condition.includes("rain") || condition.includes("shower")) {
    score -= 1
    // Rain is less problematic in tropical and forest areas
    if (climateType === parkClimateTypes.TROPICAL || climateType === parkClimateTypes.FOREST) {
      score += 1
    }
  } else if (condition.includes("storm") || condition.includes("thunder")) {
    score -= 2
  } else if (condition.includes("snow")) {
    score -= 2
    // Snow is less problematic in mountain and arctic areas in winter
    if (climateType === parkClimateTypes.MOUNTAIN || climateType === parkClimateTypes.ARCTIC) {
      score += 1
    }
  } else if (condition.includes("fog") || condition.includes("mist")) {
    score -= 1
    // Fog is atmospheric in coastal and forest areas
    if (climateType === parkClimateTypes.COASTAL || climateType === parkClimateTypes.FOREST) {
      score += 1
    }
  }

  // Convert score to category
  if (score >= 4) return weatherCategories.EXCELLENT
  if (score >= 2) return weatherCategories.GOOD
  if (score >= 0) return weatherCategories.FAIR
  return weatherCategories.POOR
}

// Get park recommendations based on forecasts
export const getParkRecommendations = (parks, forecasts) => {
  if (!forecasts || forecasts.length === 0) return []

  return parks
    .map((park) => {
      const climateType = getClimateType(park.name)
      const weatherRatings = forecasts.map((forecast) => ({
        date: forecast.date,
        rating: evaluateWeatherForClimate(forecast, climateType),
        forecast,
      }))

      // Calculate overall score
      const scoreMap = {
        [weatherCategories.EXCELLENT]: 3,
        [weatherCategories.GOOD]: 2,
        [weatherCategories.FAIR]: 1,
        [weatherCategories.POOR]: 0,
      }

      const totalScore = weatherRatings.reduce((sum, day) => sum + scoreMap[day.rating], 0)
      const averageScore = totalScore / weatherRatings.length

      return {
        park,
        weatherRatings,
        averageScore,
        recommendationLevel:
          averageScore >= 2.5
            ? "Highly Recommended"
            : averageScore >= 1.5
              ? "Recommended"
              : averageScore >= 0.8
                ? "Consider"
                : "Not Recommended",
      }
    })
    .sort((a, b) => b.averageScore - a.averageScore)
}
