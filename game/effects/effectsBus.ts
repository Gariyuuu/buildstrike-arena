export type EffectEvent =
  | { kind: "tracer"; from: [number, number, number]; to: [number, number, number]; color: string }
  | { kind: "impact"; point: [number, number, number]; color: string }
  | { kind: "destruction"; point: [number, number, number] }
  | { kind: "damageNumber"; point: [number, number, number]; amount: number; headshot: boolean };

type Listener = (e: EffectEvent) => void;

class EffectsBus {
  private listeners = new Set<Listener>();
  emit(e: EffectEvent) {
    this.listeners.forEach((fn) => fn(e));
  }
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

export const effectsBus = new EffectsBus();
