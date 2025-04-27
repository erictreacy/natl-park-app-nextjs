export interface Park {
  id: number;
  name: string;
  type: string;
  state: string;
  description: string;
  established: number;
  visitors: number;
  latitude: number;
  longitude: number;
  website: string;
  image: string;
  images?: string[];
}

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
