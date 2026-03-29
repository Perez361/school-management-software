'use client'
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
        label: 'Collected (GHS)',
        data: [12000, 9500, 14000, 11000, 8500, 16000],
        backgroundColor: '#0f1f3d',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Outstanding (GHS)',
        data: [2000, 3500, 1000, 2500, 4000, 1500],
        backgroundColor: '#c9a84c',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const genderData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [54, 46],
      backgroundColor: ['#0f1f3d', '#c9a84c'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          font: { size: 11, family: 'system-ui' },
          color: '#5a6a82',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f1f3d',
        titleFont: { family: 'Georgia', size: 12 },
        bodyFont: { family: 'system-ui', size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` GHS ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'system-ui' }, color: '#5a6a82' },
        border: { display: false },
      },
      y: {
        grid: { color: '#f0ebe2' },
        ticks: {
          font: { size: 11, family: 'system-ui' }, color: '#5a6a82',
          callback: (v: any) => `${(v / 1000).toFixed(0)}k`,
        },
        border: { display: false },
      },
    },
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          font: { size: 11, family: 'system-ui' },
          color: '#5a6a82',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f1f3d',
        bodyFont: { family: 'system-ui', size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed}%`,
        },
      },
    },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

      {/* Bar chart */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
            Fee Collection by Class
          </div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Collected vs outstanding per class
          </div>
        </div>
        <div style={{ height: 220 }}>
          <Bar data={feeData} options={barOptions} />
        </div>
      </div>

      {/* Donut */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
            Gender Distribution
          </div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Student gender breakdown
          </div>
        </div>
        <div style={{ height: 180 }}>
          <Doughnut data={genderData} options={donutOptions} />
        </div>
        {/* Centre label */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>54 / 46</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>M / F ratio</div>
        </div>
      </div>

    </div>
  )
}