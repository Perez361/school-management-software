// src/app/settings/page.tsx
import { prisma } from '@/lib/prisma'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const settings = await prisma.schoolSettings.findFirst()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-sm text-slate-500">Configure your school information and current term</p>
        </div>
      </div>
      <div className="p-6 max-w-2xl">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
