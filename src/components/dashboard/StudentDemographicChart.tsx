"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0284c7', '#db2777', '#f59e0b', '#059669', '#7c3aed'];

export default function StudentDemographicChart({ data = [] }: { data?: { name: string, value: number }[] }) {
  const chartData = data.length > 0 ? data : [{ name: 'Belum Ada Data', value: 1 }];

  return (
    <div className="card" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
      <div className="card-header" style={{ paddingBottom: "0.5rem" }}>
        <h3 className="card-title">Sebaran Gender Murid Aktif</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Persentase siswa laki-laki & perempuan</p>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              itemStyle={{ fontWeight: 600, color: "var(--text-main)" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "0.875rem" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
