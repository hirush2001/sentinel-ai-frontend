import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Grid, Html, Line, OrbitControls, RoundedBox, Stars, Text } from '@react-three/drei'
import * as THREE from 'three'
import { agentPresence, timeAgo } from '../lib/format'

const STATUS_COLORS = { success: '#55e6b0', warning: '#f5b84b', danger: '#ff6b7d', muted: '#74849b' }

function Fan({ position, scale = 1, color = '#56e6b4', speed = 1 }) {
  const rotor = useRef()
  useFrame((_, delta) => { if (rotor.current) rotor.current.rotation.z += delta * speed * 2.4 })
  return <group position={position} scale={scale}>
    <mesh><torusGeometry args={[0.29, 0.035, 8, 36]}/><meshStandardMaterial color="#40536a" metalness={0.72} roughness={0.35}/></mesh>
    <mesh><circleGeometry args={[0.255, 36]}/><meshStandardMaterial color="#101d2c" metalness={0.15} roughness={0.6}/></mesh>
    <group ref={rotor}>
      {Array.from({ length: 7 }, (_, index) => <mesh key={index} position={[0, 0.12, 0.018]} rotation={[0, 0, (index / 7) * Math.PI * 2]}>
        <RoundedBox args={[0.075, 0.22, 0.025]} radius={0.025} smoothness={3}><meshStandardMaterial color="#638096" metalness={0.55} roughness={0.38}/></RoundedBox>
      </mesh>)}
    </group>
    <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.075, 0.075, 0.055, 24]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} metalness={0.5}/></mesh>
    <mesh position={[0, 0, 0.075]}><circleGeometry args={[0.035, 24]}/><meshBasicMaterial color="#e9fff7"/></mesh>
  </group>
}

function KeyBoard({ position }) {
  return <group position={position}>
    <RoundedBox args={[1.25, 0.1, 0.43]} radius={0.045} smoothness={4}><meshStandardMaterial color="#18283a" metalness={0.5} roughness={0.5}/></RoundedBox>
    {Array.from({ length: 4 }, (_, row) => Array.from({ length: 13 }, (_, col) => <RoundedBox key={`${row}-${col}`} args={[0.065, 0.035, 0.055]} radius={0.012} smoothness={2} position={[-0.56 + col * 0.093, 0.065, -0.14 + row * 0.085]}><meshStandardMaterial color={(row + col) % 7 === 0 ? '#4ab99b' : '#53677e'} metalness={0.25} roughness={0.55}/></RoundedBox>))}
  </group>
}

function Monitor({ position, tint }) {
  return <group position={position}>
    <RoundedBox args={[1.45, 0.96, 0.13]} radius={0.075} smoothness={5} position={[0, 0.56, 0]}><meshStandardMaterial color="#18283a" metalness={0.7} roughness={0.28}/></RoundedBox>
    <RoundedBox args={[1.29, 0.78, 0.018]} radius={0.035} smoothness={4} position={[0, 0.57, 0.073]}><meshStandardMaterial color="#071722" emissive="#0a493d" emissiveIntensity={0.2} roughness={0.3}/></RoundedBox>
    <mesh position={[0, 0.57, 0.086]}><planeGeometry args={[1.2, 0.68]}/><meshBasicMaterial color="#0a1d29"/></mesh>
    <mesh position={[-0.43, 0.79, 0.093]}><planeGeometry args={[0.25, 0.025]}/><meshBasicMaterial color={tint}/></mesh>
    <Text position={[-0.42, 0.68, 0.095]} fontSize={0.065} color="#c8fff0" anchorX="left" anchorY="middle" maxWidth={0.95}>SENTINEL / ENDPOINT</Text>
    <Text position={[-0.42, 0.55, 0.095]} fontSize={0.048} color="#6edbb8" anchorX="left" anchorY="middle">TELEMETRY LINK</Text>
    {Array.from({ length: 5 }, (_, index) => <mesh key={index} position={[-0.42 + index * 0.16, 0.36, 0.095]}><planeGeometry args={[0.09, 0.07 + (index % 3) * 0.035]}/><meshBasicMaterial color={index === 4 ? '#f5b84b' : '#2a9b81'}/></mesh>)}
    <RoundedBox args={[0.12, 0.32, 0.1]} radius={0.025} smoothness={3} position={[0, 0.14, -0.02]}><meshStandardMaterial color="#263b50" metalness={0.6}/></RoundedBox>
    <RoundedBox args={[0.62, 0.06, 0.28]} radius={0.025} smoothness={3} position={[0, -0.025, 0.03]}><meshStandardMaterial color="#2c4259" metalness={0.65}/></RoundedBox>
    <mesh position={[0, 0.06, 0.07]}><sphereGeometry args={[0.025, 16, 16]}/><meshBasicMaterial color={tint}/></mesh>
  </group>
}

function Workstation({ agent, selected, onSelect, position, index }) {
  const presence = agentPresence(agent)
  const tint = STATUS_COLORS[presence.tone] || STATUS_COLORS.muted
  const fans = useRef([])
  const bob = useRef()
  useFrame((state) => {
    if (bob.current) bob.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.035
  })
  return <group position={position}>
    <group ref={bob} onClick={(event) => { event.stopPropagation(); onSelect(agent.id) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      {/* Individually modelled endpoint desk / footprint */}
      <RoundedBox args={[3.65, 0.15, 2.45]} radius={0.16} smoothness={5} position={[0, 0.12, 0]} receiveShadow><meshStandardMaterial color="#122236" metalness={0.72} roughness={0.34}/></RoundedBox>
      <RoundedBox args={[3.48, 0.035, 2.28]} radius={0.1} smoothness={4} position={[0, 0.21, 0]}><meshStandardMaterial color="#1b3448" metalness={0.4} roughness={0.4} emissive={tint} emissiveIntensity={0.035}/></RoundedBox>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.235, 0]}><ringGeometry args={[1.35, 1.42, 64]}/><meshBasicMaterial color={tint} transparent opacity={selected ? 0.8 : 0.38}/></mesh>
      {/* Monitor */}
      <Monitor position={[-0.72, 0.29, -0.72]} tint={tint}/>
      {/* Keyboard and mouse */}
      <KeyBoard position={[-0.7, 0.34, 0.7]}/>
      <group position={[0.25, 0.34, 0.67]}><RoundedBox args={[0.17, 0.08, 0.25]} radius={0.07} smoothness={4}><meshStandardMaterial color="#52677e" metalness={0.35}/></RoundedBox><mesh position={[0, 0.045, -0.055]}><boxGeometry args={[0.012, 0.01, 0.07]}/><meshBasicMaterial color="#b8f9e3"/></mesh></group>
      {/* Tower chassis */}
      <group position={[0.98, 1.15, -0.12]}>
        <RoundedBox args={[1.05, 1.85, 1.12]} radius={0.11} smoothness={6} castShadow><meshStandardMaterial color="#182a3c" metalness={0.74} roughness={0.3}/></RoundedBox>
        <RoundedBox args={[0.92, 1.7, 0.035]} radius={0.065} smoothness={4} position={[0, 0, 0.575]}><meshStandardMaterial color="#0b1826" metalness={0.55} roughness={0.32}/></RoundedBox>
        {/* Front mesh / intake ventilation */}
        {Array.from({ length: 8 }, (_, row) => Array.from({ length: 4 }, (_, col) => <mesh key={`${row}-${col}`} position={[-0.35 + col * 0.23, -0.57 + row * 0.16, 0.6]}><circleGeometry args={[0.018, 8]}/><meshBasicMaterial color="#435d73"/></mesh>))}
        <Fan position={[-0.22, 0.42, 0.63]} scale={0.84} color={tint} speed={1.05}/>
        <Fan position={[-0.22, -0.35, 0.63]} scale={0.84} color={tint} speed={0.82}/>
        {/* Side window and visible internal components */}
        <RoundedBox args={[0.035, 1.56, 0.88]} radius={0.035} smoothness={4} position={[-0.54, 0, 0]}><meshStandardMaterial color="#4d7d91" transparent opacity={0.22} metalness={0.65} roughness={0.15}/></RoundedBox>
        <mesh position={[-0.515, 0.04, -0.06]}><boxGeometry args={[0.018, 1.15, 0.7]}/><meshStandardMaterial color="#173d38" metalness={0.35} roughness={0.6}/></mesh>
        <mesh position={[-0.49, 0.1, -0.08]}><boxGeometry args={[0.028, 0.74, 0.36]}/><meshStandardMaterial color="#233f5c" metalness={0.72} roughness={0.3}/></mesh>
        {/* GPU */}
        <RoundedBox args={[0.18, 0.24, 0.72]} radius={0.035} smoothness={4} position={[-0.39, -0.38, -0.08]}><meshStandardMaterial color="#1b2838" metalness={0.72} roughness={0.32}/></RoundedBox>
        <mesh position={[-0.285, -0.38, -0.08]}><torusGeometry args={[0.105, 0.016, 7, 24]}/><meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.8}/></mesh>
        {/* RAM sticks */}
        {[0,1,2].map((n) => <RoundedBox key={n} args={[0.06, 0.56, 0.12]} radius={0.015} smoothness={3} position={[-0.44, 0.4, -0.34 + n * 0.15]}><meshStandardMaterial color={n === 1 ? '#327f75' : '#4c6d88'} metalness={0.55}/></RoundedBox>)}
        {/* Top cooling radiator and status LED */}
        <mesh position={[0.18, 0.86, -0.08]}><boxGeometry args={[0.42, 0.035, 0.72]}/><meshStandardMaterial color="#32475c" metalness={0.75}/></mesh>
        <mesh position={[0.37, 0.88, 0.42]}><sphereGeometry args={[0.035, 12, 12]}/><meshBasicMaterial color={tint}/></mesh>
      </group>
      {/* Power / activity strip */}
      <mesh position={[1.5, 0.34, -0.12]}><boxGeometry args={[0.06, 0.035, 0.42]}/><meshBasicMaterial color={tint}/></mesh>
      {selected && <mesh position={[0, 0.28, 0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.56,1.63,64]}/><meshBasicMaterial color="#e4fff5" transparent opacity={0.75}/></mesh>}
    </group>
    <Html position={[0, 3.2, 0]} center distanceFactor={13} occlude={false} style={{ pointerEvents: 'none' }}>
      <div className={`min-w-[148px] rounded-xl border px-3 py-2 text-center shadow-xl backdrop-blur-md ${selected ? 'border-emerald-300/50 bg-[#0a1d24]/95' : 'border-slate-600/40 bg-[#091421]/90'}`}>
        <div className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: tint, boxShadow: `0 0 8px ${tint}` }}/><span className="max-w-[130px] truncate text-[10px] font-extrabold text-white">{agent.display_name}</span></div>
        <div className="mt-1 truncate font-mono text-[8px] text-slate-500">{agent.hostname}</div>
        <div className="mt-1 text-[8px] font-bold uppercase tracking-wider" style={{ color: tint }}>{presence.label}</div>
      </div>
    </Html>
  </group>
}

function ServerCore() {
  const lights = useRef([])
  useFrame((state) => {
    lights.current.forEach((light, i) => { if (light) light.material.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 2.2 + i) * 0.35 })
  })
  return <group position={[0, 0, 0]}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0, 0.06, 0]}><cylinderGeometry args={[2.15, 2.28, 0.16, 80]}/><meshStandardMaterial color="#14263a" metalness={0.8} roughness={0.28}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0, 0.15, 0]}><torusGeometry args={[1.9, 0.025, 8, 80]}/><meshBasicMaterial color="#55e6b0" transparent opacity={0.75}/></mesh>
    {/* Central monitoring appliance: rack rails, server trays, drive bays and cooling */}
    <group position={[0, 1.2, 0]}>
      <RoundedBox args={[1.75, 2.35, 1.25]} radius={0.12} smoothness={6} castShadow><meshStandardMaterial color="#172b40" metalness={0.78} roughness={0.28}/></RoundedBox>
      <RoundedBox args={[1.48, 2.08, 0.045]} radius={0.06} smoothness={4} position={[0, 0, 0.65]}><meshStandardMaterial color="#091522" metalness={0.45}/></RoundedBox>
      {[-0.62, -0.2, 0.22, 0.64].map((y, index) => <group key={y} position={[0, y, 0.69]}>
        <RoundedBox args={[1.28, 0.31, 0.08]} radius={0.025} smoothness={3}><meshStandardMaterial color="#243c54" metalness={0.68}/></RoundedBox>
        <mesh position={[-0.42,0,0.05]}><boxGeometry args={[0.32,0.16,0.025]}/><meshStandardMaterial color="#0a1827"/></mesh>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-0.39 + i * 0.11, 0, 0.07]}><boxGeometry args={[0.055,0.07,0.02]}/><meshStandardMaterial color="#49627a" metalness={0.5}/></mesh>)}
        <mesh position={[0.48,0,0.065]}><circleGeometry args={[0.035,12]}/><meshBasicMaterial color={index % 2 ? '#55e6b0' : '#5dd6ef'}/></mesh>
      </group>)}
      <group position={[0, 0.92, 0.7]}>
        <Fan position={[-0.42,0,0]} scale={0.56} color="#55e6b0" speed={0.8}/>
        <Fan position={[0.42,0,0]} scale={0.56} color="#5dd6ef" speed={1.1}/>
      </group>
      <Text position={[0, 1.32, 0.69]} fontSize={0.12} color="#b9ffea" anchorX="center" anchorY="middle" letterSpacing={0.1}>SENTINEL AI</Text>
      <Text position={[0, 1.14, 0.69]} fontSize={0.055} color="#7795a8" anchorX="center" anchorY="middle" letterSpacing={0.15}>COMMAND CORE / API</Text>
      {[0,1,2,3,4].map((i) => <mesh key={i} ref={(el) => { lights.current[i] = el }} position={[-0.42 + i * 0.21, -1.04, 0.68]}><sphereGeometry args={[0.035,12,12]}/><meshStandardMaterial color={i % 2 ? '#55e6b0' : '#5dd6ef'} emissive={i % 2 ? '#55e6b0' : '#5dd6ef'} emissiveIntensity={1.1}/></mesh>)}
    </group>
    <Text position={[0, 0.28, 2.25]} fontSize={0.12} color="#78a2b3" anchorX="center" anchorY="middle" letterSpacing={0.2}>SECURE TELEMETRY HUB</Text>
  </group>
}

function Connection({ start, end, color, offset = 0 }) {
  const packet = useRef()
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(start[0], 1.0, start[2]),
    new THREE.Vector3((start[0] + end[0]) / 2, 3.4, (start[2] + end[2]) / 2),
    new THREE.Vector3(end[0], 0.42, end[2]),
  ), [start, end])
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.018, 6, false), [curve])
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.13 + offset) % 1
    if (packet.current) {
      const point = curve.getPointAt(t)
      packet.current.position.copy(point)
    }
  })
  return <>
    <mesh geometry={geometry}><meshBasicMaterial color={color} transparent opacity={0.3}/></mesh>
    <mesh ref={packet}><octahedronGeometry args={[0.09, 0]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
    <mesh position={end}><sphereGeometry args={[0.045, 12, 12]}/><meshBasicMaterial color={color}/></mesh>
  </>
}

function FloorDecor() {
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.08,0]} receiveShadow><planeGeometry args={[80,80]}/><meshStandardMaterial color="#08111d" roughness={0.95}/></mesh>
    <Grid position={[0,-0.055,0]} args={[60,60]} cellSize={1} cellThickness={0.5} cellColor="#183047" sectionSize={5} sectionThickness={0.9} sectionColor="#23465b" fadeDistance={42} fadeStrength={1.3} infiniteGrid/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.04,0]}><ringGeometry args={[11.4,11.44,128]}/><meshBasicMaterial color="#21475a" transparent opacity={0.4}/></mesh>
  </group>
}

function SceneContent({ agents, selectedId, onSelect }) {
  const positions = useMemo(() => agents.map((agent, index) => {
    const ringIndex = Math.floor(index / 8)
    const indexInRing = index % 8
    const ringCount = Math.min(8, agents.length - ringIndex * 8)
    const angle = (indexInRing / Math.max(ringCount, 1)) * Math.PI * 2 - Math.PI / 2
    const radius = 7.1 + ringIndex * 4.5
    return { agent, position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius], index }
  }), [agents])
  return <>
    <color attach="background" args={['#08111d']}/>
    <fog attach="fog" args={['#08111d', 22, 46]}/>
    <ambientLight intensity={0.72}/><directionalLight position={[7,13,8]} intensity={2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/><pointLight position={[-8,5,-7]} intensity={18} color="#2a9fb2" distance={24}/><pointLight position={[5,3,8]} intensity={12} color="#1da77e" distance={18}/>
    <Stars radius={60} depth={35} count={700} factor={2} saturation={0.25} fade speed={0.4}/>
    <FloorDecor/>
    {positions.map(({ agent, position }, index) => {
      const presence = agentPresence(agent)
      const tint = STATUS_COLORS[presence.tone] || STATUS_COLORS.muted
      return <group key={agent.id}>
        <Connection start={[0,0,0]} end={position} color={tint} offset={index * 0.17}/>
        <Workstation agent={agent} selected={selectedId === agent.id} onSelect={onSelect} position={position} index={index}/>
      </group>
    })}
    <ServerCore/>
    <ContactShadows position={[0,-0.01,0]} opacity={0.38} scale={26} blur={2.5} far={8}/>
    <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={9} maxDistance={36} maxPolarAngle={Math.PI/2.08} target={[0,1,0]}/>
  </>
}

export default function Agent3DScene({ agents = [], selectedId, onSelect }) {
  return <div className="agent-canvas relative h-[520px] w-full overflow-hidden rounded-2xl border border-line/80 sm:h-[600px]">
    <Canvas shadows dpr={[1,1.6]} camera={{ position: [0, 12, 21], fov: 43 }} gl={{ antialias: true, alpha: false }}>
      <Suspense fallback={null}><SceneContent agents={agents} selectedId={selectedId} onSelect={onSelect}/></Suspense>
    </Canvas>
    <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-[#07111e]/80 px-3 py-2 backdrop-blur-md"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 pulse-dot"/> Live fleet topology</div><div className="mt-1 text-[9px] text-slate-500">Interactive 3D · Drag to orbit · Scroll to zoom</div></div>
    <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#07111e]/80 px-3 py-2 backdrop-blur-md"><span className="flex items-center gap-1.5 text-[9px] text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> Recently seen</span><span className="flex items-center gap-1.5 text-[9px] text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-amber-300"/> Delayed</span><span className="flex items-center gap-1.5 text-[9px] text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-rose-400"/> Stale / revoked</span><span className="flex items-center gap-1.5 text-[9px] text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-slate-400"/> Paused / unseen</span></div>
    {agents.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="max-w-xs rounded-2xl border border-line bg-[#091523]/90 px-6 py-5 text-center shadow-2xl backdrop-blur"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><CpuIcon/></div><div className="text-sm font-extrabold text-white">Awaiting first endpoint</div><p className="mt-2 text-xs leading-5 text-slate-500">The command core is ready. Enrol a Windows endpoint to see its workstation model and telemetry connection here.</p></div></div>}
  </div>
}

function CpuIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/></svg> }
