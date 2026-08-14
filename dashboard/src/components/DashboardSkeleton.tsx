export function DashboardSkeleton() {
  return (
    <div className="dashboard-grid" aria-busy="true" aria-label="Carregando dados do painel">
      <div className="skeleton skeleton-hero" />
      <section className="grid-charts">
        <div className="skeleton skeleton-chart" />
        <div className="skeleton skeleton-chart" />
      </section>
      <section className="grid-lists">
        <div className="skeleton skeleton-list" />
        <div className="skeleton skeleton-list" />
      </section>
    </div>
  );
}
