import { ForumShell } from '@/components/ForumShell';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <ForumShell>{children}</ForumShell>;
}
