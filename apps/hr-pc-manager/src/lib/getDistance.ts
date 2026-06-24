/**
 * @param lat1
 * @param lng1
 * @param lat2
 * @param lng2
 * @returns
 */
// oxlint-disable-next-line eslint/max-params
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000; // 地球半径，单位：米

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
