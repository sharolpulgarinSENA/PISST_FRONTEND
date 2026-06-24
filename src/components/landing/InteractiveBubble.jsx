import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Points, PointMaterial, OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'

const PARTICLES_COUNT = 800
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

function createParticlePositions() {
  const pos = new Float32Array(PARTICLES_COUNT * 3)
  for (let i = 0; i < PARTICLES_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 8
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8
  }
  return pos
}

const PARTICLE_POSITIONS = createParticlePositions()

function Particles() {
  return (
    <Points positions={PARTICLE_POSITIONS}>
      <PointMaterial color="#4C2A85" size={0.02} transparent opacity={0.5} sizeAttenuation />
    </Points>
  )
}

function Bubble() {
  const [hovered, setHovered] = useState(false)

  return (
    <Sphere
      args={[1.3, 64, 64]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <MeshDistortMaterial
        color="#4C2A85"
        distort={hovered ? 0.5 : 0.35}
        speed={2}
        roughness={0}
        metalness={0.3}
        transparent
        opacity={0.55}
      />
    </Sphere>
  )
}

export default function InteractiveBubble() {
  return (
    <div className="relative max-w-[280px] md:max-w-md mx-auto h-64 md:h-[26rem]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true }}
        style={{
          background: 'transparent',
          maskImage: 'radial-gradient(circle, black 55%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(circle, black 55%, transparent 85%)',
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} color="#4C2A85" intensity={2} />
        <pointLight position={[-3, -2, 2]} color="#1E3A8A" intensity={1} />
        <Bubble />
        <Particles />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={!IS_MOBILE}
          autoRotate
          autoRotateSpeed={0.5}
          rotateSpeed={0.6}
        />
      </Canvas>

      <motion.p
        className="absolute -bottom-8 left-0 right-0 text-center text-xs"
        style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        Tócala. Muévela.
      </motion.p>
    </div>
  )
}
