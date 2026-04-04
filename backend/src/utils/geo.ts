const EARTH_RADIUS_METERS = 6_371_000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export function distanceInMeters(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
) {
  const deltaLat = toRadians(targetLat - originLat)
  const deltaLng = toRadians(targetLng - originLng)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
