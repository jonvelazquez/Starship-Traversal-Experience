import planets from '../data/solarsystem.json';

export async function getPlanets() {
  return planets;
}

export async function getBodyById(id) {
  return planets.find((p) => p.id === id);
}
