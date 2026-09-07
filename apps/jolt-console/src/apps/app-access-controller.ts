import type { AppAccessGateway } from "./gateway";
import type { AppAccessData, AppSessionGrant } from "./model";

const empty: AppAccessData = {
  requests: [],
  sessions: [],
  localIdentities: { active_identity: null, identities: [] },
};

type Snapshot = {
  data: AppAccessData;
  loading: boolean;
  refreshing: boolean;
  busy: boolean;
  error: string | null;
};

export class AppAccessController {
  private snapshot: Snapshot = {
    data: empty,
    loading: true,
    refreshing: false,
    busy: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private pending: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private generation = 0;
  private failures = 0;

  constructor(
    private gateway: AppAccessGateway,
    private interval = 5000,
  ) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start = () => {
    this.running = true;
    void this.refresh();
  };

  stop = () => {
    this.running = false;
    this.generation++;
    this.pending = null;
    clearTimeout(this.timer);
  };

  private publish(change: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...change };
    this.listeners.forEach((listener) => listener());
  }

  refresh = (): Promise<boolean> => {
    if (this.pending) return this.pending;
    clearTimeout(this.timer);
    const generation = this.generation;
    this.publish({ refreshing: true });
    this.pending = this.gateway
      .load()
      .then((data) => {
        if (generation !== this.generation) return false;
        this.failures = 0;
        this.publish({ data, loading: false, error: null });
        return true;
      })
      .catch((error) => {
        if (generation !== this.generation) return false;
        this.failures++;
        this.publish({
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      })
      .finally(() => {
        if (generation !== this.generation) return;
        this.pending = null;
        this.publish({ refreshing: false });
        this.schedule();
      });
    return this.pending;
  };

  private schedule() {
    clearTimeout(this.timer);
    if (!this.running || this.interval <= 0 || this.snapshot.busy) return;
    const delay = Math.min(this.interval * 2 ** this.failures, 30000);
    this.timer = setTimeout(() => void this.refresh(), delay);
  }

  private async perform<T>(operation: () => Promise<T>): Promise<T> {
    if (this.snapshot.busy)
      throw new Error("Another access change is in progress.");
    const generation = this.generation;
    this.publish({ busy: true, error: null });
    clearTimeout(this.timer);
    try {
      await this.pending;
      if (generation !== this.generation)
        throw new Error("The Apps page was closed.");
      const result = await operation();
      if (generation === this.generation) await this.refresh();
      return result;
    } catch (error) {
      if (generation === this.generation)
        this.publish({
          error: error instanceof Error ? error.message : String(error),
        });
      throw error;
    } finally {
      if (generation === this.generation) {
        this.publish({ busy: false });
        this.schedule();
      }
    }
  }

  approve = (request: AppSessionGrant) =>
    this.perform(() => this.gateway.approve(request));

  reject = (request: AppSessionGrant) =>
    this.perform(() => this.gateway.reject(request));

  revoke = (sessions: AppSessionGrant[]) =>
    this.perform(async () => {
      const generation = this.generation;
      const result = await this.gateway.revoke(sessions);
      if (generation !== this.generation) return result;
      const revoked = new Set(
        result.succeeded.map((session) => session.session_id),
      );
      this.publish({
        data: {
          ...this.snapshot.data,
          sessions: this.snapshot.data.sessions.map((session) =>
            revoked.has(session.session_id)
              ? { ...session, status: "revoked" }
              : session,
          ),
        },
      });
      return result;
    });
}
