import { motion } from 'motion/react'

// The seven ornate floating folios cut straight from the Shrutsanjivan logo.
const FOLIOS = [
  '/images/folios/page-1.png',
  '/images/folios/page-2.png',
  '/images/folios/page-3.png',
  '/images/folios/page-4.png',
  '/images/folios/page-5.png',
  '/images/folios/page-6.png',
  '/images/folios/page-7.png',
]

const rnd = (a, b) => a + Math.random() * (b - a)

// A dense, jittered field of the logo folios packed across the WHOLE
// 200vw×200vh panel — not just its centre. Because the panel is fully populated,
// the viewport is covered for the entire middle of the sweep (rather than only a
// diagonal band). The folios are transparent cut-outs, so heavy overlap (many
// layers deep) is what blankets the screen.
const SCATTER = []
const SCOLS = 8
const SROWS = 6
for (let r = 0; r < SROWS; r += 1) {
  for (let c = 0; c < SCOLS; c += 1) {
    const i = r * SCOLS + c
    SCATTER.push({
      img: (i * 3) % FOLIOS.length,
      left: c * 13 + rnd(-4, 4),
      top: r * 18 + rnd(-4, 4),
      h: rnd(52, 78),
      rot: rnd(-26, 26),
    })
  }
}

// Loose folios that lead (fast) and trail (delayed/slow) the block for an
// uneven, organic edge.
const PARTICLES = [
  { img: 0, size: 26, top: 12, left: 72, rot: -22, spin: -60, delay: 0.0, dur: 1.02 },
  { img: 3, size: 22, top: 2, left: 54, rot: -12, spin: -30, delay: 0.0, dur: 1.08 },
  { img: 5, size: 20, top: 58, left: 22, rot: 18, spin: 40, delay: 0.07, dur: 1.16 },
  { img: 6, size: 18, top: 76, left: 8, rot: 26, spin: 66, delay: 0.11, dur: 1.22 },
  { img: 2, size: 24, top: 20, left: 64, rot: 14, spin: 48, delay: 0.45, dur: 1.52 },
  { img: 4, size: 20, top: 6, left: 84, rot: -20, spin: -64, delay: 0.53, dur: 1.6 },
  { img: 1, size: 22, top: 68, left: 16, rot: -14, spin: -38, delay: 0.48, dur: 1.64 },
]

// A full-page transition: a dense field of the logo's floating folios sweeps
// diagonally from the top-right, covers the viewport at the midpoint (hiding the
// page swap), then clears to the bottom-left. Extra folios lead / trail the
// block for an uneven, organic feel. Mount with a changing `key` to replay.
export function FolioSweep() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        className="absolute"
        style={{
          width: '200vw',
          height: '200vh',
          left: '-50vw',
          top: '-50vh',
          filter: 'saturate(0.72)',
          willChange: 'transform',
        }}
        initial={{ x: '0vw', y: '-200vh' }}
        animate={{ x: '0vw', y: '200vh' }}
        transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
      >
        {SCATTER.map((p, i) => (
          <img
            key={`s-${i}`}
            src={FOLIOS[p.img]}
            alt=""
            aria-hidden="true"
            className="absolute w-auto max-w-[70vw]"
            style={{ top: `${p.top}%`, left: `${p.left}%`, height: `${p.h}vh`, transform: `rotate(${p.rot}deg)` }}
          />
        ))}
      </motion.div>

      {PARTICLES.map((p, i) => (
        <motion.img
          key={`p-${i}`}
          src={FOLIOS[p.img]}
          alt=""
          aria-hidden="true"
          className="absolute saturate-[.72]"
          style={{ top: `${p.top}%`, left: `${p.left}%`, width: `${p.size}vw`, willChange: 'transform, opacity' }}
          initial={{ x: '0vw', y: '-80vh', rotate: p.rot, opacity: 0 }}
          animate={{ x: '0vw', y: '140vh', rotate: p.rot + p.spin, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.4, 0, 0.2, 1], times: [0, 0.15, 0.82, 1] }}
        />
      ))}
    </div>
  )
}
