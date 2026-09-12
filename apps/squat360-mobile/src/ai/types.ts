export type Landmark = {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseFrame = {
  timestampMs: number;
  landmarks: Landmark[];
};

export type SetCountResult = {
  reps: number;
  phase: 'standing' | 'descending' | 'bottom' | 'ascending' | 'unknown';
  notes: string[];
};

export type TechniqueFinding = {
  code: string;
  severity: 'info' | 'cue' | 'flag';
  message: string;
  /** Coach-facing; tooling augments coaches, does not replace trainers. */
  coachHint: string;
};

export type TechniqueAnalysis = {
  findings: TechniqueFinding[];
  summary: string;
};
