import type { ReactNode } from 'react';

/** Root pass-through; `[locale]/layout` provides html/body. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
