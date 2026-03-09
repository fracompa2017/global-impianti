"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyShiftsChart({
  turni,
}: {
  turni: Array<{
    data: string;
  }>;
}) {
  const grouped = turni.reduce<Record<string, number>>((acc, turno) => {
    acc[turno.data] = (acc[turno.data] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([day, count]) => ({ day, turni: count }));

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle>Calendario settimanale turni</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" />
            <XAxis dataKey="day" tick={{ fill: "#4A5068", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#4A5068", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "rgba(59,111,232,0.08)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E8EAF0",
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              }}
            />
            <Bar dataKey="turni" fill="#3B6FE8" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
