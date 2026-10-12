import clsx from 'clsx';
import {
  ArrowRight, BellRing, Brain, Check, ChevronDown, Clock3, FileText, Gauge, LineChart, ListChecks, MapPin, Menu, MousePointerClick,
  Radar, ShieldCheck, Sparkles, Target, Upload, Wand2, Wifi, X, Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RadarMark } from '@/app/AppShell';
import { useSession } from '@/app/session';
import { CompanyAvatar } from '@/components/domain';
import { AnimatedNumber } from '@/components/ui/motion';

/**
 * The public front door: what NaukriRadar does, how, and what it costs. Always light, whatever the
 * app theme. Every claim here is something the product does today; anything not live yet says so.
 */

// Prices are placeholders: set them here before launch. Payments are not built yet.
const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    blurb: 'Everything you need to start a focused search.',
    features: ['Matches scored against your profile', 'Score explained factor by factor', 'Skill gap report', 'Track every application'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: 'per month',
    blurb: 'For an active search: more help, less typing.',
    features: ['Everything in Free', 'AI review on every match', 'Cover letters built on your resume', 'Screening answers ready to paste', 'Daily digest by email or Telegram'],
    cta: 'Start free, upgrade later',
    highlight: true,
  },
];

const FAQ = [
  {
    q: 'Will it spam companies in my name?',
    a: 'No. Sites that ban automation (LinkedIn, Naukri, Indeed, Workday and others) are never applied to for you. Those jobs wait in your “Needs you” list with the link, a cover letter and your answers ready, and you press apply yourself.',
  },
  {
    q: 'How does it decide a job fits me?',
    a: 'Every job gets a score from 0 to 100 built from six factors: skills, title, location, experience, how recent it is and how close the job’s meaning is to your profile. You see each factor, so you know why a job scored the way it did.',
  },
  {
    q: 'Does the AI make things up on my cover letter?',
    a: 'Cover letters are built from your own resume and go through a claim check, so a skill or job you never had does not slip in.',
  },
  {
    q: 'Does it apply automatically?',
    a: 'Automatic applying on career sites built for direct applications (Greenhouse, Lever and similar) is being finished and is not switched on yet. Today NaukriRadar finds, scores and prepares; you send.',
  },
  {
    q: 'Where do the jobs come from?',
    a: 'From public job boards, fetched fresh every six hours, with duplicates removed and old postings closed after a week.',
  },
];

export default function LandingPage() {
  const { user } = useSession();
  const start = user ? '/' : '/signin';
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased">
        <Nav start={start} signedIn={!!user} />
        <Hero start={start} />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <Safety />
        <Pricing start={start} />
        <Faq />
        <FinalCta start={start} />
        <Footer />
      </div>
    </MotionConfig>
  );
}

// ---------------------------------------------------------------- helpers

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text?: string }) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-100">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[42px] sm:leading-[1.1]">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-slate-500">{text}</p>}
    </Reveal>
  );
}

/** Soft colour blobs, the page's playful backdrop. */
function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return <div className={clsx('pointer-events-none absolute animate-drift rounded-full blur-3xl', className)} style={{ animationDelay: `${delay}s` }} aria-hidden="true" />;
}

const PrimaryCta = ({ to, children, big }: { to: string; children: ReactNode; big?: boolean }) => (
  <Link
    to={to}
    className={clsx(
      'shine group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 bg-[length:200%_100%] bg-left font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.6)] transition-all duration-500 hover:-translate-y-0.5 hover:bg-right hover:shadow-[0_16px_40px_-10px_rgba(124,58,237,0.7)]',
      big ? 'h-14 px-8 text-base' : 'h-11 px-5 text-sm',
    )}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </Link>
);

// ---------------------------------------------------------------- nav

function Nav({ start, signedIn }: { start: string; signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [
    ['How it works', '#how'],
    ['Features', '#features'],
    ['Safety', '#safety'],
    ['Pricing', '#pricing'],
    ['FAQ', '#faq'],
  ];
  return (
    <header className={clsx('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled ? 'bg-white/80 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-xl' : 'bg-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:h-20 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <RadarMark size={34} />
          <span className="text-lg font-extrabold tracking-tight">NaukriRadar</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {!signedIn && (
            <Link to="/signin" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Sign in
            </Link>
          )}
          <PrimaryCta to={start}>{signedIn ? 'Open app' : 'Get started'}</PrimaryCta>
        </div>
        <button type="button" className="ml-auto rounded-xl p-2 hover:bg-slate-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-white px-4 md:hidden"
          >
            <div className="flex flex-col py-3">
              {links.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 pb-2">
                <Link to="/signin" className="flex h-11 items-center justify-center rounded-2xl font-semibold ring-1 ring-slate-200">
                  Sign in
                </Link>
                <PrimaryCta to={start}>Get started</PrimaryCta>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ---------------------------------------------------------------- hero

const ROTATING = ['backend developer', 'data analyst', 'frontend engineer', 'product designer', 'DevOps engineer'];

function Hero({ start }: { start: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ROTATING.length), 2400);
    return () => clearInterval(t);
  }, []);
  const { scrollY } = useScroll();
  const mockY = useTransform(scrollY, [0, 600], [0, -60]);

  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Blob className="-left-40 -top-40 h-[520px] w-[520px] bg-fuchsia-300/40" />
      <Blob className="-right-40 top-10 h-[480px] w-[480px] bg-sky-300/40" delay={-6} />
      <Blob className="bottom-0 left-1/3 h-[360px] w-[360px] bg-amber-200/50" delay={-12} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Fresh jobs every 6 hours, scored for you
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05]"
          >
            Stop scrolling job boards.
            <span className="mt-1 block">
              Get matched as a{' '}
              <span className="relative block whitespace-nowrap sm:inline-block sm:min-w-[9ch] sm:text-left sm:align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING[i]}
                    initial={{ y: 30, opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -30, opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.45 }}
                    className="inline-block bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent"
                  >
                    {ROTATING[i]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0"
          >
            NaukriRadar reads every new job, scores it against your profile, tells you <em>why</em> it fits, and prepares your cover
            letter and answers. You just press apply.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <PrimaryCta to={start} big>
              Find my matches, free
            </PrimaryCta>
            <a href="#how" className="inline-flex h-14 items-center gap-2 rounded-2xl px-6 font-bold text-slate-700 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
              See how it works
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500 lg:justify-start"
          >
            {['No credit card', 'Set up in 5 minutes', 'Never spams recruiters'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div className="min-w-0" style={{ y: mockY }} initial={{ opacity: 0, scale: 0.94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
          <ProductMock />
        </motion.div>
      </div>
    </section>
  );
}

const MOCK_JOBS = [
  { title: 'Backend Developer (Java)', company: 'Nimbus Labs', place: 'Bengaluru', remote: true, score: 91 },
  { title: 'Software Engineer, Payments', company: 'Bluepeak Fintech', place: 'Pune', remote: false, score: 84 },
  { title: 'Spring Boot Developer', company: 'Quantra Systems', place: 'Remote', remote: true, score: 78 },
];

/** A living picture of the app: matches arrive, their scores fill, a cover letter gets ready. */
function ProductMock() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 4), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-tr from-brand-400/30 via-fuchsia-300/30 to-sky-300/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] bg-white/90 shadow-[0_30px_80px_-20px_rgba(30,27,75,0.35)] ring-1 ring-slate-200/80 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-semibold text-slate-400">Your best matches today</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <Radar className="h-3 w-3" /> scanning
          </span>
        </div>
        <ul className="space-y-2.5 p-4">
          {MOCK_JOBS.map((j, idx) => (
            <motion.li
              key={j.title}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.25, type: 'spring', stiffness: 200, damping: 22 }}
              className={clsx(
                'flex items-center gap-3 rounded-2xl p-3 transition-all duration-500',
                step % 3 === idx ? 'bg-gradient-to-r from-brand-50 to-fuchsia-50 shadow-md ring-1 ring-brand-100' : 'bg-slate-50/70',
              )}
            >
              <CompanyAvatar name={j.company} size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900">{j.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{j.company}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {j.place}
                  </span>
                  {j.remote && (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                      <Wifi className="h-3 w-3" /> remote
                    </span>
                  )}
                </div>
              </div>
              <Ring score={j.score} delay={0.9 + idx * 0.25} />
            </motion.li>
          ))}
        </ul>
        <div className="border-t border-slate-100 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Why Nimbus Labs scored 91</span>
            <span className="text-brand-600">6 factors</span>
          </div>
          {[
            ['Skills', 94, 'from-brand-500 to-violet-500'],
            ['Title', 90, 'from-violet-500 to-fuchsia-500'],
            ['Location', 100, 'from-emerald-500 to-teal-400'],
            ['Experience', 80, 'from-amber-500 to-orange-400'],
          ].map(([label, v, color], k) => (
            <div key={label as string} className="mb-1.5 flex items-center gap-3 text-xs">
              <span className="w-20 font-semibold text-slate-600">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={clsx('h-full rounded-full bg-gradient-to-r', color as string)}
                  initial={{ width: 0 }}
                  animate={{ width: `${v}%` }}
                  transition={{ delay: 1.4 + k * 0.12, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
              <span className="w-7 text-right font-bold tabular-nums text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* floating chips that come and go, like the app's own notifications */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="absolute -bottom-10 -left-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.3)] ring-1 ring-slate-100 sm:-left-10"
        >
          {
            [
              [<FileText key="a" className="h-4 w-4" />, 'bg-violet-100 text-violet-600', 'Cover letter ready', 'Built on your resume'],
              [<ListChecks key="b" className="h-4 w-4" />, 'bg-emerald-100 text-emerald-600', '3 answers ready to paste', 'Notice period, Java, relocation'],
              [<Sparkles key="c" className="h-4 w-4" />, 'bg-amber-100 text-amber-600', 'Learn Kafka → +38 matches', 'Your skill gap'],
              [<BellRing key="d" className="h-4 w-4" />, 'bg-sky-100 text-sky-600', '12 new matches today', 'Daily digest'],
            ].map(([icon, tone, title, sub], k) =>
              k === step ? (
                <div key={k} className="flex items-center gap-3">
                  <span className={clsx('flex h-9 w-9 items-center justify-center rounded-xl', tone as string)}>{icon}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500">{sub}</div>
                  </div>
                </div>
              ) : null,
            )
          }
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="absolute -right-1 -top-5 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 px-4 py-2.5 text-white shadow-xl sm:-right-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[11px] font-semibold text-white/80">Matched today</div>
        <div className="text-xl font-extrabold tabular-nums">
          <AnimatedNumber value={27} />
        </div>
      </motion.div>
    </div>
  );
}

function Ring({ score, delay = 0, size = 46 }: { score: number; delay?: number; size?: number }) {
  const stroke = 4.5;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#fb7185';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ delay, duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums text-slate-800">
        <AnimatedNumber value={score} />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- trust strip

function TrustStrip() {
  const items = [
    { value: 6, suffix: '', label: 'factors behind every match score' },
    { value: 6, suffix: 'h', label: 'between fresh job scans' },
    { value: 15, suffix: '', label: 'job sites we never automate' },
    { value: 0, suffix: '', label: 'applications sent without your say' },
  ];
  return (
    <section className="relative border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {items.map((it, k) => (
          <Reveal key={it.label} delay={k * 0.08} className="text-center">
            <div className="bg-gradient-to-r from-brand-600 to-fuchsia-600 bg-clip-text text-4xl font-extrabold tabular-nums text-transparent">
              <AnimatedNumber value={it.value} />
              {it.suffix}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">{it.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- how it works

const STEPS = [
  { icon: <Upload />, title: 'Tell us about you', text: 'Upload your resume and pick the roles and cities you want. Five minutes, once.', tone: 'from-sky-400 to-brand-500' },
  { icon: <Radar />, title: 'We scan the boards', text: 'Every six hours new jobs are fetched, cleaned and de-duplicated, so you only see real, fresh postings.', tone: 'from-brand-500 to-violet-500' },
  { icon: <Target />, title: 'You get scored matches', text: 'Each job gets a 0–100 score with the reasons shown. Low fits never reach your list.', tone: 'from-violet-500 to-fuchsia-500' },
  { icon: <MousePointerClick />, title: 'Apply in two clicks', text: 'Open the job with your cover letter and screening answers ready to paste, then mark it applied.', tone: 'from-fuchsia-500 to-rose-400' },
];

function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="How it works" title={<>From resume to interview, <span className="text-brand-600">without the grind</span></>} text="Four steps. You do the first one; NaukriRadar does the heavy lifting on the rest." />
        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-[52px] hidden h-0.5 bg-gradient-to-r from-sky-200 via-violet-200 to-rose-200 lg:block" />
          {STEPS.map((s, k) => (
            <Reveal key={s.title} delay={k * 0.12}>
              <div className="group relative h-full rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_50px_-20px_rgba(30,27,75,0.25)]">
                <div className={clsx('relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 [&>svg]:h-6 [&>svg]:w-6', s.tone)}>
                  {s.icon}
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-slate-900 shadow ring-1 ring-slate-100">{k + 1}</span>
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- features

function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white py-24 sm:py-32">
      <Blob className="-right-32 top-40 h-[420px] w-[420px] bg-violet-200/40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Features" title="Everything a serious job search needs" text="Not another job board. A co-pilot that reads, ranks and writes, and shows its working." />
        <div className="grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <FeatureCard
              icon={<Gauge />}
              tone="bg-brand-100 text-brand-700"
              title="Scores that explain themselves"
              text="Skills, title, location, experience, recency and meaning, each scored and shown. No black box: you see exactly why a job is a 91 and another a 54."
            >
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[
                  ['Skills', 94],
                  ['Title', 90],
                  ['Location', 100],
                  ['Recency', 75],
                  ['Experience', 80],
                  ['Meaning', 88],
                ].map(([l, v], k) => (
                  <div key={l as string} className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                    <div className="mx-auto w-fit">
                      <InViewRing score={v as number} delay={k * 0.1} />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureCard icon={<Wand2 />} tone="bg-fuchsia-100 text-fuchsia-700" title="Cover letters, honestly written" text="Built on your actual resume, with a claim check so nothing you didn’t do sneaks in." />
          </Reveal>
          <Reveal delay={0.05}>
            <FeatureCard icon={<ListChecks />} tone="bg-emerald-100 text-emerald-700" title="Answers ready to paste" text="Notice period, years with Java, why this role: screening questions answered from your profile." />
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureCard icon={<Sparkles />} tone="bg-amber-100 text-amber-700" title="Know what to learn next" text="The skill gap report shows which one skill would unlock the most new matches for you." />
          </Reveal>
          <Reveal delay={0.15}>
            <FeatureCard icon={<LineChart />} tone="bg-sky-100 text-sky-700" title="One pipeline, zero spreadsheets" text="Applied, interview, offer: every application tracked with its full timeline, updated live." />
          </Reveal>
          <Reveal delay={0.05} className="lg:col-span-2">
            <FeatureCard icon={<BellRing />} tone="bg-violet-100 text-violet-700" title="A morning digest worth opening" text="New matches and what needs you, by email or Telegram, every morning at 9. Real numbers, not noise." />
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureCard
              icon={<Zap />}
              tone="bg-slate-100 text-slate-700"
              title={
                <>
                  Safe auto-apply <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-800">coming soon</span>
                </>
              }
              text="On career sites built for direct applications, NaukriRadar will apply for you. Never on sites that forbid it."
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, tone, title, text, children }: { icon: ReactNode; tone: string; title: ReactNode; text: string; children?: ReactNode }) {
  return (
    <div className="group h-full rounded-3xl bg-white/80 p-7 ring-1 ring-slate-200/70 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-20px_rgba(30,27,75,0.22)] hover:ring-brand-200">
      <span className={clsx('mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 [&>svg]:h-6 [&>svg]:w-6', tone)}>{icon}</span>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 leading-relaxed text-slate-500">{text}</p>
      {children}
    </div>
  );
}

function InViewRing({ score, delay }: { score: number; delay: number }) {
  const [seen, setSeen] = useState(false);
  return (
    <motion.div onViewportEnter={() => setSeen(true)} viewport={{ once: true }}>
      {seen ? <Ring score={score} delay={delay} size={52} /> : <div style={{ width: 52, height: 52 }} />}
    </motion.div>
  );
}

// ---------------------------------------------------------------- safety

function Safety() {
  const rows = [
    { site: 'LinkedIn, Naukri, Indeed, Workday…', badge: 'Never automated', tone: 'bg-rose-50 text-rose-700 ring-rose-100', what: 'Waits for you with everything ready' },
    { site: 'Unknown career sites', badge: 'You decide', tone: 'bg-amber-50 text-amber-700 ring-amber-100', what: 'Waits for you with everything ready' },
    { site: 'Greenhouse, Lever, Workable…', badge: 'Safe to automate', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', what: 'Applied for you (coming soon)' },
  ];
  return (
    <section id="safety" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Safe by design
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-[42px] sm:leading-[1.1]">Your name, your reputation. We treat it that way.</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">
            Bots that blast hundreds of applications get accounts banned and recruiters annoyed. NaukriRadar checks every site’s rules first and
            never automates where it isn’t welcome. Quality over spray-and-pray.
          </p>
          <ul className="mt-7 space-y-3">
            {['You set a daily limit; it is never exceeded', 'Low-scoring jobs never reach your list', 'Every action is recorded on the application’s timeline'].map((t) => (
              <li key={t} className="flex items-start gap-3 font-medium text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="rounded-[28px] bg-gradient-to-br from-slate-50 to-white p-3 shadow-[0_30px_70px_-30px_rgba(30,27,75,0.3)] ring-1 ring-slate-200/80">
            {rows.map((r, k) => (
              <motion.div
                key={r.site}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + k * 0.15, type: 'spring', stiffness: 200, damping: 24 }}
                className="m-2 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900">{r.site}</div>
                  <div className="text-sm text-slate-500">{r.what}</div>
                </div>
                <span className={clsx('rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset', r.tone)}>{r.badge}</span>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- pricing

function Pricing({ start }: { start: string }) {
  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-slate-950 py-24 text-white sm:py-32">
      <Blob className="-left-40 top-0 h-[460px] w-[460px] bg-brand-600/40" />
      <Blob className="-right-40 bottom-0 h-[460px] w-[460px] bg-fuchsia-600/30" delay={-8} />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-200 ring-1 ring-inset ring-white/10">Pricing</div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-[42px] sm:leading-[1.1]">Start free. Upgrade when it’s working for you.</h2>
          <p className="mt-4 text-lg text-slate-400">Less than one cab ride a month for a search that runs while you sleep.</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((p, k) => (
            <Reveal key={p.name} delay={k * 0.12}>
              <div
                className={clsx(
                  'relative h-full rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5',
                  p.highlight ? 'bg-white text-slate-900 shadow-[0_30px_80px_-20px_rgba(168,85,247,0.6)]' : 'bg-white/[0.06] ring-1 ring-inset ring-white/10 hover:bg-white/[0.09]',
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-8 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 px-3 py-1 text-xs font-bold text-white shadow-lg">Most popular</span>
                )}
                <div className={clsx('text-sm font-bold uppercase tracking-wider', p.highlight ? 'text-brand-600' : 'text-brand-200')}>{p.name}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
                  <span className={p.highlight ? 'text-slate-500' : 'text-slate-400'}>{p.period}</span>
                </div>
                <p className={clsx('mt-3', p.highlight ? 'text-slate-500' : 'text-slate-400')}>{p.blurb}</p>
                <ul className="my-7 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm font-medium">
                      <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', p.highlight ? 'bg-brand-600 text-white' : 'bg-white/15 text-white')}>
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.highlight ? (
                  <PrimaryCta to={start}>{p.cta}</PrimaryCta>
                ) : (
                  <Link to={start} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-bold ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20">
                    {p.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- FAQ

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="FAQ" title="Questions people ask before signing up" />
        <div className="space-y-3">
          {FAQ.map((f, k) => (
            <Reveal key={f.q} delay={k * 0.05}>
              <div className={clsx('overflow-hidden rounded-2xl ring-1 transition-colors', open === k ? 'bg-brand-50/50 ring-brand-200' : 'bg-white ring-slate-200 hover:ring-slate-300')}>
                <button type="button" onClick={() => setOpen(open === k ? null : k)} className="flex w-full items-center gap-4 px-6 py-5 text-left">
                  <span className="flex-1 text-[17px] font-bold">{f.q}</span>
                  <motion.span animate={{ rotate: open === k ? 180 : 0 }} className="text-slate-400">
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === k && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p className="px-6 pb-5 leading-relaxed text-slate-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- final CTA + footer

function FinalCta({ start }: { start: string }) {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-hero-gradient bg-[length:300%_300%] px-6 py-16 text-center text-white animate-gradient sm:px-16 sm:py-20">
          <Blob className="-left-20 -top-20 h-72 w-72 bg-fuchsia-400/40" />
          <Blob className="-bottom-24 right-10 h-72 w-72 bg-sky-300/30" delay={-7} />
          <div className="relative">
            <Brain className="mx-auto mb-5 h-10 w-10 animate-float text-white/80" />
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1]">Your next job is already posted. Let’s find it.</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/75">Set up your profile in five minutes and see today’s matches, scored and explained.</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={start}
                className="group inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-8 font-bold text-brand-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Get started free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
                <Clock3 className="h-4 w-4" /> Takes about 5 minutes
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <RadarMark size={28} />
          <span className="font-bold text-slate-800">NaukriRadar</span>
          <span>· find · match · apply</span>
        </div>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
          <Link to="/signin" className="hover:text-slate-900">Sign in</Link>
        </div>
        <div>© {new Date().getFullYear()} NaukriRadar</div>
      </div>
    </footer>
  );
}
