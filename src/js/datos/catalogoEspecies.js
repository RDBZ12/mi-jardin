export const catalogoEspecies = [
  { nombre: 'Rosa', cientifico: 'Rosa spp.', categoria: 'ornamentales', riego: 4 },
  { nombre: 'Girasol', cientifico: 'Helianthus annuus', categoria: 'exterior', riego: 5 },
  { nombre: 'Aloe Vera', cientifico: 'Aloe vera', categoria: 'suculentas', riego: 14 },
  { nombre: 'Cactus', cientifico: 'Cactaceae', categoria: 'cactus', riego: 21 },
  { nombre: 'Monstera', cientifico: 'Monstera deliciosa', categoria: 'interior', riego: 7 },
  { nombre: 'Pothos', cientifico: 'Epipremnum aureum', categoria: 'interior', riego: 7 },
  { nombre: 'Sansevieria', cientifico: 'Dracaena trifasciata', categoria: 'interior', riego: 14 },
  { nombre: 'Orquídea', cientifico: 'Orchidaceae', categoria: 'interior', riego: 7 },
  { nombre: 'Planta de café', cientifico: 'Coffea arabica', categoria: 'interior', riego: 5 },
  { nombre: 'Lavanda', cientifico: 'Lavandula angustifolia', categoria: 'aromaticas', riego: 6 },
];

export function buscarEspeciePorNombre(nombre) {
  const buscado = String(nombre || '').trim().toLocaleLowerCase('es');
  if (!buscado) return null;
  return catalogoEspecies.find((especie) => especie.cientifico.toLocaleLowerCase('es') === buscado) || null;
}
