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

// Design tokens — mirror globals.css
const NAVY    = '#5C0F0F'
const CRIMSON = '#8B1A1A'
const GOLD    = '#C9A84C'
const GOLD_LT = '#E2C97E'
const GRID_LN = '#F2E4E0'
const TICK_CL = '#B08080'

export default function DashboardCharts() {
  const feeData = {
    labels: ['JHS 1A', 'JHS 1B', 'JHS 2A', 'JHS 2B', 'JHS 3A', 'SHS 1A'],
    datasets: [
      {
        label: 'Collected (GHS)',
        data: [12000, 9500, 14000, 11000, 8500, 16000],
        backgroundColor: CRIMSON,
        borderRadius: 7,
        borderSkipped: false,
        barPercentage: 0.65,
      },
      {
        label: 'Outstanding (GHS)',
        data: [2000, 3500, 1000, 2500, 4000, 1500],
        backgroundColor: GOLD,
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
      backgroundColor: [NAVY, GOLD],
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
        borderColor: CRIMSON,
        backgroundColor: 'rgba(139,26,26,0.06)',
        borderWidth: 2.5,
        pointBackgroundColor: CRIMSON,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const tooltipBase = {
    backgroundColor: NAVY,
    titleFont: { family: 'Georgia', size: 12 },
    bodyFont: { family: 'system-ui', size: 11 },
    titleColor: GOLD_LT,
    bodyColor: '#FDF5F0',
    padding: 12,
    cornerRadius: 10,
  }

  const legendBase = {
    position: 'bottom' as const,
    labels: {
      boxWidth: 10, boxHeight: 10, borderRadius: 3,
      font: { size: 11, family: 'system-ui' },
      color: TICK_CL,
      padding: 18,
    },
  }

  const axisBase = {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, family: 'system-ui' }, color: TICK_CL },
      border: { display: false },
    },
    y: {
      grid: { color: GRID_LN, lineWidth: 1 },
      ticks: { font: { size: 11, family: 'system-ui' }, color: TICK_CL },
      border: { display: false },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendBase,
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => ` GHS ${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      ...axisBase,
      y: {
        ...axisBase.y,
        ticks: {
          ...axisBase.y.ticks,
          callback: (v: any) => `${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: legendBase,
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed}%` },
      },
    },
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} students` },
      },
    },
    scales: {
      ...axisBase,
      y: { ...axisBase.y, min: 200 },
    },
  }

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>

      {/* Bar chart */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Fee Collection by Class</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Collected vs outstanding per class</div>
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
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Gender Split</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Student gender breakdown</div>
        </div>
        <div style={{ height: 160 }}>
          <Doughnut data={genderData} options={donutOptions} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>54 / 46</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>Male / Female ratio</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'Male', pct: 54, color: NAVY }, { label: 'Female', pct: 46, color: GOLD }].map(item => (
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

      {/* Line chart */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Enrolment Trend</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Students Jan–Jun 2024</div>
        </div>
        <div style={{ height: 160 }}>
          <Line data={trendData} options={lineOptions} />
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-secondary)' }}>6-month growth</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#16a34a' }}>+16.7%</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          {[{ label: 'Jan start', val: '210' }, { label: 'Jun now', val: '245' }].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '8px 10px', background: 'rgba(92,15,15,0.04)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{s.val}</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}