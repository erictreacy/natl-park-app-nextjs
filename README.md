# National Parks Explorer

A modern, interactive web application for exploring U.S. National Parks, built with Next.js and featuring real-time weather updates and interactive maps.

## 🌟 Features

- **Interactive Park Search**: Search and explore all U.S. National Parks
- **Real-time Weather Data**: Current weather conditions for each park via OpenWeather API
- **Interactive Maps**: Dynamic map interface powered by Mapbox
- **Park Details**: Comprehensive information about each park including:
  - Location and accessibility
  - Activities and amenities
  - Operating hours
  - Visitor information
- **Modern UI/UX**: Built with shadcn/ui components for a sleek, responsive design
- **Hover Cards**: Quick preview information about parks
- **Responsive Design**: Seamless experience across all devices

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js
- **UI Components**: 
  - Radix UI primitives
  - Tailwind CSS for styling
  - shadcn/ui component system
- **APIs**:
  - National Park Service API
  - OpenWeather API
  - Mapbox GL JS
- **Type Safety**: TypeScript
- **Form Handling**: React Hook Form with Zod validation

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/erictreacy/natl-park-app-nextjs.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API keys:
   ```env
   NEXT_PUBLIC_NPS_API_KEY=your_nps_api_key
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_NPS_API_KEY`: National Park Service API key
- `NEXT_PUBLIC_OPENWEATHER_API_KEY`: OpenWeather API key
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox access token

## 🎨 Features & Components

- **Map Component**: Interactive map showing park locations
- **Park Hover Cards**: Quick preview of park information
- **Weather Widget**: Real-time weather information
- **Search Interface**: Advanced park search functionality
- **Responsive Layout**: Mobile-first design approach

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 👤 Author

**Eric Treacy**

* GitHub: [@erictreacy](https://github.com/erictreacy)
