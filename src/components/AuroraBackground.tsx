'use client';

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#0a0e1a] overflow-hidden pointer-events-none">
      {/* Orb 1: Deep Indigo */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-aurora-1"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)' }}
      />
      {/* Orb 2: Cyan */}
      <div
        className="absolute top-[20%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[120px] animate-aurora-2"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' }}
      />
      {/* Orb 3: Purple */}
      <div
        className="absolute bottom-[-20%] left-[10%] w-[70vw] h-[70vw] rounded-full blur-[150px] animate-aurora-3"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)' }}
      />
      {/* Orb 4: Deep Blue */}
      <div
        className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] rounded-full blur-[100px] animate-aurora-1"
        style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.3) 0%, transparent 70%)', animationDelay: '5s' }}
      />
    </div>
  );
}
