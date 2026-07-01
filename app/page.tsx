import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="relative flex-1 bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <Dashboard />
      </div>
    </div>
  );
}
