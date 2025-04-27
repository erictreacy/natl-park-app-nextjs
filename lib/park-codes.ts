// Map our park names to NPS park codes
export const parkCodeMap = {
  Yellowstone: "yell",
  "Grand Canyon": "grca",
  Yosemite: "yose",
  Zion: "zion",
  "Great Smoky Mountains": "grsm",
  Acadia: "acad",
  Olympic: "olym",
  "Rocky Mountain": "romo",
  Shenandoah: "shen",
  Everglades: "ever",
  Arches: "arch",
  "Grand Teton": "grte",
  Glacier: "glac",
  "Bryce Canyon": "brca",
  Canyonlands: "cany",
  "Capitol Reef": "care",
  "Carlsbad Caverns": "cave",
  "Channel Islands": "chis",
  "Crater Lake": "crla",
  "Death Valley": "deva",
  Denali: "dena",
  "Dry Tortugas": "drto",
  "Gates of the Arctic": "gaar",
  "Glacier Bay": "glba",
  "Guadalupe Mountains": "gumo",
  Haleakalā: "hale",
  "Hawaii Volcanoes": "havo",
  "Hot Springs": "hosp",
  "Isle Royale": "isro",
  "Joshua Tree": "jotr",
  Katmai: "katm",
  "Kenai Fjords": "kefj",
  "Kings Canyon": "kica",
  "Kobuk Valley": "kova",
  "Lake Clark": "lacl",
  "Lassen Volcanic": "lavo",
  "Mammoth Cave": "maca",
  "Mesa Verde": "meve",
  "Mount Rainier": "mora",
  "North Cascades": "noca",
  "Petrified Forest": "pefo",
  Redwood: "redw",
  Saguaro: "sagu",
  Sequoia: "sequ",
  "Theodore Roosevelt": "thro",
  "Virgin Islands": "viis",
  Voyageurs: "voya",
  "Wind Cave": "wica",
  "Wrangell-St. Elias": "wrst",
  Badlands: "badl",
  "Big Bend": "bibe",
  "Black Canyon of the Gunnison": "blca",
  Congaree: "cong",
  "Cuyahoga Valley": "cuva",
  "Gateway Arch": "jeff",
  "Great Basin": "grba",
  "Great Sand Dunes": "grsa",
  "Indiana Dunes": "indu",
  "New River Gorge": "neri",
  Pinnacles: "pinn",
  "White Sands": "whsa",
  "American Samoa": "npsa",
  Biscayne: "bisc",
  "Grand Staircase-Escalante": "grsa",
  "Bears Ears": "bear",
  "Statue of Liberty": "stli",
  "Mount St. Helens": "mora",
  "Devils Tower": "deto",
  "Muir Woods": "muwo",
  "Craters of the Moon": "crmo",
}

// Get park code from park name
export function getParkCode(parkName: string): string {
  // Try direct match
  if (parkCodeMap[parkName]) {
    return parkCodeMap[parkName]
  }

  // Try to find a partial match
  for (const [key, value] of Object.entries(parkCodeMap)) {
    if (parkName.includes(key) || key.includes(parkName)) {
      return value
    }
  }

  // Default fallback
  return parkName.toLowerCase().replace(/\s+/g, "").substring(0, 4)
}
