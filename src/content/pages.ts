export const BRAND = {
  name: "Sea Turtle Apparel",
  tagline: "Wear the Change. Protect Our Oceans.",
  support: "Premium Style. Responsible Choices. A Healthier Planet.",
  heroTitle: "The Coastal Collection",
  heroText: "Cotton, linen, and denim for the water’s edge. Styles and prices in the lookbook are planned. A sourcing record is published when it exists.",
  mission: `Fashion should make people feel good without making the planet pay the price.

At Sea Turtle Apparel, we believe that the clothes we wear can represent something greater than style. They can represent respect for the ocean, responsibility toward the land, cleaner manufacturing, and a commitment to the life we share this planet with.

Our goal is to create exceptional clothing through carefully selected materials, responsible manufacturing partners, transparent sourcing, and continuous environmental improvement.

We love sea turtles and believe that protecting marine life is part of protecting our shared future. Through responsible business practices and our commitment to supporting sea turtle conservation, we want to help create a world where fashion, nature, and human progress can thrive together.

One garment at a time, one better decision at a time, we believe a healthier planet is possible.`,
};

export type PageCopy = {
  title: string;
  description: string;
  kicker: string;
  paragraphs: string[];
};

const draft = "This page is a working statement for the brand. It is not a legal opinion, a certification, or a claim that a program has already been completed.";

export const PAGES: Record<string, PageCopy> = {
  about: {
    title: "About Us",
    description: "Sea Turtle Apparel is a premium clothing brand building a more responsible way to make and wear clothes.",
    kicker: "The house",
    paragraphs: [
      "Sea Turtle Apparel designs men's and women's clothing for people who want quality that can last, and a company willing to show its work.",
      "The business is led by an environmentally conscious managing director. A portrait, name, and biography will be published only after the owner approves them. Until then, this page will not invent a personal history.",
      BRAND.mission,
    ],
  },
  mission: {
    title: "Our Mission",
    description: "The founding statement of Sea Turtle Apparel.",
    kicker: "Why we exist",
    paragraphs: [BRAND.mission, "We will publish progress when it is measured. We will not describe a plan as a finished result."],
  },
  sustainability: {
    title: "Sustainability",
    description: "How Sea Turtle Apparel approaches materials, manufacturing, waste, water, and honest environmental claims.",
    kicker: "Our commitment",
    paragraphs: [
      "Responsibility here means specific practices: choosing materials with documented origins, working with manufacturing partners that can be reviewed, reducing textile waste, and treating water, energy, and chemicals as things that must be managed.",
      "A product page will show a claim only with an evidence level: verified third-party record, supplier-reported information, internal measurement, estimate, planned work, or not yet available.",
      "We do not describe the collection as carbon neutral, zero impact, ocean safe, or 100 percent sustainable. Those phrases are blocked in public traceability copy.",
      "The Dhaka factory is a plan. It is not presented as certified, audited, or operating until records are entered and approved.",
    ],
  },
  sourcing: {
    title: "Responsible Sourcing",
    description: "How suppliers are reviewed before Sea Turtle Apparel calls them vetted.",
    kicker: "Suppliers",
    paragraphs: [
      "Suppliers move through pending, under review, approved, conditional, suspended, or rejected. A supplier is described as vetted in public only after an authorized staff review.",
      "Reviews look at labor practices and worker safety, environmental management, wastewater, chemicals, water, energy, emissions, waste, restricted substances, composition accuracy, and traceability documents.",
      "Supplier prices, private contacts, and sensitive audit files stay off the public site. Demonstration supplier records are not production partners.",
    ],
  },
  manufacturing: {
    title: "Manufacturing and Traceability",
    description: "The garment journey Sea Turtle Apparel intends to document, and what is still missing.",
    kicker: "From fiber to finished piece",
    paragraphs: [
      "A public trace, when a batch is approved, can show raw material, fiber and fabric processing, dyeing and finishing, garment making, quality inspection, packaging, and shipment.",
      "Each stage states whether the information is verified, supplier-reported, measured, estimated, planned, or unavailable.",
      "The primary manufacturing operation is planned for a high-standard factory in Dhaka, Bangladesh. Until permits, audits, and performance records are approved, the facility remains planned and unverified.",
      "QR codes are generated only for published trace records.",
    ],
  },
  conservation: {
    title: "Sea Turtle Conservation",
    description: "Why sea turtles matter to the brand, and how contributions will be accounted for.",
    kicker: "Our commitment to sea turtles",
    paragraphs: [
      "Sea turtles depend on nesting beaches, coastal water, and open ocean that are already under pressure from habitat loss, bycatch, plastic, warming seas, and artificial light. Protecting them is part of protecting the ocean systems people also rely on.",
      "Responsible manufacturing matters here because wastewater, chemical discharge, and plastic waste can reach rivers and coasts. Cleaner production is not a donation. It is a separate duty.",
      "Sea Turtle Apparel plans to contribute to sea turtle conservation as the business grows. The rate, basis, products, and recipient can be configured. Accrued amounts, approved amounts, and amounts actually paid are stored separately.",
      "No conservation payment is claimed on this website unless a payment record and supporting evidence exist. No partnership with a named organization is claimed until that organization is recorded as active and approved for public display.",
      "Buying a garment is a purchase from the company. It is not, by itself, a charitable donation by the customer.",
    ],
  },
  impact: {
    title: "Impact and Progress",
    description: "Published progress will come from recorded measurements, not from estimates presented as results.",
    kicker: "What we can show",
    paragraphs: [
      "Impact reports will list what was measured, who measured it, the period, and what is still unknown.",
      "Until the first approved report is published, there is no public impact total, no donated amount, and no factory performance figure.",
      draft,
    ],
  },
  "size-guide": {
    title: "Size Guide",
    description: "How to read Sea Turtle Apparel sizes, and where garment measurements will appear.",
    kicker: "Fit",
    paragraphs: [
      "Alpha sizes and waist sizes are labels. The measurement that matters is the garment measurement published on the product, when the team has recorded it.",
      "The chart below is an illustrative starting point for development. It is not a certified international sizing standard and it is not a promise that every style matches these numbers.",
      "If a product has no measurements yet, the page says so. Do not guess a fit from the photograph.",
    ],
  },
  "fabric-care": {
    title: "Fabric and Care",
    description: "How to read composition and care instructions, and why care extends the life of a garment.",
    kicker: "Materials",
    paragraphs: [
      "Composition, fabric weight, and fiber origin appear on a product only when they have been entered. Empty fields stay empty.",
      "Washing less often, washing cold when the care label allows it, and repairing instead of replacing are practical ways to keep a garment in use.",
      "Care symbols on a future garment label control. This page does not replace that label.",
    ],
  },
  shipping: {
    title: "Shipping and Delivery",
    description: "How shipping methods, destinations, and delivery estimates are configured.",
    kicker: "Delivery",
    paragraphs: [
      "Shipping price is calculated on the server from the method you select, the destination, and the weight of the variants in the cart.",
      "A day range is shown only when that method has a configured estimate. If no range is configured, we do not invent one.",
      "Domestic Bangladesh delivery and international shipping can both be configured. Destinations that are not on an active method are declined at checkout.",
      "Demonstration shipping rates are hidden in production.",
    ],
  },
  returns: {
    title: "Returns and Exchanges",
    description: "How returns will work, including hygiene rules for underwear.",
    kicker: "After the order",
    paragraphs: [
      "Return windows, fees, and exchanges will follow the published returns policy and the consumer law that applies to the destination.",
      "Underwear and other hygiene-sensitive goods may be refused for return once a hygiene seal is removed, where the law allows that exception. If the law gives the customer a stronger right, the law controls.",
      "A return is not complete until the order status and any refund are recorded. Refunds are not marked paid back until the payment record changes.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Sea Turtle Apparel handles account, order, and message data.",
    kicker: "Privacy",
    paragraphs: [
      draft,
      "We store the account details you submit, order snapshots, addresses, support messages, and newsletter status. We do not store raw card numbers or card security codes.",
      "Payment data is handled by the configured payment provider. Order totals are calculated on our server and checked again when a signed webhook arrives.",
      "You can request access, correction, export, or deletion from your account once you are signed in. A request is recorded. It is completed by staff, and completion is a separate status.",
      "Optional analytics cookies are not loaded before you accept them. The cart cookie is essential to guest checkout.",
      "A public business address and contact email will be added when the owner publishes them. This draft does not invent them.",
    ],
  },
  terms: {
    title: "Terms and Conditions",
    description: "The working terms for shopping with Sea Turtle Apparel.",
    kicker: "Terms",
    paragraphs: [
      draft,
      "A product is offered when it is active and the selected variant has stock that the server can reserve. Prices, tax, shipping, and discounts shown in the browser are previews. The order total is the total stored when the order is created.",
      "Placing an order does not transfer ownership of a garment until payment is confirmed by the payment provider and recorded on the order.",
      "Demonstration products cannot be sold on the production store.",
      "These terms should be reviewed by counsel in each market where the company sells, including Bangladesh, before they are treated as final.",
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    description: "The policy behind delivery charges, restrictions, and tracking.",
    kicker: "Policy",
    paragraphs: [
      draft,
      "Charges come from active shipping methods. Free shipping applies only when a method has a threshold and the merchandise total after discounts meets it.",
      "Tracking numbers are added by staff when a shipment is created. A tracking number is not estimated.",
      "Risk and title transfer should be confirmed with counsel for each destination. This draft does not choose a legal rule.",
    ],
  },
  "returns-policy": {
    title: "Returns and Refund Policy",
    description: "The working policy for returns, hygiene goods, and refunds.",
    kicker: "Policy",
    paragraphs: [
      draft,
      "Refund status is one of: not refunded, partially refunded, or fully refunded. A browser return from a payment page does not create a refund.",
      "Underwear may be excluded from change-of-mind returns after the hygiene seal is broken, subject to applicable law.",
      "Faulty or misdescribed goods are handled separately from change-of-mind returns. The exact statutory rights depend on the customer's country and have not been hard-coded as a single worldwide rule.",
    ],
  },
  cookies: {
    title: "Cookie Preferences",
    description: "Which cookies Sea Turtle Apparel uses and how to change your choice.",
    kicker: "Cookies",
    paragraphs: [
      "The cart cookie keeps a guest basket. It is essential and is not used for advertising.",
      "A short-lived confirmation cookie lets you open the order you just placed without exposing that order to anyone who only knows the order number.",
      "Authentication cookies are set by Supabase Auth when you sign in.",
      "Optional analytics stay off until you accept them in the cookie notice. Rejecting them does not block shopping.",
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    description: "The accessibility target for the Sea Turtle Apparel website.",
    kicker: "Access",
    paragraphs: [
      "The site is being built toward WCAG 2.2 AA: semantic headings, keyboard access, visible focus, labeled fields, and text that meets contrast on the ivory and navy palette.",
      "If a page blocks you, use the contact form and describe the page and the assistive technology you use. We do not publish a response-time promise until the support team sets one.",
      "Motion is reduced when your system asks for reduced motion. Video is not set to autoplay with sound.",
    ],
  },
  contact: {
    title: "Contact",
    description: "Send a message to Sea Turtle Apparel.",
    kicker: "Customer service",
    paragraphs: [
      "A public phone number, office address, and contact email have not been published by the owner. This page will not invent them.",
      "Use the form. Messages are stored when the database is connected, and a support ticket is opened for staff.",
      "If the database is not connected, the form tells you the message was not stored.",
    ],
  },
};

export const FAQ = [
  { q: "Are the photographs of the factory or of current production?", a: "No. Campaign photographs are provisional and labeled as such. They are not pictures of a certified factory, staff, conservation partners, or finished production samples unless a product record says so." },
  { q: "Are the Coastal Collection pieces in stock?", a: "The house lookbook shows planned styles and planned retail prices while the catalog database is offline. Those pieces are not reserved stock, and they cannot be added to a bag until inventory is connected." },
  { q: "Is the Dhaka factory certified?", a: "No certification is claimed. The facility is planned. Certifications appear only after a record is verified." },
  { q: "Does my purchase donate money to a charity?", a: "No. A purchase is a sale to Sea Turtle Apparel. Conservation contributions, if configured, are company contributions. Accrued is not the same as paid." },
  { q: "Can I check out as a guest?", a: "Yes. You can also create an account. Guest order details require the tracking token from checkout, not only the order number." },
  { q: "When is an order paid?", a: "When a signed payment notification matches the order amount and currency. Returning from a payment page is not proof of payment." },
  { q: "Can I return underwear?", a: "Hygiene rules may limit returns after a seal is removed, where the law allows. Stronger consumer rights still apply." },
];

export const COLLECTIONS = [
  { href: "/pants", title: "Pants", image: "/images/lookbook/drift-chino.jpg", alt: "Man in a sand chino and ivory shirt on a dune. Campaign photograph for the planned Drift Stretch Chino." },
  { href: "/shirts", title: "Shirts", image: "/images/lookbook/harbor-overshirt.jpg", alt: "Man in a sage overshirt on a dune. Campaign photograph for the planned Harbor Coast Overshirt." },
  { href: "/underwear", title: "Underwear", image: "/images/lookbook/tide-boxer.jpg", alt: "Folded charcoal cotton boxer briefs on linen. Catalog still life, not worn." },
  { href: "/outerwear", title: "Outerwear", image: "/images/lookbook/harbor-chore-jacket.jpg", alt: "Man in a navy chore jacket on a dune. Campaign photograph for the planned Harbor Chore Jacket." },
  { href: "/dresses", title: "Dresses", image: "/images/lookbook/dune-shirt-dress.jpg", alt: "Woman in an ivory linen shirt dress on a boardwalk. Campaign photograph for the planned Dune Shirt Dress." },
  { href: "/bundles", title: "Bundles", image: "/images/lookbook/reef-weekday-kit.jpg", alt: "Folded ivory tee, sand chino, and sand socks. Catalog still life of the planned weekday kit." },
] as const;

export const LINE_LINKS = [
  { href: "/collections/reef", title: "Reef", text: "Cotton and linen for every day." },
  { href: "/collections/drift", title: "Drift", text: "Pants and denim." },
  { href: "/collections/tide", title: "Tide", text: "Underwear and socks, shown folded." },
  { href: "/collections/harbor", title: "Harbor", text: "Polos, shirts, and jackets." },
  { href: "/collections/dune", title: "Dune", text: "Lounge clothes and the shirt dress." },
] as const;

export const NAV = [
  { href: "/new", label: "New" },
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/underwear", label: "Underwear" },
  { href: "/bundles", label: "Bundles" },
  { href: "/shop", label: "Shop All" },
];
