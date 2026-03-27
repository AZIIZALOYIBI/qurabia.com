// Minimal placeholder for toric code simulation helpers
export function initializeToricGrid(size = 5) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  return grid
}
