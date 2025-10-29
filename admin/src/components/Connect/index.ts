import Connect from './src/Connect.vue';

export { Connect };

export default Connect;

export function v(x, y) {
  return { x, y };
}
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
export function mul(a, s) {
  return { x: a.x * s, y: a.y * s };
}
export function len(a) {
  return Math.hypot(a.x, a.y) || 1e-6;
}
export function norm(a) {
  const L = len(a);
  return { x: a.x / L, y: a.y / L };
}
export function perp(a) {
  return { x: -a.y, y: a.x };
}
export function angleOf(a) {
  return Math.atan2(a.y, a.x);
}
