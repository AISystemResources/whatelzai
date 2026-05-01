'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateDeviceId(): string {
  const key = 'whatelz_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function DeviceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const device_id = getOrCreateDeviceId();
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id }),
        keepalive: true,
      }).catch(() => {/* silent — tracking is best-effort */});
    } catch {
      // localStorage may be blocked in some privacy modes
    }
  }, [pathname]);

  return null;
}
