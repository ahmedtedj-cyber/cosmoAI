import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function IssuesBar({ analyses }) {
  const map = {};
  analyses.forEach(a =>
    (a.aspects || []).forEach(asp => {
      if (asp.sentiment === 'negative')
        map[asp.aspect] = (map[asp.aspect] || 0) + (asp.mentions || 1);
    })
  );
  const data = Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (data.length === 0) return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No issues detected</div>;

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill="#f43f5e" fillOpacity={1 - i * 0.12} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}