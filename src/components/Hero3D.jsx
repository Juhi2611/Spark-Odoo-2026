import { Suspense, lazy, useEffect, useState } from "react";

const Scene = lazy(() => import("./HeroScene"));

export default function Hero3D({ compact = false }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="absolute inset-0">
      {mounted && (
        <Suspense fallback={<div className="absolute inset-0 fc-grid-bg opacity-40" />}>
          <Scene compact={compact} />
        </Suspense>
      )}
    </div>
  );
}
