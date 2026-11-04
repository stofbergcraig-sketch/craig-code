// Previous playable span: 210m. New span: 315m (1.5x per dimension).
export const MAP_LIMIT=157.5;
export const BUILD_LIMIT=150;
// Apply the further reduction to the currently shipped speeds, not launch values.
export const PREVIOUS_FLEE_SPEEDS=Object.freeze([9.375,9.825,8.925]);
export const FLEE_SPEED_MULTIPLIER=.6;
export const FLEE_SPEEDS=Object.freeze(PREVIOUS_FLEE_SPEEDS.map(v=>v*FLEE_SPEED_MULTIPLIER));
export const GOBLIN_DEATH_COLOR=0xa51f35;
