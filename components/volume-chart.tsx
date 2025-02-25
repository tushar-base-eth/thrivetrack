"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data matching the database schema
const volumeData = {
  daily: [
    { date: "Mon", volume: 2400 },
    { date: "Tue", volume: 2000 },
    { date: "Wed", volume: 3200 },
    { date: "Thu", volume: 2800 },
    { date: "Fri", volume: 2600 },
    { date: "Sat", volume: 1800 },
    { date: "Sun", volume: 2200 },
  ],
}

export function VolumeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="7days">
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="7days" className="flex-1">
              Last 7 Days
            </TabsTrigger>
            <TabsTrigger value="4weeks" className="flex-1">
              Last 4 Weeks
            </TabsTrigger>
            <TabsTrigger value="6months" className="flex-1">
              Last 6 Months
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData.daily}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Volume</span>
                              <span className="font-bold text-muted-foreground">{payload[0].value}kg</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="volume" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

