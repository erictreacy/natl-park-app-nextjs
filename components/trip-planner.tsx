"use client"

import { useState, useEffect } from "react"
import { addDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getParkRecommendations, weatherCategories } from "@/lib/park-recommendations"

export default function TripPlanner({ parks, onSelectPark }) {
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(addDays(new Date(), 7))
  const [location, setLocation] = useState({ lat: 39.8283, lon: -98.5795 }) // Center of US
  const [forecasts, setForecasts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState("recommendations")
  const [tripParks, setTripParks] = useState([])
  
  // Load saved trip from localStorage
  useEffect(() => {
    const savedTrip = localStorage.getItem("nationalParkTrip")
    if (savedTrip) {
      try {
        const parsedTrip = JSON.parse(savedTrip)
        setTripParks(parsedTrip.parks || [])
        if (parsedTrip.startDate) setStartDate(new Date(parsedTrip.startDate))
        if (parsedTrip.endDate) setEndDate(new Date(parsedTrip.endDate))
      } catch (e) {
        console.error("Error loading saved trip:", e)
      }
    }
  }, [])
  
  // Save trip to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("nationalParkTrip", JSON.stringify({
      parks: tripParks,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }))
  }, [tripParks, startDate, endDate])

  // Fetch weather forecasts when dates or location change
  useEffect(() => {
    const fetchForecasts = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/forecast?lat=${location.lat}&lon=${location.lon}&days=7`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch forecast data")
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setForecasts(data)
        
        // Generate recommendations based on forecasts
        const recs = getParkRecommendations(parks, data)
        setRecommendations(recs)
      } catch (err) {
        console.error("Error fetching forecasts:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchForecasts()
  }, [location, parks])
  
  const addParkToTrip = (park) => {
    if (!tripParks.find(p => p.id === park.id)) {
      setTripParks([...tripParks, park])
    }
  }
  
  const removeParkFromTrip = (parkId) => {
    setTripParks(tripParks.filter(park => park.id !== parkId))
  }
  
  const clearTrip = () => {
    setTripParks([])
  }
  
  const getWeatherRatingColor = (rating) => {
    switch(rating) {
      case weatherCategories.EXCELLENT: return "bg-green-100 text-green-800 border-green-300"
      case weatherCategories.GOOD: return "bg-blue-100 text-blue-800 border-blue-300"
      case weatherCategories.FAIR: return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case weatherCategories.POOR: return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }
  
  const getRecommendationColor = (level) => {
    switch(level) {
      case "Highly Recommended": return "bg-green-100 text-green-800"
      case "Recommended": return "bg-blue-100 text-blue-800"
      case "Consider": return "bg-yellow-100 text-yellow-800"
      case "Not Recommended": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trip Planner</CardTitle>
        <CardDescription>Plan your national park visit based on weather forecasts</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex\
