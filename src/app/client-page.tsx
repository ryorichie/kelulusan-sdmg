'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, GraduationCap, ChevronLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkNis } from './actions'
import { Student } from '@prisma/client'
import confetti from 'canvas-confetti'

const playSuspenseAudio = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return () => {};
  const ctx = new AudioContext();
  
  // Create rumbling noise buffer
  const bufferSize = ctx.sampleRate * 4; // 4 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  
  // Lowpass filter to make it a deep rumble
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 100;
  
  // Gain node for volume crescendo
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(1.5, ctx.currentTime + 3.8);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  noiseSource.start();
  
  return () => {
    try {
      noiseSource.stop();
      ctx.close();
    } catch(e) {}
  };
}

export default function ClientPage({ settings }: { settings: Record<string, string> }) {
  const [nis, setNis] = useState('')
  const [status, setStatus] = useState<'idle' | 'suspense' | 'result'>('idle')
  const [result, setResult] = useState<Student | null>(null)
  const [error, setError] = useState('')

  const schoolName = settings['school_name'] || 'Pengumuman Kelulusan'
  const schoolLogo = settings['school_logo']

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nis.trim()) return

    setError('')
    
    try {
      const student = await checkNis(nis)
      if (student) {
        setResult(student)
        
        // Enter suspense mode!
        setStatus('suspense')
        const stopAudio = playSuspenseAudio()

        // Wait 4 seconds for maximum tension
        setTimeout(() => {
          setStatus('result')
          if (student.isGraduated) {
            triggerConfetti()
          }
        }, 4000)

      } else {
        setError('Nomor Induk Siswa (NIS) tidak ditemukan.')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }

  const resetForm = () => {
    setResult(null)
    setNis('')
    setError('')
    setStatus('idle')
  }

  return (
    <div className={`min-h-[100dvh] transition-colors duration-1000 flex flex-col items-center justify-center p-4 relative overflow-hidden ${
      status === 'suspense' ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      
      {/* Decorative background elements */}
      <div className={`absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none transition-opacity duration-1000 ${status === 'suspense' ? 'opacity-10' : 'opacity-100'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-full max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-center">
              {schoolLogo ? (
                <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              )}
              
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                {schoolName}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">
                Masukkan Nomor Induk Siswa (NIS) Anda untuk melihat hasil kelulusan.
              </p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Input
                    type="tel" // better for number input on phones
                    placeholder="Contoh: 12345"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-2xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary"
                    disabled={status !== 'idle'}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-red-500 text-sm justify-center bg-red-50 p-3 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg rounded-2xl font-medium transition-all"
                  disabled={status !== 'idle' || !nis.trim()}
                >
                  Cek Hasil
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {status === 'suspense' && (
          <motion.div
            key="suspense"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: [0, -4, 4, -4, 4, 0], // Shaking effect
              y: [0, 4, -4, 4, -4, 0]
            }}
            transition={{ 
              duration: 0.1, 
              repeat: Infinity,
              repeatType: 'mirror'
            }}
            className="w-full max-w-md text-center flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-slate-300 animate-spin mb-8" />
            <h2 className="text-2xl font-bold text-slate-300 tracking-widest animate-pulse">
              MENGAMBIL DATA...
            </h2>
          </motion.div>
        )}

        {status === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
            className="w-full max-w-lg z-10"
          >
            <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border text-center relative overflow-hidden ${
              result.isGraduated ? 'border-green-300 shadow-green-500/20' : 'border-slate-200'
            }`}>
              
              <div className={`absolute top-0 left-0 w-full h-2 ${
                result.isGraduated ? 'bg-green-500' : 'bg-slate-300'
              }`} />

              {schoolLogo && (
                 <div className="mx-auto w-16 h-16 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="mb-6 mt-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Hasil Pengumuman
                </h2>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{result.name}</h3>
                <p className="text-slate-500 mt-1">NIS: {result.nis}</p>
              </div>

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
                className={`py-6 sm:py-8 px-4 rounded-2xl mb-6 sm:mb-8 ${
                  result.isGraduated 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                  {result.isGraduated ? 'LULUS' : 'TIDAK LULUS'}
                </div>
                {result.isGraduated && (
                  <p className="font-medium text-sm sm:text-base">Selamat atas kelulusan Anda!</p>
                )}
              </motion.div>

              {result.quote && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="relative mb-6"
                >
                  <div className="absolute -top-4 left-0 sm:left-4 text-3xl sm:text-4xl text-slate-200 font-serif">"</div>
                  <p className="text-base sm:text-lg italic text-slate-600 px-6 py-2 relative z-10 leading-relaxed">
                    {result.quote}
                  </p>
                  <div className="absolute -bottom-6 right-0 sm:right-4 text-3xl sm:text-4xl text-slate-200 font-serif rotate-180">"</div>
                </motion.div>
              )}

              <Button 
                variant="outline" 
                onClick={resetForm}
                className="mt-6 rounded-xl h-14 px-6 hover:bg-slate-50 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Kembali Pencarian
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
