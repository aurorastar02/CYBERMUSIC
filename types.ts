
export interface AudioData {
  frequencyData: Uint8Array;
  averageFrequency: number;
  bassIntensity: number;
  midIntensity: number;
  trebleIntensity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export interface MousePosition {
  x: number;
  y: number;
}
