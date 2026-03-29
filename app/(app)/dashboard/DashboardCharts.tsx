'use client'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler
)

export default function DashboardCharts() {
  const feeData = {
    labels: ['JHS 1A', 'JHS 1B', 'JHS 2A', 'JHS 2B', 'JHS 3A', 'SHS 1A'],
    datasets: [
      {
        label: 'Collected (GHS)',
        data: [12000, 9500, 14000, 11000, 8500, 16000],
        backgroundColor: '#8B1A1A',
        borderRadius: 7,
        borderSkipped: false,
        barPercentage: 0.65,
      },
      {
        label: 'Outstanding (GHS)',
        data: [2000, 3500, 1000, 2500, 4000, 1500],
        backgroundColor: '#c9a84c',
        borderRadius: 7,
        borderSkipped: false,
        barPercentage: 0.65,
      },
    ],
  }

  const genderData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [54, 46],
      backgroundColor: ['#8B1A1A', '#c9a84c'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Enrolment',
        data: [210, 215, 220, 220, 230, 245],
        borderColor: '#8B1A1A',              // was '#0f1f3d'
        backgroundColor: 'rgba(139,26,26,0.06)',  // was rgba(15,31,61,...)
        borderWidth: 2.5,
        pointBackgroundColor: '#8B1A1A',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
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
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: '#0f1f3d',
        titleFont: { family: 'Georgia', size: 12 },
        bodyFont: { family: 'system-ui', size: 11 },
        padding: 12,
        cornerRadius: 10,
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
        grid: { color: '#f5f0e8', lineWidth: 1 },
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
    cutout: '74%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          font: { size: 11, family: 'system-ui' },
          color: '#5a6a82',
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: '#0f1f3d',
        bodyFont: { family: 'system-ui', size: 11 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed}%`,
        },
      },
    },
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f1f3d',
        titleFont: { family: 'Georgia', size: 12 },
        bodyFont: { family: 'system-ui', size: 11 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} students`,
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
        grid: { color: '#f5f0e8', lineWidth: 1 },
        ticks: { font: { size: 11, family: 'system-ui' }, color: '#5a6a82' },
        border: { display: false },
        min: 200,
      },
    },
  }

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
  }

  const cardHeaderStyle = {
    marginBottom: 20,
  }

  const cardTitleStyle = {
    fontFamily: 'Georgia, serif',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--navy)',
  }

  const cardSubStyle = {
    fontFamily: 'system-ui',
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>

      {/* Bar chart — full-width-ish */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={cardTitleStyle}>Fee Collection by Class</div>
              <div style={cardSubStyle}>Collected vs outstanding per class</div>
            </div>
            <div style={{
              background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: 8, padding: '4px 10px',
              fontFamily: 'system-ui', fontSize: 10, color: '#16a34a', fontWeight: 600,
            }}>
              Term 1 · 2024
            </div>
          </div>
        </div>
        <div style={{ height: 220 }}>
          <Bar data={feeData} options={barOptions} />
        </div>
      </div>

      {/* Donut */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={cardTitleStyle}>Gender Split</div>
          <div style={cardSubStyle}>Student gender breakdown</div>
        </div>
        <div style={{ height: 160 }}>
          <Doughnut data={genderData} options={donutOptions} />
        </div>
        {/* Centre label */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>54 / 46</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>Male / Female ratio</div>
        </div>
        {/* Legend bars */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'Male', pct: 54, color: '#0f1f3d' }, { label: 'Female', pct: 46, color: '#c9a84c' }].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
              <div style={{ flex: 2, height: 4, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--navy)', minWidth: 28, textAlign: 'right' }}>{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart — enrolment trend */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={cardTitleStyle}>Enrolment Trend</div>
          <div style={cardSubStyle}>Students Jan–Jun 2024</div>
        </div>
        <div style={{ height: 160 }}>
          <Line data={trendData} options={lineOptions} />
        </div>
        {/* Summary stat */}
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-secondary)' }}>6-month growth</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#16a34a' }}>+16.7%</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(15,31,61,0.04)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>210</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>Jan start</div>
          </div>
          <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(15,31,61,0.04)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>245</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>Jun now</div>
          </div>
        </div>
      </div>

    </div>
  )
}