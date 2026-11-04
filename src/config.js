// Previous playable span: 210m. New span: 315m (1.5x per dimension).
export const MAP_LIMIT=157.5;
export const BUILD_LIMIT=150;
export const FLEE_SPEED_MULTIPLIER=.75;
export const FLEE_SPEEDS=Object.freeze([12.5,13.1,11.9].map(v=>v*FLEE_SPEED_MULTIPLIER));
export const GOBLIN_DEATH_COLOR=0xa51f35;
