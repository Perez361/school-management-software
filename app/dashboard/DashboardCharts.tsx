'use client'
// src/app/dashboard/DashboardCharts.tsx
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function DashboardCharts() {
  const feeData = {
    labels: ['JHS 1A', 'JHS 1B', 'JHS 2A', 'JHS 2B', 'JHS 3A', 'SHS 1A'],
    datasets: [
      {
        label: 'Paid (GHS)',
        data: [12000, 9500, 14000, 11000, 8500, 16000],
        backgroundColor: '#4f46e5',
        borderRadius: 6,
      },
      {
        label: 'Outstanding (GHS)',
        data: [2000, 3500, 1000, 2500, 4000, 1500],
        backgroundColor: '#fcd34d',
        borderRadius: 6,
      },
    ],
  }

  const genderData = {
    labels: ['Male Students', 'Female Students'],
    datasets: [{
      data: [54, 46],
      backgroundColor: ['#4f46e5', '#f472b6'],
      borderWidth: 0,
    }],
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card p-5 col-span-2">
        <h3 className="font-semibold text-slate-800 text-sm mb-4">Fee Collection by Class</h3>
        <Bar data={feeData} options={{
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } },
        }} />
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-4">Gender Distribution</h3>
        <Doughnut data={genderData} options={{
          responsive: true,
          cutout: '70%',
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
        }} />
      </div>
    </div>
  )
}
