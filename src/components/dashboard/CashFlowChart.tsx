"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', Pemasukan: 120000000, Pengeluaran: 80000000 },
  { name: 'Feb', Pemasukan: 135000000, Pengeluaran: 95000000 },
  { name: 'Mar', Pemasukan: 110000000, Pengeluaran: 85000000 },
  { name: 'Apr', Pemasukan: 140000000, Pengeluaran: 105000000 },
  { name: 'Mei', Pemasukan: 155000000, Pengeluaran: 120000000 },
  { name: 'Jun', Pemasukan: 125000000, Pengeluaran: 90000000 },
];

export default function CashFlowChart() {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const formatRupiahAxis = (value: number) => {
    return `Rp ${value / 1000000} Jt`;
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border h-[400px] flex flex-col">
      <div className="p-6 pb-2 border-b border-border bg-bg/50">
        <h3 className="text-lg font-bold text-text-main">Arus Kas Semester Ini</h3>
        <p className="text-sm text-text-muted mt-1">Perbandingan Pemasukan & Pengeluaran Total Yayasan</p>
      </div>
      <div className="flex-1 pl-0 pr-6 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: 20, bottom: 5 }}
            barSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={formatRupiahAxis} />
            <Tooltip 
              cursor={{ fill: "transparent" }}
              contentStyle={{ borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              formatter={(value: any) => [formatRupiah(Number(value)), ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="Pemasukan" fill="var(--albas-green)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
