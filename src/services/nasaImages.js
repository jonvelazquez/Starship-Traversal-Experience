const NASA_IMAGES_URL = "https://images-api.nasa.gov/search";

export async function getNasaImages(query, mode = "default") {
  const missionOverrides = {
    Mercury: {
      orbital: "MESSENGER global",
      surface: "MESSENGER surface"
    },
    Mars: {
      orbital: "MRO orbital",
      surface: "MRO surface"
    }
  };

  // Determine the best query
  let primaryQuery;

  if (missionOverrides[query] && mode !== "default") {
    primaryQuery = missionOverrides[query][mode];
  } else {
    primaryQuery = query;
  }

  // First attempt
  let url = `${NASA_IMAGES_URL}?q=${encodeURIComponent(primaryQuery)}&media_type=image`;
  let res = await fetch(url);
  let data = await res.json();
  let items = data.collection?.items || [];

  // Fallback if too few images
  if (items.length < 6) {
    const fallbackUrl = `${NASA_IMAGES_URL}?q=${encodeURIComponent(query)}&media_type=image`;
    res = await fetch(fallbackUrl);
    data = await res.json();
    items = data.collection?.items || [];
  }

  return items;
}
