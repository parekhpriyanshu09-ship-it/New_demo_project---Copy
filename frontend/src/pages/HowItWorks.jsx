import Layout from '../components/layout/Layout'
import { motion } from 'framer-motion'
import { FilePenLine, QrCode, Building2, LocateFixed, BarChart3, HelpCircle } from 'lucide-react'

const steps = [
  { title: 'Create Tapal', text: 'Register the inward patrak and generate a unique tapal ID.', icon: FilePenLine },
  { title: 'Scan QR', text: 'Use camera or upload mode to fetch linked tapal details.', icon: QrCode },
  { title: 'Assign Department', text: 'Forward the tapal to the responsible department queue.', icon: Building2 },
  { title: 'Track Status', text: 'Monitor pending, review, forwarded, and completed states.', icon: LocateFixed },
  { title: 'Generate Reports', text: 'Export monthly, department-wise, pending, and completed reports.', icon: BarChart3 },
]

export default function HowItWorks() {
  return (
    <Layout>
      <div className="h-2" />
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
            <HelpCircle className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">How It Works</h1>
            <p className="text-xs font-semibold text-slate-400">Police Patrak workflow guide</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.12 }}
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-cyan-400/10"
              >
                <step.icon className="h-6 w-6 text-blue-200" />
              </motion.div>
              <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-blue-300">Step {index + 1}</div>
              <h2 className="text-sm font-black text-white">{step.title}</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
