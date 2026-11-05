// Cálculos de distância para mostrar ao cliente a barbearia mais próxima.

const RAIO_TERRA_KM = 6371;
const paraRadianos = (graus) => (graus * Math.PI) / 180;

export const temCoordenadas = (ponto) =>
  Number.isFinite(ponto?.latitude) && Number.isFinite(ponto?.longitude);

// Distância em linha reta entre dois pontos (fórmula de Haversine), em km.
// É a distância "em linha reta", não o trajeto pelas ruas, mas serve bem para ordenar por proximidade.
export function distanciaKm(a, b) {
  const dLat = paraRadianos(b.latitude - a.latitude);
  const dLon = paraRadianos(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.latitude)) * Math.cos(paraRadianos(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 0.35 -> "350 m" | 1.24 -> "1,2 km" | 37.8 -> "38 km"
export function formatarDistancia(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km).toLocaleString('pt-BR')} km`;
}

// Devolve uma cópia da lista com "distanciaKm" e "distance" (texto) preenchidos, da mais perto
// para a mais longe. Barbearias sem coordenadas vão para o fim, na ordem original.
export function ordenarPorDistancia(barbearias, origem) {
  if (!temCoordenadas(origem)) return barbearias;
  return barbearias
    .map((b, indice) => {
      if (!temCoordenadas(b)) return { ...b, distanciaKm: null, distance: '', indice };
      const km = distanciaKm(origem, b);
      return { ...b, distanciaKm: km, distance: formatarDistancia(km), indice };
    })
    .sort((a, b) => {
      if (a.distanciaKm === null && b.distanciaKm === null) return a.indice - b.indice;
      if (a.distanciaKm === null) return 1;
      if (b.distanciaKm === null) return -1;
      return a.distanciaKm - b.distanciaKm;
    })
    .map((b) => {
      const semIndice = { ...b };
      delete semIndice.indice;
      return semIndice;
    });
}

// Link de rota no Google Maps saindo da posição do cliente até a barbearia.
// destino: texto do endereço (preferível) ou um ponto { latitude, longitude }.
export function linkRotaGoogleMaps(origem, destino) {
  const textoDestino = typeof destino === 'string' ? destino : `${destino.latitude},${destino.longitude}`;
  const params = new URLSearchParams({ api: '1', destination: textoDestino });
  if (temCoordenadas(origem)) params.set('origin', `${origem.latitude},${origem.longitude}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
