"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ParkGallery({ parks, onSelectPark }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % parks.length)
  }

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + parks.length) % parks.length)
  }

  const openModal = (park) => {
    setSelectedImage(park)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedImage(null)
  }

  const currentPark = parks[currentIndex]

  return (
    <div className="w-full">
      <div className="relative h-80 w-full overflow-hidden rounded-lg">
        <Image
          src={
            currentPark.image ||
            `/placeholder.svg?height=400&width=800&query=national park landscape ${currentPark.name || "/placeholder.svg"}`
          }
          alt={currentPark.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          onClick={() => openModal(currentPark)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
          onClick={prevImage}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
          onClick={nextImage}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        <div className="absolute bottom-4 left-4 text-white">
          <Badge className="mb-2 bg-green-600 hover:bg-green-700">{currentPark.type}</Badge>
          <h2 className="text-2xl font-bold drop-shadow-md">{currentPark.name}</h2>
          <p className="text-sm text-white/80">{currentPark.state}</p>
        </div>

        <Button variant="secondary" className="absolute bottom-4 right-4" onClick={() => onSelectPark(currentPark)}>
          View Details
        </Button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {parks.slice(0, 10).map((park, index) => (
          <div
            key={park.id}
            className={`relative h-16 w-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
              index === currentIndex ? "border-green-500" : "border-transparent"
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            <Image
              src={park.image || `/placeholder.svg?height=100&width=150&query=${park.name}`}
              alt={park.name}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-4 -top-4 z-10 rounded-full bg-black text-white hover:bg-gray-800"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative h-[80vh] w-[80vw]">
              <Image
                src={
                  selectedImage.image ||
                  `/placeholder.svg?height=800&width=1200&query=${selectedImage.name || "/placeholder.svg"} national park`
                }
                alt={selectedImage.name}
                fill
                className="object-contain"
              />
            </div>

            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-2xl font-bold drop-shadow-md">{selectedImage.name}</h2>
              <p className="text-sm">{selectedImage.state}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
