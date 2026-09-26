// Client-only view state: ?state variations and live clocks (prerendered pages can't read the query at build).
class View {
  state = $state('live');
  now = $state(Date.UTC(2026, 8, 26, 16, 18, 0));
  sync() {
    this.state = new URLSearchParams(location.search).get('state') ?? 'live';
  }
  start() {
    this.sync();
    this.now = Date.now();
    const id = setInterval(() => (this.now = Date.now()), 1000);
    addEventListener('popstate', () => this.sync());
    return () => clearInterval(id);
  }
}

export const view = new View();

export const clock = (now: number, zone: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(now);
