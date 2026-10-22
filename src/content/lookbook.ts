export const LOOKBOOK_LINES = ["reef", "drift", "tide", "harbor", "dune"] as const;

export type LookbookLine = (typeof LOOKBOOK_LINES)[number];

export type LookbookColor = { name: string; hex: string };

export type LookbookProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  gender: "men" | "women" | "unisex";
  productType: string;
  categorySlug: string;
  line: LookbookLine;
  priceMinor: number;
  compareAtMinor: number | null;
  image: string;
  alt: string;
  featured: boolean;
  sortNewest: number;
  picturedColor: string;
  material: string;
  fabricWeight: string;
  fabricOrigin: string;
  fit: string;
  care: string;
  sustainability: string;
  colors: LookbookColor[];
  sizes: string[];
  includes?: string[];
};

export type LookbookQuery = {
  q?: string;
  category?: string;
  gender?: string;
  productType?: string;
  size?: string;
  color?: string;
  material?: string;
  min?: number;
  max?: number;
  availability?: "in" | "out";
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "popular";
  featured?: boolean;
  collection?: string;
};

const PLANNED =
  "Planned specification only. Fiber origin, mill, dye house, and factory are not yet on record. No certification is claimed.";
const CARE = "Planned care is a cold machine wash and a hang dry. The sewn-in label will control once a sample exists.";
const CAMPAIGN = "Campaign photograph of a planned style. Not a finished production sample.";

const IVORY = { name: "Ivory", hex: "#f3eee4" };
const NAVY = { name: "Navy", hex: "#1c3144" };
const SAND = { name: "Sand", hex: "#cbbfa6" };
const SAGE = { name: "Sage", hex: "#8fa18a" };
const CHARCOAL = { name: "Charcoal", hex: "#2c2c2c" };
const OLIVE = { name: "Olive", hex: "#5d6848" };
const INDIGO = { name: "Indigo", hex: "#243f66" };

const MEN = ["S", "M", "L", "XL"];
const WOMEN = ["XS", "S", "M", "L"];
const WAIST_M = ["30", "32", "34", "36", "38"];
const WAIST_W = ["24", "26", "28", "30", "32"];

export const LOOKBOOK: LookbookProduct[] = [
  {
    slug: "reef-pima-crew",
    name: "Reef Pima Crew",
    shortDescription: "An ivory crew for warm days on the coast.",
    description: "The Reef line starts with a plain pima crew: a clean neck, a straight hem, and enough weight to hold its shape. Ivory is the color in the photograph.",
    gender: "men",
    productType: "tee",
    categorySlug: "tees",
    line: "reef",
    priceMinor: 4800,
    compareAtMinor: null,
    image: "/images/lookbook/reef-pima-crew.jpg",
    alt: `Man in an ivory crew and indigo jeans on a dune. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 70,
    picturedColor: "Ivory",
    material: "Intended composition: pima cotton jersey.",
    fabricWeight: "Intended midweight jersey. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended regular fit.",
    care: CARE,
    sustainability: PLANNED,
    colors: [IVORY, NAVY, SAND],
    sizes: MEN,
  },
  {
    slug: "harbor-polo",
    name: "Harbor Polo",
    shortDescription: "A heavyweight navy polo with a clean placket.",
    description: "Harbor is the shirt line. This polo is planned in cotton pique, with a two-button placket and no chest mark. The photograph shows navy.",
    gender: "men",
    productType: "polo",
    categorySlug: "polos",
    line: "harbor",
    priceMinor: 7800,
    compareAtMinor: null,
    image: "/images/lookbook/harbor-polo.jpg",
    alt: `Man in a navy polo and indigo jeans on a dune. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 60,
    picturedColor: "Navy",
    material: "Intended composition: cotton pique.",
    fabricWeight: "Intended heavyweight pique. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended regular fit, with a collar that sits close.",
    care: CARE,
    sustainability: PLANNED,
    colors: [NAVY, SAND],
    sizes: MEN,
  },
  {
    slug: "drift-stretch-chino",
    name: "Drift Stretch Chino",
    shortDescription: "A sand chino meant for the whole week.",
    description: "Drift is the pant line. The stretch chino is planned with a tailored leg, a clean pocket, and a small share of elastane. The photograph shows sand, worn with an ivory shirt.",
    gender: "men",
    productType: "pants",
    categorySlug: "pants",
    line: "drift",
    priceMinor: 12800,
    compareAtMinor: null,
    image: "/images/lookbook/drift-chino.jpg",
    alt: `Man in a sand chino and ivory shirt on a dune. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 80,
    picturedColor: "Sand",
    material: "Intended composition: cotton twill with elastane.",
    fabricWeight: "Intended twill. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended tailored straight leg.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAND, NAVY],
    sizes: WAIST_M,
  },
  {
    slug: "harbor-coast-overshirt",
    name: "Harbor Coast Overshirt",
    shortDescription: "A sage overshirt to throw on over a crew.",
    description: "An unbuttoned overshirt for cooler air off the water. It is planned in cotton with two chest pockets. The photograph shows sage over an ivory crew.",
    gender: "men",
    productType: "shirt",
    categorySlug: "shirts",
    line: "harbor",
    priceMinor: 14800,
    compareAtMinor: null,
    image: "/images/lookbook/harbor-overshirt.jpg",
    alt: `Man in a sage overshirt on a dune. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 75,
    picturedColor: "Sage",
    material: "Intended composition: cotton.",
    fabricWeight: "Intended shirting weight. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended relaxed over a tee.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAGE, NAVY],
    sizes: MEN,
  },
  {
    slug: "harbor-chore-jacket",
    name: "Harbor Chore Jacket",
    shortDescription: "A navy jacket with patch pockets.",
    description: "The chore jacket is the outer layer in Harbor: a collar, dark buttons, and pockets that sit flat. The photograph shows navy over a sand tee.",
    gender: "men",
    productType: "outerwear",
    categorySlug: "outerwear",
    line: "harbor",
    priceMinor: 21800,
    compareAtMinor: null,
    image: "/images/lookbook/harbor-chore-jacket.jpg",
    alt: `Man in a navy chore jacket on a dune. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 90,
    picturedColor: "Navy",
    material: "Intended composition: cotton canvas.",
    fabricWeight: "Intended canvas. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended regular fit over a tee.",
    care: CARE,
    sustainability: PLANNED,
    colors: [NAVY],
    sizes: MEN,
  },
  {
    slug: "tide-boxer-brief",
    name: "Tide Boxer Brief, Three Pack",
    shortDescription: "Charcoal cotton briefs, folded, sold in a pack of three.",
    description: "Tide is the basics line. These boxer briefs are shown folded, as a still life, in charcoal cotton with a plain waistband. They are not photographed on a body.",
    gender: "men",
    productType: "underwear",
    categorySlug: "mens-underwear",
    line: "tide",
    priceMinor: 4200,
    compareAtMinor: null,
    image: "/images/lookbook/tide-boxer.jpg",
    alt: "Three folded charcoal cotton boxer briefs on linen. Catalog still life, not worn.",
    featured: false,
    sortNewest: 35,
    picturedColor: "Charcoal",
    material: "Intended composition: cotton jersey.",
    fabricWeight: "Intended light jersey. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended short leg and a supportive pouch. A finished sample has not been measured.",
    care: CARE,
    sustainability: PLANNED,
    colors: [CHARCOAL, SAND],
    sizes: MEN,
  },
  {
    slug: "tide-dress-sock",
    name: "Tide Dress Sock, Three Pack",
    shortDescription: "Sand dress socks in a pack of three.",
    description: "A fine sock for the chino and the jean. The photograph is a folded still life in sand. No size in this pack is in inventory yet.",
    gender: "unisex",
    productType: "socks",
    categorySlug: "socks",
    line: "tide",
    priceMinor: 2800,
    compareAtMinor: null,
    image: "/images/lookbook/tide-socks.jpg",
    alt: "Folded sand dress socks on linen. Catalog still life.",
    featured: false,
    sortNewest: 25,
    picturedColor: "Sand",
    material: "Intended composition: cotton.",
    fabricWeight: "Intended fine gauge. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended mid-calf.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAND, NAVY],
    sizes: ["S", "M", "L"],
  },
  {
    slug: "dune-lounge-pant",
    name: "Dune Lounge Pant",
    shortDescription: "A sand pant for the boardwalk and the house.",
    description: "Dune is the softer line. The lounge pant is planned in cotton with a straight leg and a simple drawcord. The photograph shows sand with an ivory tee.",
    gender: "men",
    productType: "lounge",
    categorySlug: "lounge",
    line: "dune",
    priceMinor: 8800,
    compareAtMinor: null,
    image: "/images/lookbook/dune-lounge.jpg",
    alt: `Man in sand lounge pants and an ivory tee on a dune. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 45,
    picturedColor: "Sand",
    material: "Intended composition: cotton.",
    fabricWeight: "Intended French terry weight. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended relaxed straight leg.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAND],
    sizes: MEN,
  },
  {
    slug: "dune-shirt-dress",
    name: "Dune Shirt Dress",
    shortDescription: "An ivory linen shirt dress with a soft collar.",
    description: "The dress in the Coastal Collection. It is planned in linen, with covered buttons, sleeves that roll once, and a hem around mid-calf. The photograph shows ivory.",
    gender: "women",
    productType: "dress",
    categorySlug: "dresses",
    line: "dune",
    priceMinor: 16800,
    compareAtMinor: null,
    image: "/images/lookbook/dune-shirt-dress.jpg",
    alt: `Woman in an ivory linen shirt dress on a boardwalk. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 100,
    picturedColor: "Ivory",
    material: "Intended composition: linen.",
    fabricWeight: "Intended midweight linen. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended relaxed, with a collar and a front placket.",
    care: CARE,
    sustainability: PLANNED,
    colors: [IVORY, SAND],
    sizes: WOMEN,
  },
  {
    slug: "drift-coastal-jean",
    name: "Drift Coastal Jean",
    shortDescription: "A dark indigo straight jean.",
    description: "A straight jean planned for the Drift line, shown with an ivory crew. The wash in the photograph is dark indigo. No mill or dye house is on record yet.",
    gender: "women",
    productType: "jeans",
    categorySlug: "womens-denim",
    line: "drift",
    priceMinor: 13800,
    compareAtMinor: null,
    image: "/images/lookbook/drift-coastal-jean.jpg",
    alt: `Woman in indigo jeans and an ivory tee on a boardwalk. ${CAMPAIGN}`,
    featured: true,
    sortNewest: 50,
    picturedColor: "Indigo",
    material: "Intended composition: cotton denim.",
    fabricWeight: "Intended midweight denim. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended straight leg with a mid rise.",
    care: "Planned care is a cold wash, turned inside out, and a hang dry. The sewn-in label will control once a sample exists.",
    sustainability: PLANNED,
    colors: [INDIGO],
    sizes: WAIST_W,
  },
  {
    slug: "tide-womens-brief",
    name: "Tide Brief, Three Pack",
    shortDescription: "Ivory cotton briefs, folded, sold in a pack of three.",
    description: "Women's briefs in the Tide line, shown only as a folded still life. The photograph is ivory cotton with a plain waistband. They are not photographed on a body.",
    gender: "women",
    productType: "underwear",
    categorySlug: "womens-underwear",
    line: "tide",
    priceMinor: 3600,
    compareAtMinor: null,
    image: "/images/lookbook/tide-brief.jpg",
    alt: "Three folded ivory cotton briefs on linen. Catalog still life, not worn.",
    featured: false,
    sortNewest: 30,
    picturedColor: "Ivory",
    material: "Intended composition: cotton jersey.",
    fabricWeight: "Intended light jersey. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended moderate coverage. A finished sample has not been measured.",
    care: CARE,
    sustainability: PLANNED,
    colors: [IVORY, SAND],
    sizes: WOMEN,
  },
  {
    slug: "reef-linen-blouse",
    name: "Reef Linen Blouse",
    shortDescription: "A sand linen blouse with a soft collar.",
    description: "The women's piece in Reef. A linen blouse planned to tuck into a trouser, with sleeves that sit below the elbow. The photograph shows sand.",
    gender: "women",
    productType: "shirt",
    categorySlug: "shirts",
    line: "reef",
    priceMinor: 9800,
    compareAtMinor: null,
    image: "/images/lookbook/reef-linen-blouse.jpg",
    alt: `Woman in a sand linen blouse and sand trousers on a boardwalk. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 85,
    picturedColor: "Sand",
    material: "Intended composition: linen.",
    fabricWeight: "Intended shirting linen. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended relaxed, tucked in the photograph.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAND, IVORY],
    sizes: WOMEN,
  },
  {
    slug: "drift-sand-trouser",
    name: "Drift Sand Trouser",
    shortDescription: "A tailored sand trouser.",
    description: "The women's trouser in Drift, planned with a clean front and a straight leg. The photograph shows it with the Reef linen blouse. The same frame is used for that blouse.",
    gender: "women",
    productType: "pants",
    categorySlug: "pants",
    line: "drift",
    priceMinor: 11800,
    compareAtMinor: null,
    image: "/images/lookbook/drift-sand-trouser.jpg",
    alt: `Woman in a sand trouser and linen blouse on a boardwalk. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 40,
    picturedColor: "Sand",
    material: "Intended composition: cotton twill.",
    fabricWeight: "Intended twill. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended tailored straight leg.",
    care: CARE,
    sustainability: PLANNED,
    colors: [SAND, NAVY],
    sizes: WAIST_W,
  },
  {
    slug: "harbor-field-jacket",
    name: "Harbor Field Jacket",
    shortDescription: "An olive jacket over the shirt dress.",
    description: "A field jacket in Harbor, planned in cotton with flap pockets and a collar. The photograph shows olive over the ivory Dune shirt dress.",
    gender: "women",
    productType: "outerwear",
    categorySlug: "outerwear",
    line: "harbor",
    priceMinor: 22800,
    compareAtMinor: null,
    image: "/images/lookbook/harbor-field-jacket.jpg",
    alt: `Woman in an olive field jacket on a boardwalk. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 96,
    picturedColor: "Olive",
    material: "Intended composition: cotton canvas.",
    fabricWeight: "Intended canvas. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended regular, worn open or closed over a dress.",
    care: CARE,
    sustainability: PLANNED,
    colors: [OLIVE],
    sizes: WOMEN,
  },
  {
    slug: "reef-womens-tee",
    name: "Reef Pima Tee",
    shortDescription: "The same crew idea, cut for the women's line.",
    description: "A plain ivory pima tee in Reef, shown with sand chinos. The neck is clean and the hem is straight. Ivory is the color in the photograph.",
    gender: "women",
    productType: "tee",
    categorySlug: "tees",
    line: "reef",
    priceMinor: 4800,
    compareAtMinor: null,
    image: "/images/lookbook/reef-womens-tee.jpg",
    alt: `Woman in an ivory tee and sand chinos on a boardwalk. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 65,
    picturedColor: "Ivory",
    material: "Intended composition: pima cotton jersey.",
    fabricWeight: "Intended midweight jersey. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended regular fit.",
    care: CARE,
    sustainability: PLANNED,
    colors: [IVORY, NAVY],
    sizes: WOMEN,
  },
  {
    slug: "drift-indigo-jean",
    name: "Drift Indigo Jean",
    shortDescription: "A dark straight jean for the men's line.",
    description: "The men's jean in Drift. The photograph is a walk on the dune in dark indigo, with the Reef crew. No wash recipe or mill is on record yet.",
    gender: "men",
    productType: "jeans",
    categorySlug: "mens-denim",
    line: "drift",
    priceMinor: 14800,
    compareAtMinor: null,
    image: "/images/lookbook/drift-indigo-jean.jpg",
    alt: `Man walking in indigo jeans and an ivory tee on a dune. ${CAMPAIGN}`,
    featured: false,
    sortNewest: 55,
    picturedColor: "Indigo",
    material: "Intended composition: cotton denim.",
    fabricWeight: "Intended midweight denim. Not yet measured on a finished sample.",
    fabricOrigin: "Not recorded yet.",
    fit: "Intended straight leg.",
    care: "Planned care is a cold wash, turned inside out, and a hang dry. The sewn-in label will control once a sample exists.",
    sustainability: PLANNED,
    colors: [INDIGO],
    sizes: WAIST_M,
  },
  {
    slug: "reef-weekday-kit",
    name: "Reef Weekday Kit",
    shortDescription: "Crew, chino, and socks at one planned kit price.",
    description: "A folded kit: the Reef Pima Crew, the Drift Stretch Chino, and the Tide Dress Sock. The planned kit price is $168. Bought separately at the planned prices, those three add to $204.",
    gender: "unisex",
    productType: "bundle",
    categorySlug: "bundles",
    line: "reef",
    priceMinor: 16800,
    compareAtMinor: 20400,
    image: "/images/lookbook/reef-weekday-kit.jpg",
    alt: "Folded ivory tee, sand chino, and sand socks on linen. Catalog still life of the planned weekday kit.",
    featured: false,
    sortNewest: 20,
    picturedColor: "Ivory",
    material: "Intended compositions are listed on the crew, the chino, and the sock.",
    fabricWeight: "See the three pieces in the kit.",
    fabricOrigin: "Not recorded yet.",
    fit: "The kit is planned in one shared size label across the tee, the chino waist, and the sock.",
    care: CARE,
    sustainability: PLANNED,
    colors: [IVORY],
    sizes: MEN,
    includes: ["reef-pima-crew", "drift-stretch-chino", "tide-dress-sock"],
  },
];

export function getLookbookProduct(slug: string): LookbookProduct | null {
  return LOOKBOOK.find((item) => item.slug === slug) ?? null;
}

export function filterLookbook(query: LookbookQuery): LookbookProduct[] {
  if (query.availability === "in") return [];
  let items = LOOKBOOK.slice();
  if (query.featured) items = items.filter((item) => item.featured);
  if (query.gender === "men" || query.gender === "women") {
    items = items.filter((item) => item.gender === query.gender || item.gender === "unisex");
  } else if (query.gender) {
    items = items.filter((item) => item.gender === query.gender);
  }
  if (query.productType) items = items.filter((item) => item.productType === query.productType);
  if (query.category) items = items.filter((item) => item.categorySlug === query.category);
  if (query.collection) {
    const key = query.collection.toLowerCase();
    items = items.filter((item) => item.line === key || item.categorySlug === key);
  }
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    if (q) items = items.filter((item) => `${item.name} ${item.shortDescription}`.toLowerCase().includes(q));
  }
  if (query.size) {
    const size = query.size.trim().toLowerCase();
    items = items.filter((item) => item.sizes.some((label) => label.toLowerCase() === size));
  }
  if (query.color) {
    const color = query.color.trim().toLowerCase();
    items = items.filter((item) => item.colors.some((swatch) => swatch.name.toLowerCase().includes(color)));
  }
  if (query.material) {
    const material = query.material.trim().toLowerCase();
    items = items.filter((item) => item.material.toLowerCase().includes(material));
  }
  if (query.min !== undefined) items = items.filter((item) => item.priceMinor >= query.min!);
  if (query.max !== undefined) items = items.filter((item) => item.priceMinor <= query.max!);
  if (query.sort === "price-asc") items.sort((a, b) => a.priceMinor - b.priceMinor);
  else if (query.sort === "price-desc") items.sort((a, b) => b.priceMinor - a.priceMinor);
  else if (query.sort === "newest") items.sort((a, b) => b.sortNewest - a.sortNewest);
  else items.sort((a, b) => Number(b.featured) - Number(a.featured) || b.sortNewest - a.sortNewest);
  return items;
}
