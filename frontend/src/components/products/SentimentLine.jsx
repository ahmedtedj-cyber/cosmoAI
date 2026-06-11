import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export default function SentimentLine({ analyses }) {
  const data = [...analyses]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(a => {
      const total = (a.sentiment_positive || 0) + (a.sentiment_neutral || 0) + (a.sentiment_negative || 0);
      return {
        date: format(new Date(a.created_date), 'MMM d'),
        score: total > 0 ? Math.round(((a.sentiment_positive || 0) / total) * 100) : 0,
      };
    });

  if (data.length === 0) return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>;

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}