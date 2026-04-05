import { ForumHeader } from './ForumHeader';

export function ForumShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forum-bg">
      <ForumHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="border-t border-forum-border py-6 text-center text-xs text-forum-muted">
        Acron Testing Platform
      </footer>
    </div>
  );
}
