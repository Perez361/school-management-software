'use client'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { ClassFeeStats, ClassEnrolmentStats, GenderStats } from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const NAVY    = '#5C0F0F'
const CRIMSON = '#8B1A1A'
const GOLD    = '#C9A84C'
const GOLD_LT = '#E2C97E'
const GRID_LN = '#F2E4E0'
const TICK_CL = '#B08080'
const GREEN   = '#16a34a'

const tooltipBase = {
  backgroundColor: NAVY,
  titleFont: { family: 'Georgia', size: 12 },
  bodyFont:  { family: 'system-ui', size: 11 },
  titleColor: GOLD_LT,
  bodyColor:  '#FDF5F0',
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

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
}

interface Props {
  feeByClass: ClassFeeStats[]
  enrolmentByClass: ClassEnrolmentStats[]
  genderStats: GenderStats
  termLabel: string
}

export default function DashboardCharts({ feeByClass, enrolmentByClass, genderStats, termLabel }: Props) {

  // ── Fee collection by class ──────────────────────────────────────────────
  const feeData = {
    labels: feeByClass.map(r => r.class),
    datasets: [
      {
        label: 'Collected (GHS)',
        data: feeByClass.map(r => r.collected),
        backgroundColor: CRIMSON,
        borderRadius: 7,
        borderSkipped: false,
        barPercentage: 0.65,
      },
      {
        label: 'Outstanding (GHS)',
        data: feeByClass.map(r => r.outstanding),
        backgroundColor: GOLD,
        borderRadius: 7,
        borderSkipped: false,
        barPercentage: 0.65,
      },
    ],
  }

  // ── Gender split ─────────────────────────────────────────────────────────
  const total = genderStats.male + genderStats.female
  const malePct   = total > 0 ? Math.round((genderStats.male   / total) * 100) : 0
  const femalePct = total > 0 ? Math.round((genderStats.female / total) * 100) : 0
  const genderData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [genderStats.male, genderStats.female],
      backgroundColor: [NAVY, GOLD],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  // ── Enrolment by class ───────────────────────────────────────────────────
  const enrolData = {
    labels: enrolmentByClass.map(r => r.class),
    datasets: [{
      label: 'Students',
      data: enrolmentByClass.map(r => r.count),
      backgroundColor: enrolmentByClass.map((_, i) => i % 2 === 0 ? CRIMSON : GOLD),
      borderRadius: 7,
      borderSkipped: false,
      barPercentage: 0.7,
    }],
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

  const enrolOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} students` },
      },
    },
    scales: axisBase,
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: legendBase,
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed} students` },
      },
    },
  }

  const totalEnrolment = enrolmentByClass.reduce((s, r) => s + r.count, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

      {/* Fee Collection by Class */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Fee Collection by Class</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Collected vs outstanding</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'system-ui', fontSize: 10, color: GREEN, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {termLabel}
          </div>
        </div>
        {feeByClass.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>
            No fee records yet
          </div>
        ) : (
          <div style={{ height: 220 }}>
            <Bar data={feeData} options={barOptions} />
          </div>
        )}
      </div>

      {/* Gender Split */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Gender Split</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Active student gender breakdown</div>
        </div>
        {total === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>No students enrolled</div>
        ) : (
          <div style={{ height: 160 }}>
            <Doughnut data={genderData} options={donutOptions} />
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>
            {genderStats.male} / {genderStats.female}
          </div>
          <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>Male / Female</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'Male', pct: malePct, count: genderStats.male, color: NAVY }, { label: 'Female', pct: femalePct, count: genderStats.female, color: GOLD }].map(item => (
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

      {/* Enrolment by Class */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Enrolment by Class</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Active students per class</div>
        </div>
        {enrolmentByClass.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>No classes set up yet</div>
        ) : (
          <div style={{ height: 160 }}>
            <Bar data={enrolData} options={enrolOptions} />
          </div>
        )}
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-secondary)' }}>Total active students</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{totalEnrolment}</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          {[
            { label: 'Classes with students', val: String(enrolmentByClass.filter(r => r.count > 0).length) },
            { label: 'Avg per class', val: enrolmentByClass.length > 0 ? (totalEnrolment / enrolmentByClass.filter(r => r.count > 0).length || 0).toFixed(1) : '—' },
          ].map(s => (
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
