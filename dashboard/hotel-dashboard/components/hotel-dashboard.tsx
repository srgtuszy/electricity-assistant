"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Battery, Droplet, Loader2 } from "lucide-react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { collection, doc, onSnapshot, query, where, getDocs } from "firebase/firestore"
import { firestore } from "../lib/firestore"

// Tiny line chart component
const TinyLineChart = ({ data, color }: { data: number[], color: string }) => (
  <ChartContainer
    config={{
      usage: {
        label: "Usage",
        color: `hsl(var(--${color}))`,
      },
    }}
    className="h-8 w-20"
  >
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.map((value, index) => ({ value, index }))}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={`hsl(var(--${color}))`}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartContainer>
)

export function HotelDashboard() {
  const [roomData, setRoomData] = useState<any[]>([])
  const [headerData, setHeaderData] = useState([
    { title: "Total Rooms", value: "0", icon: BarChart },
    { title: "Occupancy Rate", value: "0%", icon: Battery },
    { title: "Water Usage", value: "0L", icon: Droplet },
  ])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch room data and subscribe to measurements updates
  useEffect(() => {
    console.log("Fetching room data from Firestore")
    setIsLoading(true)
    const unsubscribe = onSnapshot(collection(firestore, "rooms"), (snapshot) => {
      const roomDataPromises = snapshot.docs.map(async (doc) => {
        const roomData = doc.data()
        const roomId = doc.id

        // Subscribe to electricity measurements updates for the room
        const electricityUnsubscribe = onSnapshot(
          query(collection(firestore, "rooms", roomId, "measurements"), where("type", "==", "electricity")),
          (snapshot) => {
            const electricityData = snapshot.docs.map((doc) => doc.data())
            setRoomData((prevData) => {
              const roomIndex = prevData.findIndex((room) => room.number === roomData.roomNumber)
              if (roomIndex !== -1) {
                const updatedRoom = {
                  ...prevData[roomIndex],
                  energy: Math.floor(electricityData[0]?.value || 0),
                  hourlyEnergy: electricityData.map((data) => Math.floor(data.value)),
                }
                const newData = [...prevData]
                newData[roomIndex] = updatedRoom
                return newData
              }
              return prevData
            })
          }
        )

        // Subscribe to water measurements updates for the room
        const waterUnsubscribe = onSnapshot(
          query(collection(firestore, "rooms", roomId, "measurements"), where("type", "==", "water")),
          (snapshot) => {
            const waterData = snapshot.docs.map((doc) => doc.data())
            setRoomData((prevData) => {
              const roomIndex = prevData.findIndex((room) => room.number === roomData.roomNumber)
              if (roomIndex !== -1) {
                const updatedRoom = {
                  ...prevData[roomIndex],
                  water: Math.floor(waterData[0]?.value || 0),
                  hourlyWater: waterData.map((data) => Math.floor(data.value)),
                }
                const newData = [...prevData]
                newData[roomIndex] = updatedRoom
                return newData
              }
              return prevData
            })
          }
        )

        return {
          number: roomData.roomNumber,
          occupied: roomData.isOccupied,
          lastName: roomData.lastName,
          energy: 0,
          water: 0,
          hourlyEnergy: [],
          hourlyWater: [],
          electricityUnsubscribe,
          waterUnsubscribe,
        }
      })

      Promise.all(roomDataPromises).then((data) => {
        setRoomData(data)
        setIsLoading(false)
      })
    })

    return () => {
      unsubscribe()
      roomData.forEach((room) => {
        room.electricityUnsubscribe()
        room.waterUnsubscribe()
      })
    }
  }, [])

  // Update header data whenever roomData changes
  useEffect(() => {
    const totalRooms = roomData.length
    const occupiedRooms = roomData.filter((room) => room.occupied).length
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
    const totalWaterUsage = Math.floor(roomData.reduce((sum, room) => sum + (room.water || 0), 0))

    setHeaderData([
      { title: "Total Rooms", value: totalRooms.toString(), icon: BarChart },
      { title: "Occupancy Rate", value: `${occupancyRate}%`, icon: Battery },
      { title: "Water Usage", value: `${totalWaterUsage}L`, icon: Droplet },
    ])
  }, [roomData])

  return (
    <div className="dark">
      <div className="container mx-auto p-4 space-y-6 bg-zinc-800 text-foreground min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Hotel Dashboard</h1>
        
        {/* Header Section - Three boxes in a row */}
        <div className="flex flex-row justify-between gap-4">
          {headerData.map((item, index) => (
            <Card key={index} className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Room Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Energy Consumption</TableHead>
                      <TableHead>Water Consumption</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomData.map((room) => (
                      <TableRow key={room?.number || ''}>
                        <TableCell className="font-medium">{room?.number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={room?.occupied ? "default" : "secondary"}>
                            {room?.occupied ? `Occupied by ${room?.lastName || ''}` : "Vacant"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{room?.energy || 0} kWh</span>
                            <TinyLineChart data={room?.hourlyEnergy || []} color="chart-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{room?.water || 0} L</span>
                            <TinyLineChart data={room?.hourlyWater || []} color="chart-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
