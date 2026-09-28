import { DEFAULT_START, clock, getWorld } from '@portfolio/world';

/**
 * Pulse runs on the same world clock as every other zone, so "Pause live updates" and the ⌘K
 * speed controls work here too. Before hydration `now` is the 16:18 start (static HTML).
 */
class LiveWorld {
  now = $state(DEFAULT_START);
  paused = $state(false);
  speed = $state(1);

  start() {
    const world = getWorld();
    const sync = () => {
      this.now = world.now();
      this.paused = world.state.paused;
      this.speed = world.state.speed;
    };
    sync();
    const off = world.onState(sync);
    const id = setInterval(sync, 1000);
    return () => {
      off();
      clearInterval(id);
    };
  }

  toggle() {
    getWorld().setPaused(!this.paused);
  }

  get clock() {
    return clock(this.now, true);
  }

  /** Seconds of sim time since 16:18, for counters that roll while you watch. */
  get elapsed() {
    return Math.max(0, (this.now - DEFAULT_START) / 1000);
  }
}

export const live = new LiveWorld();
