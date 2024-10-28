'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Thermometer, Bed, Utensils, X, Check, Wifi, Key } from "lucide-react"
import Confetti from 'react-confetti'
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/spinner" 

type CardData = {
  id: number
  title: string
  content: string
  icon: React.ReactNode
}

export function GuestPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [roomNumber, setRoomNumber] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [cards, setCards] = useState<CardData[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentCardId, setCurrentCardId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Loading state
  const [fetchError, setFetchError] = useState('') // Fetch error state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomNumber && lastName) {
      setIsAuthenticated(true)
      setError('')
      await fetchTips()
    } else {
      setError('Please fill in all fields')
    }
  }

  const fetchTips = async () => {
    try {
      setIsLoading(true) // Start loading
      setFetchError('')  // Clear previous fetch errors
      if (roomNumber) {
        const roomNumberInt = parseInt(roomNumber, 10)
        const tipsRef = collection(firestore, 'tips')
        const q = query(tipsRef, where('roomNumber', '==', roomNumberInt))
        const querySnapshot = await getDocs(q)
        const tipsData: CardData[] = querySnapshot.docs.map((doc, index) => {
          const data = doc.data()
          return {
            id: index,
            title: "Tip",
            content: data.tip,
            icon: <Thermometer className="h-6 w-6" />
          }
        })
        setCards(tipsData)
      }
    } catch (error) {
      console.error("Error fetching tips:", error)
      setFetchError('An error occurred while fetching your tips. Please try again later.')
    } finally {
      setIsLoading(false) // Stop loading
    }
  }

  const handleAction = (id: number, action: 'dismiss' | 'accept') => {
    if (action === 'accept') {
      setCards(cards.filter(card => card.id !== id))
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    } else {
      setCurrentCardId(id)
      setShowFeedback(true)
    }
  }

  const handleFeedback = (reason: string) => {
    console.log(`Card ${currentCardId} dismissed. Reason: ${reason}`)
    setCards(cards.filter(card => card.id !== currentCardId))
    setShowFeedback(false)
    setCurrentCardId(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">GreenGO Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-sm font-medium">
                  Room Number
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    id="roomNumber"
                    type="text"
                    placeholder="Enter your room number"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                <Wifi className="mr-2 h-4 w-4" /> Go GREEN!
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center w-full text-gray-500">
              By connecting, you agree to our terms of service and privacy policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Notifications</h1>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <Spinner size="lg" /> {/* Replace with your spinner component */}
        </div>
      )}

      {/* Fetch Error Indicator */}
      {fetchError && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {fetchError}
        </div>
      )}

      {/* Cards Display */}
      {!isLoading && cards.length > 0 && (
        <div className="space-y-4">
          {cards.map((card) => (
            <Card key={card.id} className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  {card.icon}
                </div>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{card.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction(card.id, 'dismiss')}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" /> Dismiss
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleAction(card.id, 'accept')}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> Accept
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* No Cards Message */}
      {!isLoading && cards.length === 0 && !fetchError && (
        <div className="text-center text-gray-500 my-4">
          No notifications at this time.
        </div>
      )}

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why are you dismissing this task?</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve our recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => handleFeedback("I cannot do this today")}>
              I cannot do this today
            </Button>
            <Button onClick={() => handleFeedback("This todo doesn't apply to me")}>
              This todo doesn't apply to me
            </Button>
            <Button onClick={() => handleFeedback("I'd prefer to do this on another day")}>
              I'd prefer to do this on another day
            </Button>
            <Button onClick={() => handleFeedback("Other")}>
              Other
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}