const form = document.querySelector("#tripForm");
const builder = document.querySelector("#builder");
const result = document.querySelector("#result");
const destinationInput = document.querySelector("#destination");
const destinationError = document.querySelector("#destinationError");
const knownDestinationList = document.querySelector("#knownDestinationList");
const clearDestinationButton = document.querySelector("#clearDestinationButton");
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
const wishListInput = document.querySelector("#wishList");
const dateError = document.querySelector("#dateError");
const preferenceError = document.querySelector("#preferenceError");
const suggestionBoard = document.querySelector("#suggestionBoard");
const selectionCount = document.querySelector("#selectionCount");

function brandIconSource() {
  return window.PLANTOGUIDE_ICON_BASE64 ? `data:image/svg+xml;base64,${window.PLANTOGUIDE_ICON_BASE64}` : "plan-x-guide-centered-compass-morph-clean-x.svg";
}

function brandIconAnimationSource() {
  if (!window.PLANTOGUIDE_ICON_BASE64) return `plan-x-guide-centered-compass-morph-clean-x.svg?animation=${Date.now()}-${Math.random()}`;
  return URL.createObjectURL(new Blob([base64ToBytes(window.PLANTOGUIDE_ICON_BASE64)], { type: "image/svg+xml" }));
}

function releaseBrandIconSource(source, delay = 6000) {
  if (source?.startsWith("blob:")) window.setTimeout(() => URL.revokeObjectURL(source), delay);
}

function hydrateBrandIcons() {
  document.querySelectorAll('img[src^="plan-x-guide-centered-compass-morph-clean-x.svg"]').forEach((image) => {
    const source = brandIconAnimationSource();
    image.src = source;
    releaseBrandIconSource(source);
  });
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = brandIconSource();
}

hydrateBrandIcons();

const destinationCatalogs = [
  {
    match: /tokyo|japan/i,
    banner: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1800&q=82",
    zones: [
      { name: "Asakusa & Ueno", icon: "⛩️", keywords: ["asakusa", "ueno", "taito", "senso", "nakamise"] },
      { name: "Shibuya & Harajuku", icon: "🌆", keywords: ["shibuya", "harajuku", "aoyama", "jingumae", "omotesando", "meiji"] },
      { name: "Ginza & Central Tokyo", icon: "🗼", keywords: ["ginza", "chuo", "chūō", "tsukiji", "marunouchi", "imperial", "tokyo station"] },
      { name: "Tokyo Bay & Minato", icon: "🌉", keywords: ["tokyo bay", "odaiba", "minato", "teamlab", "nishiazabu", "tokyo tower", "zojoji"] },
      { name: "Akihabara & East Tokyo", icon: "🎮", keywords: ["akihabara", "chiyoda", "electronics", "anime", "ueno"] }
    ],
    attractions: [
      place("Sensō-ji and Nakamise-dori", "Asakusa", "Begin at Kaminarimon, explore the temple grounds, then browse the historic shopping street."),
      place("Meiji Jingu and Harajuku", "Shibuya", "Pair the wooded shrine approach with Takeshita Street and Omotesando."),
      place("Shibuya Crossing and Shibuya Sky", "Shibuya", "See the crossing at street level, then reserve a skyline time slot near sunset."),
      place("Tsukiji Outer Market", "Chūō", "Go early for seafood, tamagoyaki, and compact market lanes."),
      place("Tokyo National Museum and Ueno Park", "Ueno", "Allow several hours for Japanese art, history, and a park walk."),
      place("teamLab Planets and Odaiba waterfront", "Tokyo Bay", "Reserve the immersive museum, then continue to the bay for evening views."),
      place("Imperial Palace East Gardens", "Marunouchi", "Walk the gardens and finish around Tokyo Station’s restored red-brick frontage."),
      place("Tokyo Tower and Zojoji Temple", "Minato", "Combine a classic observation landmark with the neighboring temple grounds.")
    ],
    food: {
      breakfast: [
        place("Tsukiji Outer Market", "Chūō", "A lively maze of seafood, produce, and specialty counters best visited early.", { address: "4 Chome Tsukiji, Chuo City, Tokyo 104-0045", rating: "4.2", order: "Tamagoyaki, tuna donburi, grilled scallops, or seasonal sashimi" }),
        place("Onigiri Asakusa Yadoroku", "Asakusa", "A tiny, traditional counter devoted to carefully made rice balls.", { address: "3 Chome-9-10 Asakusa, Taito City, Tokyo 111-0032", rating: "4.3", order: "Salmon, kombu, or ume onigiri with miso soup" }),
        place("Pelican Café", "Asakusa", "A relaxed café showcasing the neighborhood bakery’s famous bread.", { address: "2 Chome-5-3 Kotobuki, Taito City, Tokyo 111-0042", rating: "4.1", order: "Charcoal toast, ham cutlet sandwich, and coffee" })
      ],
      lunch: [
        place("Uobei Shibuya Dogenzaka", "Shibuya", "Fast, approachable sushi delivered directly to your seat by express lane.", { address: "2 Chome-29-11 Dogenzaka, Shibuya, Tokyo 150-0043", rating: "4.3", order: "Tuna, salmon, seared nigiri, and seasonal specials" }),
        place("Afuri Harajuku", "Harajuku", "A modern ramen stop known for fragrant citrus-forward broth.", { address: "1 Chome-1-7 Jingumae, Shibuya, Tokyo 150-0001", rating: "4.3", order: "Yuzu shio ramen or yuzu ratanmen" }),
        place("Maisen Aoyama", "Aoyama", "A Tokyo tonkatsu institution in a memorable converted bathhouse.", { address: "4 Chome-8-5 Jingumae, Shibuya, Tokyo 150-0001", rating: "4.4", order: "Kurobuta pork loin or tenderloin tonkatsu set" })
      ],
      dinner: [
        place("Gonpachi Nishi-Azabu", "Minato", "A theatrical, high-energy izakaya with a broad menu for groups.", { address: "1 Chome-13-11 Nishiazabu, Minato City, Tokyo 106-0031", rating: "4.1", order: "Yakitori, handmade soba, and assorted tempura" }),
        place("Sushi no Midori Ginza", "Ginza", "Generous, well-known sushi sets; expect queues and check reservations.", { address: "7 Chome-2 Ginza, Chuo City, Tokyo 104-0061", rating: "4.3", order: "Chef’s nigiri set, fatty tuna, and conger eel" }),
        place("Omoide Yokocho", "Shinjuku", "An atmospheric lane of tiny independent yakitori and noodle counters.", { address: "1 Chome-2 Nishishinjuku, Shinjuku City, Tokyo 160-0023", rating: "4.1", order: "Yakitori assortment, motsuyaki, and a cold beer" })
      ]
    },
    shopping: [
      place("Ginza", "Chūō", "Tokyo’s polished retail district: begin at the Ginza 4-chome crossing, compare historic department stores, then browse stationery and basement food halls.", { address: "Ginza 4-chome Crossing, Chuo City, Tokyo 104-0061", bestFor: "Luxury flagships, Japanese stationery, beauty, and gourmet gifts" }),
      place("Shibuya and Harajuku", "Shibuya", "A fashion circuit linking Shibuya’s vertical malls with Cat Street, Takeshita Street, and Omotesando design stores.", { address: "Shibuya Station to Jingumae, Shibuya City, Tokyo", bestFor: "Youth fashion, sneakers, vintage clothing, and character goods" }),
      place("Akihabara", "Chiyoda", "Explore Chuo-dori and its side streets for electronics megastores, specialist hobby floors, arcades, and collectibles.", { address: "Akihabara Station, Sotokanda, Chiyoda City, Tokyo 101-0021", bestFor: "Electronics, anime, games, models, and retro technology" })
    ],
    practical: {
      emergencyNumbers: "Police 110 · Fire / Ambulance 119",
      touristHotline: "Japan Visitor Hotline (JNTO, 24h) 050-3816-2787",
      nearestEmbassy: "Needs verification — depends on your nationality; ask your AI to add your embassy in Tokyo",
      hospitalOrClinic: "Needs verification — English-friendly clinic near your home base",
      transitTips: "Get a Suica or Pasmo IC card (physical or in your phone wallet) for trains, subways, buses, and convenience stores.",
      tipping: "Tipping is not customary in Japan and can cause confusion; excellent service is standard.",
      keyPhrases: ["Sumimasen — excuse me / sorry", "Arigatou gozaimasu — thank you", "Eigo no menyuu wa arimasu ka? — do you have an English menu?"],
      notes: ""
    }
  },
  {
    match: /paris|france/i,
    banner: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place("Eiffel Tower and Champ de Mars", "7th arrondissement", "Reserve timed entry or enjoy the best ground-level views from Trocadéro."),
      place("Louvre Museum", "1st arrondissement", "Book ahead and choose a focused collection route rather than attempting every gallery."),
      place("Île de la Cité and Sainte-Chapelle", "Central Paris", "Pair stained glass with a Seine walk and views of Notre-Dame."),
      place("Montmartre and Sacré-Cœur", "18th arrondissement", "Climb through village-like streets and stay for the city panorama."),
      place("Musée d’Orsay", "7th arrondissement", "See Impressionist highlights inside the landmark former railway station."),
      place("Le Marais", "3rd–4th arrondissements", "Mix historic lanes, Place des Vosges, galleries, and cafés."),
      place("Luxembourg Gardens and the Latin Quarter", "5th–6th arrondissements", "A relaxed garden start followed by bookshops and old university streets."),
      place("Arc de Triomphe and Champs-Élysées", "8th arrondissement", "Climb for a geometric city view, then walk the avenue.")
    ],
    food: {
      breakfast: [place("Du Pain et des Idées", "10th arrondissement", "Celebrated pastries and escargot-shaped viennoiseries."), place("Café de Flore", "Saint-Germain", "Classic café breakfast in a storied setting."), place("Holybelly", "10th arrondissement", "Popular modern breakfast plates and coffee.")],
      lunch: [place("L’As du Fallafel", "Le Marais", "Famous falafel pita; expect a lively queue."), place("Bouillon Chartier", "9th arrondissement", "Historic, value-minded French classics."), place("Breizh Café", "Le Marais", "Highly regarded Breton crêpes and galettes.")],
      dinner: [place("Le Relais de l’Entrecôte", "Saint-Germain", "Known for steak-frites and its signature sauce."), place("Chez Janou", "Le Marais", "Provençal dishes and an energetic neighborhood atmosphere."), place("Bistrot Paul Bert", "11th arrondissement", "A classic Paris bistro experience; reserve ahead.")]
    },
    shopping: [place("Galeries Lafayette Haussmann", "9th arrondissement", "Fashion, beauty, gourmet gifts, and a celebrated glass dome."), place("Le Marais", "3rd–4th arrondissements", "Independent boutiques, vintage shops, design, and French labels."), place("Marché aux Puces de Saint-Ouen", "Saint-Ouen", "A vast antiques and vintage market best explored with time.")]
  },
  {
    match: /london|england|united kingdom|\buk\b/i,
    banner: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place("Westminster Abbey and Big Ben", "Westminster", "Start early, tour the abbey, and walk the Thames toward the London Eye."),
      place("Tower of London and Tower Bridge", "Tower Hill", "Allow a half day for the Crown Jewels, walls, and riverside views."),
      place("British Museum", "Bloomsbury", "Choose priority galleries and pair the visit with nearby literary streets."),
      place("Buckingham Palace and St James’s Park", "Westminster", "Check ceremonial schedules and continue through the royal parks."),
      place("Tate Modern and the South Bank", "Bankside", "Combine modern art, Millennium Bridge, and a riverside evening walk."),
      place("Borough Market and Southwark Cathedral", "London Bridge", "Visit hungry, sample market traders, then explore the historic riverfront."),
      place("Notting Hill and Portobello Road", "West London", "Colorful streets, antiques, independent shops, and café stops."),
      place("Greenwich", "Southeast London", "Take the river route for the observatory, park views, and maritime history.")
    ],
    food: {
      breakfast: [place("Dishoom Covent Garden", "Covent Garden", "Popular Bombay-inspired breakfast; the bacon naan is a signature."), place("The Wolseley", "Mayfair", "Grand European-style breakfast and polished service."), place("Regency Café", "Westminster", "A classic no-frills English breakfast institution.")],
      lunch: [place("Borough Market", "Southwark", "Choose among renowned street-food and produce traders."), place("Padella", "London Bridge", "Popular handmade pasta; join the queue early."), place("Flat Iron", "Soho", "Approachable steak in a central, casual setting.")],
      dinner: [place("Dishoom Shoreditch", "Shoreditch", "Atmospheric Bombay café dishes made for sharing."), place("Hawksmoor Seven Dials", "Covent Garden", "British steakhouse favorite; reserve ahead."), place("The Mayflower", "Rotherhithe", "Historic Thames-side pub with traditional British dishes.")]
    },
    shopping: [place("Oxford Street and Regent Street", "West End", "Major flagships, department stores, and classic central London retail."), place("Covent Garden", "West End", "Beauty, fashion, market stalls, and design-led boutiques."), place("Camden Market", "Camden", "Alternative fashion, crafts, vintage goods, and global street food.")]
  },
  {
    match: /new york|nyc|manhattan/i,
    banner: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place("Statue of Liberty and Ellis Island", "New York Harbor", "Reserve ferry tickets and begin early to make time for both islands."),
      place("Central Park and The Metropolitan Museum of Art", "Upper East Side", "Pair a scenic park route with a focused Met collection plan."),
      place("Times Square and a Broadway show", "Midtown", "See the lights briefly, then make the theater performance the centerpiece."),
      place("High Line and Chelsea Market", "West Side", "Walk the elevated park and stop for food before continuing toward Hudson Yards."),
      place("9/11 Memorial and One World Observatory", "Lower Manhattan", "Leave reflective time at the memorial and reserve the observatory."),
      place("Brooklyn Bridge and DUMBO", "Brooklyn", "Walk toward Brooklyn for skyline views, waterfront parks, and cobblestone streets."),
      place("Museum of Modern Art", "Midtown", "Focus on modern-art icons, then explore Rockefeller Center nearby."),
      place("Greenwich Village and Washington Square", "Downtown", "Wander brownstone streets, music history, cafés, and independent shops.")
    ],
    food: {
      breakfast: [place("Russ & Daughters Café", "Lower East Side", "Bagels, smoked fish, and New York appetizing traditions."), place("Daily Provisions", "Multiple locations", "Excellent breakfast sandwiches, pastries, and crullers."), place("Clinton St. Baking Company", "Lower East Side", "Famous pancakes and classic brunch plates.")],
      lunch: [place("Katz’s Delicatessen", "Lower East Side", "Iconic pastrami sandwiches and old-school deli atmosphere."), place("Los Tacos No. 1", "Chelsea Market", "Popular adobada and carne asada tacos."), place("Joe’s Pizza", "Greenwich Village", "A classic quick New York slice.")],
      dinner: [place("Gramercy Tavern", "Flatiron", "Celebrated seasonal American cooking; reserve ahead."), place("Keen’s Steakhouse", "Midtown", "Historic steakhouse known for mutton chop and old New York character."), place("Via Carota", "West Village", "Beloved Italian neighborhood cooking with frequent waits.")]
    },
    shopping: [place("Fifth Avenue", "Midtown", "Landmark flagships, luxury retail, and department stores."), place("SoHo", "Lower Manhattan", "Fashion flagships, design shops, and cobblestone streets."), place("Chelsea Market and Artists & Fleas", "Chelsea", "Food gifts, local makers, art, and independent vendors.")]
  },
  {
    match: /rome|italy/i,
    banner: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place("Colosseum and Roman Forum", "Centro Storico", "Reserve timed entry and allow a half day for the archaeological core."),
      place("Vatican Museums and St Peter’s Basilica", "Vatican City", "Book the earliest practical museum slot and dress for basilica entry."),
      place("Pantheon and Piazza Navona", "Centro Storico", "Connect two classics through atmospheric lanes and fountains."),
      place("Trevi Fountain and Spanish Steps", "Central Rome", "Visit early or late to avoid peak crowds."),
      place("Trastevere", "West bank", "Explore lanes, churches, and a long Roman dinner."),
      place("Borghese Gallery and Villa Borghese", "Pinciano", "Reserve the museum’s fixed entry and follow with a park walk."),
      place("Appian Way and the Catacombs", "Southeast Rome", "Rent a bicycle or take a guided route through ancient countryside."),
      place("Capitoline Museums", "Capitoline Hill", "See classical sculpture and one of the best Forum viewpoints.")
    ],
    food: {
      breakfast: [place("Sant’Eustachio Il Caffè", "Pantheon", "Espresso and a cornetto near the historic center."), place("Roscioli Caffè", "Campo de’ Fiori", "Pastries, coffee, and excellent savory breakfast options."), place("Pasticceria Regoli", "Esquilino", "Traditional Roman pastries and maritozzi.")],
      lunch: [place("Pizzarium Bonci", "Vatican area", "Renowned pizza al taglio with rotating toppings."), place("Forno Campo de’ Fiori", "Centro Storico", "Roman bakery slices and simple market-area lunch."), place("Trapizzino", "Trastevere", "Roman stews tucked into triangular pizza pockets.")],
      dinner: [place("Da Enzo al 29", "Trastevere", "Popular Roman classics; arrive before opening and expect a queue."), place("Flavio al Velavevodetto", "Testaccio", "Traditional carbonara, amatriciana, and cacio e pepe."), place("Armando al Pantheon", "Pantheon", "Historic Roman trattoria; reservations are essential.")]
    },
    shopping: [place("Via del Corso", "Central Rome", "Accessible fashion brands along a major historic route."), place("Via dei Condotti", "Spanish Steps", "Rome’s best-known luxury shopping street."), place("Porta Portese Market", "Trastevere", "Large Sunday market for vintage goods, clothing, and curiosities.")]
  },
  {
    match: /lisbon|portugal/i,
    banner: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place("Belém Tower and Jerónimos Monastery", "Belém", "Reserve the monastery and combine both landmarks with the riverfront."),
      place("Alfama and São Jorge Castle", "Historic center", "Climb through old lanes, viewpoints, and tiled façades."),
      place("Praça do Comércio and Baixa", "Baixa", "Walk the grand riverfront square, Rua Augusta, and downtown grid."),
      place("Sintra day trip", "Sintra", "Book Pena Palace early and limit the day to two major sights."),
      place("Tram 28 route and Graça viewpoints", "Central hills", "Ride outside peak hours and use the route to connect hilltop neighborhoods."),
      place("LX Factory", "Alcântara", "Creative shops, restaurants, street art, and the famous bookshop."),
      place("Calouste Gulbenkian Museum", "Avenidas Novas", "An excellent art collection surrounded by peaceful gardens."),
      place("Time Out Market and Cais do Sodré", "Mercado da Ribeira", "Sample Lisbon flavors, then walk the waterfront at sunset.")
    ],
    food: {
      breakfast: [place("Pastéis de Belém", "Belém", "The classic custard tart near the monastery."), place("Manteigaria", "Chiado", "Warm pastéis de nata made throughout the day."), place("Dear Breakfast", "Multiple locations", "Popular modern brunch and coffee.")],
      lunch: [place("Time Out Market", "Cais do Sodré", "Many prominent Lisbon kitchens in one convenient hall."), place("O Trevo", "Chiado", "Famous bifana pork sandwiches."), place("Cervejaria Ramiro", "Intendente", "Celebrated seafood; reserve or expect a wait.")],
      dinner: [place("Taberna da Rua das Flores", "Chiado", "Creative Portuguese small plates with limited seating."), place("Prado", "Baixa", "Seasonal Portuguese cooking in a stylish room."), place("A Cevicheria", "Príncipe Real", "Popular seafood-focused menu with Portuguese-Peruvian influence.")]
    },
    shopping: [place("A Vida Portuguesa", "Chiado", "Well-designed traditional Portuguese household goods and gifts."), place("Feira da Ladra", "Alfama", "Lisbon’s famous flea market for antiques and curiosities."), place("Embaixada", "Príncipe Real", "Portuguese designers and concept stores inside a landmark palace.")]
  },
  {
    match: /honolulu|oahu|hawaii/i,
    banner: "https://images.unsplash.com/photo-1507876466758-bc54f384809c?auto=format&fit=crop&w=1800&q=82",
    zones: [
      { name: "Waikiki & Diamond Head", icon: "\uD83C\uDF0A", keywords: ["waikiki", "diamond head", "kapahulu"] },
      { name: "Downtown Honolulu", icon: "\uD83C\uDFDB\uFE0F", keywords: ["downtown", "iolani", "chinatown", "kakaako"] },
      { name: "East Oahu", icon: "\uD83C\uDF34", keywords: ["hanauma", "koko", "lanikai", "kailua"] },
      { name: "North Shore", icon: "\uD83C\uDFC4", keywords: ["haleiwa", "north shore", "waimea", "sunset beach"] }
    ],
    attractions: [
      place("Waikiki Beach", "Waikiki", "Walk the beachfront, take a surf lesson, and stay for sunset near Kuhio Beach."),
      place("Diamond Head State Monument", "Diamond Head", "Reserve the required entry window and hike early for cooler weather and coastal views."),
      place("Pearl Harbor National Memorial", "Pearl Harbor", "Reserve the USS Arizona program and allow time for the visitor center exhibits."),
      place("Iolani Palace and Historic Honolulu", "Downtown", "Tour the royal residence, then walk to the State Capitol and Kawaiahao Church."),
      place("Hanauma Bay Nature Preserve", "East Oahu", "Book the required reservation and arrive early for snorkeling and reef education."),
      place("Manoa Falls Trail", "Manoa", "Follow a lush valley trail to the waterfall and expect muddy conditions after rain."),
      place("Kakaako murals and waterfront", "Kakaako", "Explore public art, local cafes, and the nearby waterfront parks."),
      place("Haleiwa and the North Shore", "North Shore", "Plan a full-day loop for surf beaches, food trucks, and historic Haleiwa town.")
    ],
    food: {
      breakfast: [place("Koko Head Cafe", "Kaimuki", "Island-inspired brunch plates in a lively neighborhood setting."), place("Island Vintage Coffee", "Waikiki", "Coffee, acai bowls, and convenient breakfast near the beach."), place("Liliha Bakery", "Honolulu", "A local institution known for coco puffs and classic diner breakfasts.")],
      lunch: [place("Ono Seafood", "Kapahulu", "A compact neighborhood stop known for fresh poke bowls."), place("Helena's Hawaiian Food", "Kalihi", "Traditional Hawaiian dishes including pipikaula, kalua pig, and poi."), place("Rainbow Drive-In", "Kapahulu", "A classic plate-lunch counter near Waikiki.")],
      dinner: [place("The Pig and the Lady", "Chinatown", "Modern Vietnamese-influenced cooking in Honolulu's arts district."), place("House Without a Key", "Waikiki", "Sunset dining with Hawaiian music and ocean views."), place("Mud Hen Water", "Kaimuki", "Creative local cooking designed for sharing.")]
    },
    shopping: [place("Ala Moana Center", "Ala Moana", "A major open-air shopping center with local brands, luxury stores, and extensive dining."), place("International Market Place", "Waikiki", "Central Waikiki shopping with a historic banyan tree and evening dining."), place("Haleiwa town", "North Shore", "Browse surf shops, galleries, local gifts, and small boutiques.")]
  },
  {
    match: /vancouver|british columbia|\bbc\b/i,
    banner: "https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=1800&q=82",
    zones: [
      { name: "Downtown & Stanley Park", icon: "\uD83C\uDF32", keywords: ["downtown", "stanley", "coal harbour", "west end"] },
      { name: "Gastown & Chinatown", icon: "\uD83D\uDD70\uFE0F", keywords: ["gastown", "chinatown", "water street"] },
      { name: "Granville Island & Kitsilano", icon: "\uD83C\uDFA8", keywords: ["granville", "kitsilano", "false creek"] },
      { name: "North Shore", icon: "\u26F0\uFE0F", keywords: ["grouse", "capilano", "north vancouver", "lynn canyon"] }
    ],
    attractions: [
      place("Stanley Park Seawall", "West End", "Walk or cycle the waterfront loop with stops at Totem Poles and Prospect Point."),
      place("Granville Island Public Market", "False Creek", "Browse market stalls, artisan studios, and waterfront dining."),
      place("Gastown and the waterfront", "Gastown", "Explore Water Street, heritage architecture, and the harbor edge."),
      place("Capilano Suspension Bridge Park", "North Vancouver", "Cross the suspension bridge and explore elevated forest walkways; book ahead in busy periods."),
      place("Grouse Mountain", "North Vancouver", "Ride the gondola for city views, seasonal trails, and mountain activities."),
      place("Museum of Anthropology at UBC", "University Endowment Lands", "See Indigenous art and architecture in a striking coastal setting."),
      place("Queen Elizabeth Park", "Little Mountain", "Visit landscaped gardens and one of the best elevated city viewpoints."),
      place("English Bay and Kitsilano Beach", "West Side", "Link two popular waterfront areas for sunset and skyline views.")
    ],
    food: {
      breakfast: [place("Cafe Medina", "Downtown", "Mediterranean-inspired brunch and signature waffles."), place("Jam Cafe", "Downtown", "Generous comfort-food breakfasts; expect a queue."), place("49th Parallel Cafe", "Mount Pleasant", "Vancouver-roasted coffee, pastries, and breakfast sandwiches.")],
      lunch: [place("Granville Island Public Market", "False Creek", "Build a casual lunch from seafood, bakery, and produce vendors."), place("Japadog", "Downtown", "Japanese-inspired hot dogs and a quick Vancouver classic."), place("Phnom Penh", "Chinatown", "Popular Cambodian-Vietnamese dishes including chicken wings and butter beef.")],
      dinner: [place("Miku", "Coal Harbour", "Aburi sushi with waterfront views; reservations recommended."), place("Vij's", "Cambie Village", "Celebrated Indian cooking and warm hospitality."), place("Kissa Tanto", "Chinatown", "Italian-Japanese dishes in an atmospheric room; reserve well ahead.")]
    },
    shopping: [place("Robson Street", "Downtown", "Major brands, Canadian retailers, and easy access to central Vancouver."), place("Main Street", "Mount Pleasant", "Independent fashion, vintage shops, records, and local design."), place("Granville Island artisan studios", "False Creek", "Locally made art, jewelry, food gifts, and crafts.")]
  },
  {
    match: /seattle|washington state|puget sound/i,
    banner: "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1800&q=82",
    zones: [
      { name: "Downtown & Pike Place", icon: "\uD83D\uDC1F", keywords: ["pike", "downtown", "waterfront", "belltown"] },
      { name: "Seattle Center & Queen Anne", icon: "\uD83D\uDDFC\uFE0F", keywords: ["space needle", "seattle center", "queen anne", "chihuly"] },
      { name: "Capitol Hill & Central District", icon: "\uD83C\uDFB6", keywords: ["capitol hill", "central district", "volunteer park"] },
      { name: "Ballard & Fremont", icon: "\u26F5", keywords: ["ballard", "fremont", "locks", "gas works"] }
    ],
    attractions: [
      place("Pike Place Market", "Downtown", "Explore produce stalls, specialty shops, crafts, and the waterfront-facing market levels."),
      place("Space Needle and Chihuly Garden and Glass", "Seattle Center", "Reserve timed entry and combine both landmarks in one visit."),
      place("Museum of Pop Culture", "Seattle Center", "Explore music, film, games, and Pacific Northwest creative culture."),
      place("Seattle Waterfront and ferry ride", "Elliott Bay", "Walk the renovated waterfront and take a ferry for skyline views from the water."),
      place("Ballard Locks and fish ladder", "Ballard", "Watch boats pass between lake and sound and check for seasonal salmon."),
      place("Museum of Flight", "Georgetown", "Allow several hours for historic aircraft, space exhibits, and aviation stories."),
      place("Kerry Park", "Queen Anne", "Visit near sunset for a classic skyline view with Mount Rainier on clear days."),
      place("Gas Works Park and Fremont", "Lake Union", "Pair industrial park scenery with Fremont's public art and neighborhood shops.")
    ],
    food: {
      breakfast: [place("Storyville Coffee", "Pike Place", "Coffee and pastries overlooking the market."), place("Tilikum Place Cafe", "Belltown", "European-style brunch known for Dutch babies."), place("Portage Bay Cafe", "South Lake Union", "Hearty breakfast plates and a popular toppings bar.")],
      lunch: [place("Pike Place Chowder", "Pike Place", "Award-winning chowders in the market; lines move quickly."), place("Un Bien", "Ballard", "Caribbean sandwiches with slow-roasted pork and bright sauces."), place("Marination Ma Kai", "West Seattle", "Hawaiian-Korean plates with skyline views across Elliott Bay.")],
      dinner: [place("The Pink Door", "Pike Place", "Italian-American dining hidden along Post Alley; reserve ahead."), place("Walrus and the Carpenter", "Ballard", "Oysters and seasonal small plates in a compact space."), place("Canlis", "Queen Anne", "A landmark fine-dining experience with views; reservations required.")]
    },
    shopping: [place("Pike Place Market craft stalls", "Downtown", "Local makers, specialty foods, flowers, and Seattle gifts."), place("Ballard Avenue", "Ballard", "Independent boutiques, outdoor brands, records, and home goods."), place("Capitol Hill shops", "Capitol Hill", "Books, music, vintage fashion, and locally owned specialty stores.")]
  }
];

const knownDestinations = [
  { label: "Tokyo, Japan", aliases: ["tokyo", "tokyo japan"] },
  { label: "Japan", aliases: ["japan"] },
  { label: "Paris, France", aliases: ["paris", "paris france"] },
  { label: "France", aliases: ["france"] },
  { label: "London, United Kingdom", aliases: ["london", "london uk", "london england", "london united kingdom"] },
  { label: "United Kingdom", aliases: ["uk", "united kingdom", "england", "great britain"] },
  { label: "New York City, United States", aliases: ["new york", "new york city", "nyc", "new york usa", "new york united states", "manhattan"] },
  { label: "Rome, Italy", aliases: ["rome", "rome italy"] },
  { label: "Italy", aliases: ["italy"] },
  { label: "Lisbon, Portugal", aliases: ["lisbon", "lisbon portugal"] },
  { label: "Portugal", aliases: ["portugal"] },
  { label: "Honolulu, Hawaii", aliases: ["honolulu", "honolulu hawaii", "waikiki"] },
  { label: "Oahu, Hawaii", aliases: ["oahu", "oahu hawaii"] },
  { label: "Vancouver, Canada", aliases: ["vancouver", "vancouver canada", "vancouver british columbia", "vancouver bc"] },
  { label: "Seattle, Washington", aliases: ["seattle", "seattle washington", "seattle wa"] }
];

let trip = null;
let activeDay = 0;
let activeTab = "home";
let weatherRenderVersion = 0;
const liveWeatherCache = new Map();
const selectedSuggestions = new Map();
const suggestionImageCache = new Map();
let suggestionLookup = new Map();
let suggestionDestination = "";
let dayBannerRenderVersion = 0;
let suggestionGroups = [];
let activeSuggestionCategory = 0;
let currentFormStep = 1;
let lastExportHtml = "";
let lastStandaloneHtml = "";
let focusedPhotoId = "";

const today = new Date();
const defaultStart = new Date(today.getFullYear(), today.getMonth() + 1, 8);
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 13);
startDateInput.value = toInputDate(defaultStart);
endDateInput.value = toInputDate(defaultEnd);

knownDestinationList.innerHTML = knownDestinations.map((destination) => `<option value="${destination.label}"></option>`).join("");
document.querySelectorAll(".form-progress [data-go-step]").forEach((stage) => {
  const openStage = () => navigateToWizardStep(Number(stage.dataset.goStep));
  stage.addEventListener("click", openStage);
  stage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openStage();
    }
  });
});
destinationInput.addEventListener("input", () => {
  destinationInput.setCustomValidity("");
  destinationError.textContent = "";
  updateDestinationClearButton();
});
destinationInput.addEventListener("change", normalizeSelectedDestination);
destinationInput.addEventListener("blur", () => {
  if (destinationInput.value.trim() && !resolveKnownDestination(destinationInput.value)) {
    destinationError.textContent = "This destination is not in the detailed browser catalog yet. We can still create an AI-ready planning file and starter website.";
  }
  updateDestinationClearButton();
});
clearDestinationButton?.addEventListener("click", () => {
  destinationInput.value = "";
  destinationInput.setCustomValidity("");
  destinationError.textContent = "";
  selectedSuggestions.clear();
  suggestionDestination = "";
  updateDestinationClearButton();
  destinationInput.focus();
});
startDateInput.addEventListener("change", () => {
  if (!startDateInput.value) return;
  const arriveDate = parseDate(startDateInput.value);
  const departDate = addDays(arriveDate, 7);
  endDateInput.value = toInputDate(departDate);
  dateError.textContent = "";
});

function updateDestinationClearButton() {
  if (!clearDestinationButton) return;
  clearDestinationButton.hidden = !destinationInput.value.trim();
}

function normalizeDestinationName(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function resolveKnownDestination(value) {
  const normalized = normalizeDestinationName(value);
  return knownDestinations.find((destination) => normalizeDestinationName(destination.label) === normalized || destination.aliases.some((alias) => normalizeDestinationName(alias) === normalized));
}

function normalizeSelectedDestination() {
  const match = resolveKnownDestination(destinationInput.value);
  if (!match) return false;
  destinationInput.value = match.label;
  destinationInput.setCustomValidity("");
  destinationError.textContent = "";
  return true;
}

function goToPreferencesStep() {
  if (!destinationInput.value.trim()) {
    destinationInput.reportValidity();
    return;
  }
  const knownDestination = resolveKnownDestination(destinationInput.value);
  if (knownDestination) {
    destinationInput.value = knownDestination.label;
    destinationError.textContent = "";
  } else {
    destinationError.textContent = "This destination is not in the detailed browser catalog yet. We can still create an AI-ready planning file and starter website.";
  }
  destinationInput.setCustomValidity("");
  if (!startDateInput.value || !endDateInput.value) {
    (startDateInput.value ? endDateInput : startDateInput).reportValidity();
    return;
  }
  const start = parseDate(startDateInput.value);
  const end = parseDate(endDateInput.value);
  if (end < start) {
    dateError.textContent = "Departure needs to be after arrival.";
    endDateInput.focus();
    return;
  }
  dateError.textContent = "";
  const nextDestination = destinationInput.value.trim();
  const previousDestination = (suggestionDestination || (trip && trip.destination) || "").trim().toLowerCase();
  if (previousDestination && previousDestination !== nextDestination.toLowerCase()) {
    selectedSuggestions.clear();
    wishListInput.value = "";
    preferenceError.textContent = "";
  }
  activeSuggestionCategory = 0;
  renderSuggestionPicker(nextDestination);
  showFormStep(2);
}
document.querySelector("#nextStepButton").addEventListener("click", goToPreferencesStep);

document.querySelector("#backStepButton").addEventListener("click", () => {
  if (activeSuggestionCategory > 0) {
    activeSuggestionCategory -= 1;
    renderSuggestionCategory();
    showFormStep(2);
  } else showFormStep(1);
});
document.querySelector("#detailsStepButton").addEventListener("click", () => {
  if (activeSuggestionCategory < 2) {
    activeSuggestionCategory += 1;
    renderSuggestionCategory();
    showFormStep(2);
    return;
  }
  if (!selectedSuggestions.size && !wishListInput.value.trim()) {
    preferenceError.textContent = "Choose at least one suggestion or tell us what interests you.";
    wishListInput.focus();
    return;
  }
  preferenceError.textContent = "";
  showFormStep(3);
});
document.querySelector("#detailsBackButton").addEventListener("click", () => {
  activeSuggestionCategory = 2;
  renderSuggestionCategory();
  showFormStep(2);
});
document.querySelector("#constraintsStepButton").addEventListener("click", () => showFormStep(4));
document.querySelector("#constraintsBackButton").addEventListener("click", () => showFormStep(3));
document.querySelector("#outputStepButton").addEventListener("click", () => showFormStep(5));
document.querySelector("#outputBackButton").addEventListener("click", () => showFormStep(4));
document.querySelector("#clearSelectionsButton").addEventListener("click", () => {
  selectedSuggestions.clear();
  suggestionBoard.querySelectorAll(".suggestion-bubble").forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  updateSelectionCount();
});
document.querySelector("#surpriseMeButton").addEventListener("click", () => {
  const start = parseDate(startDateInput.value);
  const end = parseDate(endDateInput.value);
  const tripDays = Math.min(Math.max(daysBetween(start, end) + 1, 1), 14);
  const selectionTargets = {
    see: Math.min(Math.max(tripDays, 3), 6),
    eat: Math.min(Math.max(Math.ceil(tripDays * .75), 3), 6),
    shop: Math.min(Math.max(Math.ceil(tripDays / 2), 2), 4)
  };
  selectedSuggestions.clear();
  Object.entries(selectionTargets).forEach(([category, count]) => {
    const choices = [...suggestionLookup.values()].filter((item) => item.category === category);
    for (let index = choices.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [choices[index], choices[randomIndex]] = [choices[randomIndex], choices[index]];
    }
    choices.slice(0, count).forEach((item) => selectedSuggestions.set(item.key, item));
  });
  suggestionBoard.querySelectorAll(".suggestion-bubble").forEach((button) => {
    const selected = selectedSuggestions.has(button.dataset.suggestionKey);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  preferenceError.textContent = "";
  updateSelectionCount();
  selectionCount.textContent = `${selectedSuggestions.size} selected for you`;
  showFormStep(3);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const start = parseDate(startDateInput.value);
  const end = parseDate(endDateInput.value);
  if (end < start) {
    dateError.textContent = "Departure needs to be after arrival.";
    endDateInput.focus();
    return;
  }
  dateError.textContent = "";
  if (!selectedSuggestions.size && !wishListInput.value.trim()) {
    preferenceError.textContent = "Choose at least one suggestion or tell us what interests you.";
    showFormStep(2);
    document.querySelector(".suggestion-bubble")?.focus();
    return;
  }
  preferenceError.textContent = "";
  const selections = [...selectedSuggestions.values()];
  const preferences = getTripPreferences();
  trip = buildTrip(destinationInput.value.trim(), start, end, wishListInput.value.trim(), selections, preferences);
  activeDay = 0;
  activeTab = "home";
  await showTripCreationTransition();
  builder.hidden = true;
  result.hidden = false;
  document.body.classList.add("trip-mode");
  renderTrip();
  switchAppTab("home");
  safeStorageSet("plantoguide-trip", JSON.stringify({ destination: destinationInput.value, start: startDateInput.value, end: endDateInput.value, wishes: wishListInput.value, selections, preferences }));
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#editTripButton").addEventListener("click", showBuilder);
document.querySelector("#newTripButton").addEventListener("click", () => {
  safeStorageRemove("plantoguide-trip");
  safeStorageRemove("x-travel-agent-trip");
  safeStorageRemove("x-travel-guide-trip");
  safeStorageRemove("roam-trip");
  form.reset();
  selectedSuggestions.clear();
  suggestionDestination = "";
  startDateInput.value = toInputDate(defaultStart);
  endDateInput.value = toInputDate(defaultEnd);
  showBuilder();
  destinationInput.focus();
});
document.querySelector("#printButton").addEventListener("click", printSelectedDayItinerary);
document.querySelector("#exportTripButton").addEventListener("click", exportTripPackage);
document.querySelector("#heroExportTripButton").addEventListener("click", exportTripPackage);
document.querySelector("#exportDialogClose").addEventListener("click", closeExportDialog);
document.querySelector("#exportDialogDone").addEventListener("click", closeExportDialog);
document.querySelector("#exportDownloadMarkdown").addEventListener("click", downloadTripMarkdown);
document.querySelector("#exportDownloadZip").addEventListener("click", exportTripPackage);
document.querySelector("#exportDownloadHtml").addEventListener("click", downloadStandaloneHtml);
document.querySelector("#exportCopyChatGpt").addEventListener("click", () => copyAiPrompt("ChatGPT"));
document.querySelector("#exportCopyClaude").addEventListener("click", () => copyAiPrompt("Claude"));
document.querySelector("#exportPreviewWebsite").addEventListener("click", previewExportWebsite);
document.querySelector("#downloadMarkdownButton").addEventListener("click", downloadTripMarkdown);
document.querySelector("#downloadHtmlButton").addEventListener("click", downloadStandaloneHtml);
document.querySelector("#copyMarkdownButton").addEventListener("click", () => copyText(createTripMarkdown(), "Markdown copied"));
document.querySelector("#copyChatGptButton").addEventListener("click", () => copyAiPrompt("ChatGPT"));
document.querySelector("#copyClaudeButton").addEventListener("click", () => copyAiPrompt("Claude"));
document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => switchAppTab(button.dataset.tab)));
document.querySelectorAll("[data-open-tab]").forEach((button) => button.addEventListener("click", () => switchAppTab(button.dataset.openTab)));
document.querySelector("#photoUploadInput").addEventListener("change", handlePhotoUploads);
document.querySelector("#addBookingEntry").addEventListener("click", () => addUserEntry("booking"));
document.querySelector("#addFoodEntry").addEventListener("click", () => addUserEntry("food"));
document.querySelector("#addShopEntry").addEventListener("click", () => addUserEntry("shop"));

function showBuilder() {
  result.hidden = true;
  builder.hidden = false;
  document.body.classList.remove("trip-mode");
  showFormStep(1);
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function closeExportDialog() {
  const dialog = document.querySelector("#exportDialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

async function exportTripPackage() {
  if (!trip) return;
  const exportButton = document.querySelector("#exportTripButton");
  const originalLabel = exportButton.textContent;
  exportButton.disabled = true;
  exportButton.classList.add("loading");
  exportButton.innerHTML = `<img src="${brandIconSource()}" alt="">Preparing…`;
  const slug = trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
  const savedDay = activeDay;
  const savedTab = activeTab;
  try {
    const captures = [];
    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex += 1) {
      activeDay = dayIndex;
      activeTab = "home";
      renderTrip();
      await waitForHydratedImages(document.querySelector(".trip-app"));
      const clone = document.querySelector(".trip-app").cloneNode(true);
      clone.querySelectorAll(
        "#exportTripButton,#editTripButton,.hero-export-button,.activity-menu,.photo-manager,.photo-remove-button,.photo-bottom-upload,.user-entry-manager"
      ).forEach((element) => element.remove());
      clone.querySelectorAll(".day-button").forEach((button, index) => button.dataset.exportDay = index);
      clone.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === "home"));
      clone.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === "home"));
      captures.push(clone.outerHTML);
    }
    let websiteHtml = createCapturedExportWebsite(captures);
    lastExportHtml = websiteHtml;
    const websiteCss = await collectExportStyles();
    if (!websiteCss.includes(".trip-app") || websiteCss.length < 10000) throw new Error("The complete report stylesheet could not be read. Please reload PlanToGuide and export again.");
    const bundled = await bundleExportImages(websiteHtml);
    websiteHtml = bundled.html;
    const markdown = createTripMarkdown();
    const runtime = createExportRuntime();
    const inlineIcon = `data:image/svg+xml;base64,${window.PLANTOGUIDE_ICON_BASE64 || ""}`;
    lastStandaloneHtml = websiteHtml.replaceAll("plan-x-guide-centered-compass-morph-clean-x.svg", inlineIcon).replace('<link rel="stylesheet" href="styles.css">', `<style>${websiteCss}</style>`).replace('<script src="app.js"><\/script>', `<script>${runtime}<\/script>`);
    const readme = `# ${trip.destination} PlanToGuide Website\n\nThis package contains the complete visual trip website and a round-trip AI planning workflow.\n\n## Files\n\n- \`index.html\` — complete visual itinerary website\n- \`styles.css\` — website presentation\n- \`app.js\` — exported navigation runtime\n- \`plan-x-guide-centered-compass-morph-clean-x.svg\` — animated PlanToGuide logo\n- \`assets/\` — bundled banners and place graphics, when available\n- \`TRIP-PLAN.md\` — lightweight human-readable plan plus photo metadata\n- \`TRIP-DATA.json\` — complete machine-readable trip, including local photo data\n- \`AGENT-INSTRUCTIONS.md\` — rules for continued AI planning\n- \`README.md\` — this publishing guide\n\n## Keep planning\n\n1. Give \`TRIP-PLAN.md\` to ChatGPT, Claude, or another AI assistant.\n2. Ask it to return the complete updated file, including the \`json plantoguide-trip\` block.\n3. In PlanToGuide, choose **Import updated plan** to re-render the website.\n4. Export a fresh package.\n\n## Publishing\n\nOpen \`index.html\` locally, drag the folder to Netlify Drop, or upload it to any static host such as GitHub Pages. Google Maps and remote images require an internet connection.\n`;
    const zip = createZip([
      { name: "index.html", content: websiteHtml },
      { name: "styles.css", content: websiteCss },
      { name: "app.js", content: runtime },
      { name: "TRIP-PLAN.md", content: markdown },
      { name: "TRIP-DATA.json", content: serializeTripJson(trip, { includePhotoData: true }) },
      { name: "AGENT-INSTRUCTIONS.md", content: createAgentInstructions(trip) },
      { name: "README.md", content: readme },
      { name: "plan-x-guide-centered-compass-morph-clean-x.svg", content: base64ToBytes(window.PLANTOGUIDE_ICON_BASE64 || "") },
      ...bundled.files
    ]);
    const url = URL.createObjectURL(zip);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-complete-travel-guide.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    const dialog = document.querySelector("#exportDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  } catch (error) {
    console.error("Export failed", error);
    window.alert(error?.message || "The website export could not be completed. Please reload and try again.");
  } finally {
    activeDay = savedDay;
    activeTab = savedTab;
    renderTrip();
    exportButton.disabled = false;
    exportButton.classList.remove("loading");
    exportButton.textContent = originalLabel;
  }
}

function createCapturedExportWebsite(capturedViews) {
  const templates = capturedViews.map((view, index) => `<template data-export-template="${index}">${view}</template>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101412"><title>${escapeHtml(trip.destination)} · PlanToGuide</title><link rel="icon" href="plan-x-guide-centered-compass-morph-clean-x.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600&display=swap" rel="stylesheet"><link rel="stylesheet" href="styles.css"></head><body class="trip-mode"><main class="page-shell"><section class="result">${capturedViews[0] || ""}</section></main>${templates}<script src="app.js"><\/script></body></html>`;
}

function waitForHydratedImages(root, timeout = 1800) {
  if (!root || !root.querySelector('[data-image-lookup="loading"]')) return Promise.resolve();
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (!root.querySelector('[data-image-lookup="loading"]') || Date.now() - started >= timeout) resolve();
      else setTimeout(check, 60);
    };
    check();
  });
}

async function collectExportStyles() {
  const localSheet = Array.from(document.styleSheets).find((sheet) => /styles\.css(?:\?|$)/.test(sheet.href || ""));
  if (localSheet?.href) {
    try {
      const response = await fetch(localSheet.href);
      if (response.ok) {
        const source = await response.text();
        if (source.includes(".trip-app") && source.length > 10000) return source;
      }
    } catch (_) { /* file:// exports fall back to the already-applied CSS rules below. */ }
  }
  const appliedRules = Array.from(document.styleSheets).map((sheet) => {
    try { return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n"); }
    catch (_) { return ""; }
  }).filter(Boolean).join("\n");
  if (appliedRules.includes(".trip-app") && appliedRules.length > 10000) return appliedRules;
  if (window.XTRAVEL_STYLES_GZIP_BASE64) {
    try {
      const source = await decompressBase64Gzip(window.XTRAVEL_STYLES_GZIP_BASE64);
      if (source.includes(".trip-app") && source.length > 10000) return source;
    } catch (_) { /* Continue through browser-readable stylesheet fallbacks. */ }
  }
  if (localSheet?.href) {
    try {
      const source = await readLocalTextAsset(localSheet.href);
      if (source.includes(".trip-app") && source.length > 10000) return source;
    } catch (_) { /* The caller reports a clear export error if all methods fail. */ }
  }
  return appliedRules;
}

async function decompressBase64Gzip(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

function base64ToBytes(value) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }

function readLocalTextAsset(url) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    const timer = setTimeout(() => { frame.remove(); reject(new Error("Stylesheet read timed out")); }, 3000);
    frame.onload = () => {
      try {
        const text = frame.contentDocument?.body?.innerText || frame.contentDocument?.documentElement?.textContent || "";
        clearTimeout(timer);
        frame.remove();
        resolve(text);
      } catch (error) {
        clearTimeout(timer);
        frame.remove();
        reject(error);
      }
    };
    frame.onerror = () => { clearTimeout(timer); frame.remove(); reject(new Error("Stylesheet read failed")); };
    frame.src = url;
    document.body.appendChild(frame);
  });
}

function createExportRuntime() {
  return `let currentDay=0,currentTab="home";const result=document.querySelector('.result');function showTab(name){currentTab=name;result.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));result.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));}function showDay(index){const next=Number(index)||0,template=document.querySelector('[data-export-template="'+next+'"]');if(!template)return;currentDay=next;result.replaceChildren(template.content.cloneNode(true));result.querySelectorAll('.day-button').forEach(b=>b.classList.toggle('active',Number(b.dataset.exportDay)===currentDay));showTab(currentTab);window.scrollTo({top:0,behavior:'smooth'});}document.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]');if(tab){showTab(tab.dataset.tab);return}const day=event.target.closest('[data-export-day]');if(day){showDay(day.dataset.exportDay);return}const open=event.target.closest('[data-open-tab]');if(open){showTab(open.dataset.openTab);return}const print=event.target.closest('.print-button');if(print)window.print()});showTab('home');`;
}

async function bundleExportImages(html) {
  const sourceDocument = new DOMParser().parseFromString(html, "text/html");
  const urls = new Set([trip.guide.banner]);
  sourceDocument.querySelectorAll("img").forEach((image) => { if (/^https?:/i.test(image.src)) urls.add(image.src); });
  sourceDocument.querySelectorAll("template").forEach((template) => template.content.querySelectorAll("img").forEach((image) => { if (/^https?:/i.test(image.src)) urls.add(image.src); }));
  const results = await Promise.all([...urls].map(async (source, index) => {
    try {
      const response = await fetch(source, { mode: "cors" });
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return null;
      const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : blob.type.includes("gif") ? "gif" : "jpg";
      return { source, path: `assets/place-${String(index + 1).padStart(2, "0")}.${extension}`, content: new Uint8Array(await blob.arrayBuffer()) };
    } catch (_) { return null; }
  }));
  const files = [];
  let updatedHtml = html;
  results.filter(Boolean).forEach(({ source, path, content }) => {
    files.push({ name: path, content });
    updatedHtml = updatedHtml.split(source).join(path).split(source.replaceAll("&", "&amp;")).join(path);
  });
  return { html: updatedHtml, files };
}

function createExportWebsite() {
  const dayNav = trip.days.map((day, index) => `<a href="#day-${index + 1}">${escapeHtml(formatDate(day.date, false))}</a>`).join("");
  const days = trip.days.map((day, dayIndex) => `<section class="day" id="day-${dayIndex + 1}"><header><p>${escapeHtml(formatDate(day.date, true))}</p><h2>${escapeHtml(day.title)}</h2></header>${day.activities.map((item) => `<article class="stop"><time>${escapeHtml(item.time)}</time><div><span>${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><a href="${googleMapsSearchUrl(cleanActivityTitle(item.title))}" target="_blank" rel="noopener">Google Maps details ↗</a></div></article>`).join("")}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(trip.destination)} Travel Guide · PlanToGuide</title><link rel="icon" href="plan-x-guide-centered-compass-morph-clean-x.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"></head><body><header class="hero" style="--banner:url('${trip.guide.banner}')"><p>PlanToGuide</p><h1>${escapeHtml(trip.destination)}</h1><span>${escapeHtml(formatDate(trip.start, true))} — ${escapeHtml(formatDate(trip.end, true))}</span></header><nav>${dayNav}</nav><main>${days}</main><footer>Exported from PlanToGuide · Verify live details before traveling.</footer></body></html>`;
}

function createExportStyles() {
  return `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Fraunces:wght@600&display=swap');*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:#1c1f26;background:#f5f1e8;font-family:'DM Sans',sans-serif}.hero{min-height:340px;display:flex;flex-direction:column;justify-content:end;padding:48px max(24px,calc((100% - 1000px)/2));color:white;background:linear-gradient(110deg,rgba(18,45,39,.88),rgba(22,55,48,.42)),var(--banner);background-position:center;background-size:cover}.hero p{margin:0 0 12px;color:#f5c84b;font-weight:700}.hero h1{margin:0;font:600 clamp(48px,8vw,90px)/1 'Fraunces',serif}.hero span{margin-top:14px}nav{position:sticky;top:0;z-index:2;display:flex;gap:8px;overflow:auto;padding:12px max(18px,calc((100% - 1000px)/2));background:#173e35}nav a{flex:none;padding:9px 13px;border-radius:999px;color:white;background:rgba(255,255,255,.12);font-size:12px;text-decoration:none}main{max-width:1000px;margin:auto;padding:36px 22px 70px}.day{margin-bottom:54px}.day>header{padding-bottom:14px;border-bottom:2px solid #24594c}.day>header p{margin:0;color:#8a6500;font-size:12px;font-weight:700}.day h2{margin:4px 0 0;font:600 32px 'Fraunces',serif}.stop{display:grid;grid-template-columns:72px 1fr;gap:18px;padding:22px 0;border-bottom:1px solid #d8d1c3}.stop time{color:#24594c;font-weight:700}.stop span{color:#8a6500;font-size:10px;font-weight:700;text-transform:uppercase}.stop h3{margin:4px 0 7px;color:#254b7a}.stop p{margin:0;color:#626c68;line-height:1.6}.stop a{display:inline-block;margin-top:9px;color:#24594c;font-size:12px;font-weight:700}footer{padding:24px;text-align:center;color:#69716f;background:#ece6da;font-size:12px}@media(max-width:600px){.hero{min-height:280px;padding:32px 20px}.stop{grid-template-columns:1fr;gap:6px}.day h2{font-size:26px}}`;
}

function createTripMarkdownBase() {
  const preferenceDetails = Object.entries(trip.preferences).filter(([, value]) => value).map(([key, value]) => `- **${titleCase(key)}:** ${value}`).join("\n");
  const researchChecklist = trip.researchMode ? `## Research Needed\n\n- Verify landmark names, current hours, closures, prices, and ticket requirements.\n- Research neighborhoods and optimize each day geographically.\n- Confirm restaurant cuisine, ratings, dietary fit, and reservation requirements.\n- Replace placeholder shopping and activity cards with verified choices.\n- Check transit times, weather, accessibility, and seasonal conditions.\n- Preserve all traveler-entered must-dos and confirmed bookings while refining the plan.` : "";
  const preferenceLines = [preferenceDetails, researchChecklist].filter(Boolean).join("\n\n");
  const selected = trip.selections.length ? trip.selections.map((item) => `- ${item.name}${item.area ? ` — ${item.area}` : ""}: ${item.detail}`).join("\n") : "- No manually selected places.";
  const locked = trip.bookings.length ? trip.bookings.map((item) => `- **${item.name}** — ${item.date || "date flexible"} — ${item.time || "time TBD"} — ${titleCase(item.status)}`).join("\n") : "- No locked bookings supplied.";
  const optional = trip.days.flatMap((day) => day.activities.filter((item) => /optional|backup/i.test(item.status || "")).map((item) => `- ${formatDate(day.date, false)} — ${item.title} — ${item.status}`)).join("\n") || "- No optional items marked.";
  const days = trip.days.map((day, index) => `## ${index + 1}. ${formatDate(day.date, true)} — ${day.title}\n\n**Area focus:** ${day.zone?.name || trip.destination}\n\n${day.activities.map((item) => `### ${item.time} — ${item.title}\n\n- Status: ${item.status || "Recommended"}\n- Type: ${item.type}\n- Details: ${item.description}\n- Google Maps: ${googleMapsSearchUrl(cleanActivityTitle(item.title))}`).join("\n\n")}`).join("\n\n---\n\n");
  const practical = trip.practical || createEmptyPracticalInfo(trip.destination);
  const practicalLines = [
    `- **Emergency numbers:** ${practical.emergencyNumbers || "Needs verification"}`,
    `- **Tourist hotline:** ${practical.touristHotline || "Needs verification"}`,
    `- **Nearest embassy / consulate:** ${practical.nearestEmbassy || "Needs verification"}`,
    `- **English-friendly hospital or clinic:** ${practical.hospitalOrClinic || "Needs verification"}`,
    `- **Transit tips:** ${practical.transitTips || "Needs verification"}`,
    `- **Tipping etiquette:** ${practical.tipping || "Needs verification"}`,
    practical.keyPhrases && practical.keyPhrases.length ? `- **Key phrases:** ${practical.keyPhrases.join("; ")}` : "- **Key phrases:** Needs verification — a few useful local phrases",
    practical.notes ? `- **Notes:** ${practical.notes}` : ""
  ].filter(Boolean).join("\n");
  const refinementLines = Array.isArray(trip.refinementInstructions) && trip.refinementInstructions.length
    ? trip.refinementInstructions.map((instruction) => `- ${instruction}`).join("\n")
    : "- No additional refinements selected.";
  return `# Trip Source of Truth\n\n> Exported from PlanToGuide. Use this as the authoritative planning context.\n\n## Trip Overview\n\n- **Destination:** ${trip.destination}\n- **Dates:** ${formatDate(trip.start, true)} through ${formatDate(trip.end, true)}\n- **Duration:** ${trip.days.length} days\n- **Travelers:** ${trip.preferences.groupSize || "Not specified"} · ages ${trip.preferences.travelerAges || "not specified"}\n- **Home base:** ${trip.preferences.homeBase || "Not specified"}\n- **Trip purpose:** ${trip.preferences.purpose || "Not specified"}\n- **Trip style:** ${trip.preferences.outputTemplate || "Mobile Trip App"}\n\n## Locked Bookings\n\nDo not move or remove confirmed items unless explicitly requested.\n\n${locked}\n\n## Optional Items\n\n${optional}\n\n## Food Preferences & Restrictions\n\n${trip.preferences.foodRestrictions || "None supplied."}\n\n## Mobility & Walking Constraints\n\n${trip.preferences.mobilityNeeds || "None supplied."}\n\n## Things to Avoid\n\n${trip.preferences.avoid || "None supplied."}\n\n## Traveler Preferences\n\n${preferenceLines || "- No additional preferences."}\n\n## Selected Priorities\n\n${selected}\n\n## Practical Info (verify and fill in)\n\nThe AI assistant should research and replace every "Needs verification" value below with verified, current details.\n\n${practicalLines}\n\n## AI Instructions\n\n1. Use this file as the source of truth.\n2. Preserve confirmed bookings and traveler-designated must-do activities.\n3. Optimize each day geographically around its stated area and home base.\n4. Warn when an activity adds unnecessary travel time.\n5. Verify current hours, prices, closures, ratings, reservations, and availability.\n6. Label uncertain browser-only suggestions as Needs verification.\n7. Never invent live facts.\n8. Research and fill the Practical Info section with verified details.\n9. **Return format (required):** reply with the COMPLETE updated version of this file — every heading above, your improved day-by-day plan, and an updated "Machine-Readable Trip Data" JSON block that exactly matches your revised plan (same schema, same field names, dates as YYYY-MM-DD).\n10. The traveler will import your JSON block back into PlanToGuide to re-render their trip website, so the JSON block must be complete and valid.\n\n---\n\n${days}\n\n---\n\n## Machine-Readable Trip Data\n\nDo not remove this section. Update it to match any changes you make above. PlanToGuide's "Import updated plan" feature reads this block.\n\n${TRIP_JSON_FENCE_OPEN}\n${serializeTripJson(trip)}\n\`\`\`\n`;
}

function createTripMarkdown() {
  const base = createTripMarkdownBase();
  const refinements = Array.isArray(trip.refinementInstructions) && trip.refinementInstructions.length
    ? trip.refinementInstructions.map((instruction) => `- ${instruction}`).join("\n")
    : "- No additional refinements selected.";
  const section = `## Requested Refinements\n\nApply every selected improvement below while preserving confirmed bookings, must-do items, dates, and traveler constraints.\n\n${refinements}\n\n`;
  return base.replace("## Practical Info (verify and fill in)", `${section}## Practical Info (verify and fill in)`);
}

function downloadTripMarkdown() {
  if (!trip) return;
  const blob = new Blob([createTripMarkdown()], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "trip"}-source-of-truth.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
function aiPrompt(platform) { return `Continue planning this trip in ${platform}. Treat the Markdown below as the source of truth. Preserve confirmed bookings, optimize geographically, research and verify live facts (hours, prices, closures, reservations, emergency and practical info), and ask before changing locked items.\n\nIMPORTANT — return format: reply with the COMPLETE updated TRIP-PLAN.md file, keeping every heading, and update the fenced \`\`\`json plantoguide-trip block at the end so it exactly matches your revised plan (same schema and field names, dates as YYYY-MM-DD). I will import that JSON block back into PlanToGuide to re-render my trip website, so it must be complete and valid.\n\n${createTripMarkdown()}`; }
async function copyText(text, confirmation = "Copied") { try { await navigator.clipboard.writeText(text); window.alert(confirmation); } catch (_) { window.prompt("Copy this text:", text); } }
function copyAiPrompt(platform) { if (trip) copyText(aiPrompt(platform), `${platform} prompt copied`); }
function previewExportWebsite() {
  if (!lastStandaloneHtml) return window.alert("Export the website once before previewing it.");
  const url = URL.createObjectURL(new Blob([lastStandaloneHtml], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function downloadStandaloneHtml() {
  if (!lastStandaloneHtml) return window.alert("Use Export once to prepare the complete website, then download the standalone HTML.");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lastStandaloneHtml], { type: "text/html;charset=utf-8" }));
  link.download = `${trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "trip"}-travel-website.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function createZip(files) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = file.content instanceof Uint8Array ? file.content : encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x0800, true); view.setUint16(8, 0, true); view.setUint16(10, dosTime, true); view.setUint16(12, dosDate, true); view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, name.length, true); view.setUint16(28, 0, true); local.set(name, 30);
    chunks.push(local, data);
    const record = new Uint8Array(46 + name.length);
    const centralView = new DataView(record.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x0800, true); centralView.setUint16(10, 0, true); centralView.setUint16(12, dosTime, true); centralView.setUint16(14, dosDate, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true); centralView.setUint16(28, name.length, true); centralView.setUint16(30, 0, true); centralView.setUint16(32, 0, true); centralView.setUint16(34, 0, true); centralView.setUint16(36, 0, true); centralView.setUint32(38, 0, true); centralView.setUint32(42, offset, true); record.set(name, 46);
    central.push(record);
    offset += local.length + data.length;
  });
  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(4, 0, true); endView.setUint16(6, 0, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true); endView.setUint32(12, centralSize, true); endView.setUint32(16, offset, true); endView.setUint16(20, 0, true);
  return new Blob([...chunks, ...central, end], { type: "application/zip" });
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function showFormStep(stepNumber) {
  currentFormStep = stepNumber;
  builder.classList.toggle("builder-wide", stepNumber > 1);
  document.querySelectorAll("[data-form-step]").forEach((step) => {
    const active = Number(step.dataset.formStep) === stepNumber;
    step.hidden = !active;
    step.classList.toggle("active", active);
  });
  const displayedStep = stepNumber;
  document.querySelectorAll(".form-progress span").forEach((bar, index) => {
    bar.classList.toggle("active", index < displayedStep);
    bar.classList.toggle("current", index === displayedStep - 1);
    if (index === displayedStep - 1) bar.setAttribute("aria-current", "step");
    else bar.removeAttribute("aria-current");
  });
  document.querySelector("#formStepTitle").textContent = ["", "Trip basics", "Choose your adventure", "Travelers & style", "Bookings & constraints", "Output style"][stepNumber];
  document.querySelector("#formStepCount").textContent = `Step ${displayedStep} of 5`;
  forceWizardTop();
}

function forceWizardTop() {
  const reset = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    builder.scrollTop = 0;
    form.scrollTop = 0;
  };
  reset();
  requestAnimationFrame(() => { reset(); requestAnimationFrame(reset); });
}

function navigateToWizardStep(stepNumber) {
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 5) return;
  if (stepNumber === currentFormStep) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (stepNumber > 1 && currentFormStep === 1) {
    goToPreferencesStep();
    if (currentFormStep !== 2) return;
  }
  showFormStep(stepNumber);
}

async function showTripCreationTransition() {
  const overlay = document.querySelector("#tripCreationTransition");
  const logo = document.querySelector("#tripCreationLogo");
  overlay.hidden = false;
  overlay.classList.remove("finishing");
  document.body.classList.add("creating-trip");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  logo.removeAttribute("src");
  void logo.offsetWidth;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const animationSource = brandIconAnimationSource();
  logo.src = animationSource;
  await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 650 : 4300));
  overlay.classList.add("finishing");
  await new Promise((resolve) => setTimeout(resolve, 280));
  overlay.hidden = true;
  overlay.classList.remove("finishing");
  document.body.classList.remove("creating-trip");
  releaseBrandIconSource(animationSource, 0);
}

function getTripPreferences() {
  return {
    pace: document.querySelector("#tripPace").value,
    party: document.querySelector("#tripParty").value,
    start: document.querySelector("#dayStart").value,
    evening: document.querySelector("#eveningStyle").value,
    transport: document.querySelector("#transportStyle").value,
    budget: document.querySelector("#tripBudget").value,
    notes: document.querySelector("#mobilityNotes").value.trim(),
    homeBase: document.querySelector("#homeBase").value.trim(),
    groupSize: document.querySelector("#groupSize").value,
    travelerAges: document.querySelector("#travelerAges").value.trim(),
    purpose: document.querySelector("#tripPurpose").value.trim(),
    foodRestrictions: document.querySelector("#foodRestrictions").value.trim(),
    mobilityNeeds: document.querySelector("#mobilityNeeds").value.trim(),
    mustDos: document.querySelector("#mustDos").value.trim(),
    avoid: document.querySelector("#avoidList").value.trim(),
    bookedItems: document.querySelector("#bookedItems").value.trim(),
    outputTemplate: "complete",
    appMode: "free"
  };
}

function setTripPreferences(preferences = {}) {
  const fields = { tripPace: "pace", tripParty: "party", dayStart: "start", eveningStyle: "evening", transportStyle: "transport", tripBudget: "budget", mobilityNotes: "notes", homeBase: "homeBase", groupSize: "groupSize", travelerAges: "travelerAges", tripPurpose: "purpose", foodRestrictions: "foodRestrictions", mobilityNeeds: "mobilityNeeds", mustDos: "mustDos", avoidList: "avoid", bookedItems: "bookedItems" };
  Object.entries(fields).forEach(([id, key]) => { if (preferences[key]) document.querySelector(`#${id}`).value = preferences[key]; });
}

function renderSuggestionPicker(destination) {
  const normalizedDestination = destination.toLowerCase();
  if (suggestionDestination && suggestionDestination !== normalizedDestination) selectedSuggestions.clear();
  suggestionDestination = normalizedDestination;
  document.querySelector("#suggestionDestination").textContent = destination;
  suggestionGroups = createSuggestionGroups(destination);
  suggestionLookup = new Map(suggestionGroups.flatMap((group) => group.items.map((suggestion) => [suggestion.key, suggestion])));
  suggestionBoard.innerHTML = "";

  suggestionGroups.forEach((group, groupIndex) => {
    const section = document.createElement("section");
    section.className = "suggestion-group";
    section.dataset.suggestionCategory = groupIndex;
    section.hidden = groupIndex !== activeSuggestionCategory;
    section.innerHTML = `<div class="suggestion-group-heading"><span aria-hidden="true">${group.icon}</span><h3>${group.label}</h3><small>${group.items.length} ideas</small></div>`;
    const bubbles = document.createElement("div");
    bubbles.className = "suggestion-bubbles suggestion-card-list";
    group.items.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `suggestion-bubble${selectedSuggestions.has(suggestion.key) ? " selected" : ""}`;
      const meta = suggestion.category === "eat"
        ? [suggestion.cuisine || "Local and regional cuisine", suggestion.rating ? `Google rating: ${suggestion.rating}` : "Google rating: view live"]
        : suggestion.category === "shop"
          ? [suggestion.area, suggestion.bestFor || "Popular local shopping"]
          : [suggestion.area, "Popular place to see"];
      button.innerHTML = `<img class="suggestion-card-image" src="${escapeHtml(suggestion.image || suggestionImagePlaceholder(suggestion))}" alt="${escapeHtml(`${suggestion.name} in ${destination}`)}" loading="lazy"><span class="suggestion-card-body"><span class="suggestion-card-top"><strong>${escapeHtml(suggestion.name)}</strong><span class="suggestion-check">✓</span></span><span class="suggestion-card-meta">${meta.filter(Boolean).map(escapeHtml).join(" · ")}</span><span class="suggestion-card-detail">${escapeHtml(suggestion.detail)}</span><a class="suggestion-map-link" href="${googleMapsSearchUrl(`${suggestion.name} ${destination}`)}" target="_blank" rel="noopener noreferrer">Live data unavailable in browser-only mode · verify on Google Maps ↗</a></span>`;
      hydrateSuggestionImage(button.querySelector(".suggestion-card-image"), suggestion, destination);
      button.dataset.suggestionKey = suggestion.key;
      button.setAttribute("aria-pressed", selectedSuggestions.has(suggestion.key) ? "true" : "false");
      button.addEventListener("click", (event) => {
        if (event.target.closest(".suggestion-map-link")) return;
        if (selectedSuggestions.has(suggestion.key)) selectedSuggestions.delete(suggestion.key);
        else selectedSuggestions.set(suggestion.key, suggestion);
        const selected = selectedSuggestions.has(suggestion.key);
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        preferenceError.textContent = "";
        updateSelectionCount();
      });
      bubbles.appendChild(button);
    });
    section.appendChild(bubbles);
    suggestionBoard.appendChild(section);
  });
  renderSuggestionCategory();
  updateSelectionCount();
}

function renderSuggestionCategory() {
  const group = suggestionGroups[activeSuggestionCategory];
  if (!group) return;
  const descriptions = [
    "Choose landmarks, neighborhoods, museums, and experiences you would most like to see.",
    "Choose restaurants, markets, cafés, and local dishes you would like built into the route.",
    "Choose markets, shopping streets, boutiques, and specialty stores you want time to explore."
  ];
  document.querySelector("#adventureStepTitle").textContent = `Choose your own adventure · ${group.label}`;
  document.querySelector("#adventureStepCopy").textContent = descriptions[activeSuggestionCategory];
  suggestionBoard.querySelectorAll("[data-suggestion-category]").forEach((section) => {
    section.hidden = Number(section.dataset.suggestionCategory) !== activeSuggestionCategory;
  });
  updateSelectionCount();
}

function createSuggestionGroups(destination) {
  const guide = getDestinationGuide(destination);
  const seen = new Set();
  const inferCuisine = (item) => {
    const text = `${item.name} ${item.detail} ${item.order || ""}`.toLowerCase();
    if (/sushi|nigiri|sashimi/.test(text)) return "Sushi and Japanese";
    if (/ramen|noodle|soba/.test(text)) return "Japanese noodles";
    if (/bakery|pastr|bread|café|cafe|coffee|breakfast/.test(text)) return "Café and bakery";
    if (/french|bistro|bouillon|crêpe|galette/.test(text)) return "French";
    if (/italian|pasta|pizza|roman|trattoria/.test(text)) return "Italian";
    if (/seafood|fish|oyster|tuna/.test(text)) return "Seafood";
    if (/steak|tonkatsu|pork|yakitori|grill/.test(text)) return "Grill and meat specialties";
    if (/market|food hall|street food/.test(text)) return "Market and local specialties";
    return "Local and regional cuisine";
  };
  const toSuggestion = (item, category) => ({
    key: `${category}:${item.name.toLowerCase()}`,
    category,
    name: item.name,
    area: item.area,
    detail: item.detail,
    rating: item.rating || "",
    cuisine: item.cuisine || (category === "eat" ? inferCuisine(item) : ""),
    order: item.order || "",
    bestFor: item.bestFor || "",
    address: item.address || "",
    image: item.image || ""
  });
  const unique = (items, category) => items.map((item) => toSuggestion(item, category)).filter((item) => {
    const nameKey = item.name.toLowerCase();
    if (seen.has(nameKey)) return false;
    seen.add(nameKey);
    return true;
  });

  const see = unique(guide.attractions, "see");
  const eat = unique([...guide.food.breakfast, ...guide.food.lunch, ...guide.food.dinner], "eat");
  const shop = unique(guide.shopping, "shop");
  const zones = getDayZones(guide, destination, 8);
  const addDiscoveryIdeas = (target, category, templates, limit) => {
    let index = 0;
    let attempts = 0;
    while (target.length < limit && attempts < limit * 12) {
      const zone = zones[index % zones.length];
      const template = templates[index % templates.length];
      const item = toSuggestion(place(`${zone.name} ${template.name}`, zone.name, template.detail,
        category === "eat" ? { cuisine: template.meta } : category === "shop" ? { bestFor: template.meta } : {}), category);
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        target.push(item);
      }
      index += 1;
      attempts += 1;
    }
  };
  addDiscoveryIdeas(see, "see", [
    { name: "landmark walk", detail: "A compact route linking the neighborhood’s defining architecture, public spaces, and most-photographed viewpoints." },
    { name: "museum or cultural highlight", detail: "A well-reviewed cultural stop that explains the area’s art, history, or contemporary identity." },
    { name: "park and scenic viewpoint", detail: "A popular outdoor pause chosen for atmosphere, photography, and a broader sense of the district." }
  ], 20);
  addDiscoveryIdeas(eat, "eat", [
    { name: "top-rated local restaurant", detail: "A highly reviewed neighborhood option; use the live Maps listing to compare current rating, hours, and reservations.", meta: "Regional cuisine" },
    { name: "popular casual lunch", detail: "A busy local favorite suited to the day’s route, with a shorter service time and a signature neighborhood dish.", meta: "Casual local cuisine" },
    { name: "specialty café or bakery", detail: "A well-liked coffee, pastry, or dessert stop that works naturally between nearby sights.", meta: "Café and bakery" }
  ], 20);
  addDiscoveryIdeas(shop, "shop", [
    { name: "independent shopping street", detail: "A walkable cluster of local boutiques and small businesses rather than a single isolated store.", meta: "Local fashion, design, books, and gifts" },
    { name: "market and specialty shops", detail: "A popular place to browse regional products and useful souvenirs while staying inside the day’s neighborhood.", meta: "Food gifts, crafts, and regional specialties" },
    { name: "design and vintage district", detail: "A neighborhood shopping circuit known for distinctive independent finds and browsing.", meta: "Vintage, design, and independent labels" }
  ], 20);
  return [
    { label: "Places to see", icon: "🏛️", items: see.slice(0, 20) },
    { label: "Places to eat", icon: "🍽️", items: eat.slice(0, 20) },
    { label: "Places to shop", icon: "🛍️", items: shop.slice(0, 20) }
  ];
}

function suggestionImagePlaceholder(suggestion) {
  const palette = suggestion.category === "eat" ? ["#733c31", "#d5966c"] : suggestion.category === "shop" ? ["#574569", "#a890b3"] : ["#244f66", "#79a6ad"];
  const initials = suggestion.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient></defs><rect width="420" height="280" fill="url(#g)"/><circle cx="340" cy="45" r="82" fill="white" opacity=".1"/><text x="30" y="235" fill="white" font-family="Arial,sans-serif" font-size="72" font-weight="700" opacity=".9">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function hydrateSuggestionImage(imageElement, suggestion, destination) {
  if (!imageElement) return;
  if (suggestion.image) { imageElement.dataset.imageLookup = "ready"; return; }
  imageElement.dataset.imageLookup = "loading";
  const cacheKey = `${suggestion.name}|${destination}`.toLowerCase();
  if (suggestionImageCache.has(cacheKey)) {
    const cached = suggestionImageCache.get(cacheKey);
    if (cached) imageElement.src = cached;
    imageElement.dataset.imageLookup = "ready";
    return;
  }
  try {
    const params = new URLSearchParams({ action: "query", generator: "search", gsrsearch: `${suggestion.name} ${destination}`, gsrlimit: "1", prop: "pageimages", piprop: "thumbnail", pithumbsize: "520", format: "json", origin: "*" });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error("Image lookup unavailable");
    const payload = await response.json();
    const page = Object.values(payload.query?.pages || {})[0];
    const source = page?.thumbnail?.source || "";
    suggestionImageCache.set(cacheKey, source);
    if (source && imageElement.isConnected) imageElement.src = source;
  } catch (_) {
    suggestionImageCache.set(cacheKey, "");
  } finally {
    imageElement.dataset.imageLookup = "ready";
  }
}

function updateSelectionCount() {
  selectionCount.textContent = `${selectedSuggestions.size} selected`;
}

function switchAppTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tabName));
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
  const activePanel = document.querySelector(`[data-panel="${tabName}"]`);
  if (activePanel) activePanel.scrollTop = 0;
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function buildTrip(destination, start, end, wishes, selections = [], preferences = {}) {
  preferences = { pace: "balanced", party: "couple", start: "standard", evening: "flexible", transport: "transit", budget: "balanced", notes: "", ...preferences };
  const days = Math.min(Math.max(daysBetween(start, end) + 1, 1), 14);
  const ideas = parseIdeas([wishes, preferences.notes].filter(Boolean).join(", "));
  const guide = getDestinationGuide(destination);
  const dateList = Array.from({ length: days }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const dayZones = getDayZones(guide, destination, days);
  const selectionBuckets = Array.from({ length: days }, () => []);
  selections.forEach((suggestion, index) => selectionBuckets[findBestZoneIndex(suggestion, dayZones, index)].push(suggestion));

  const seenRecommendations = new Set();
  const itineraryDays = dateList.map((date, index) => {
    let activities = makeActivitiesUnique(
      createActivities(index, days, ideas, destination, guide, selectionBuckets[index], preferences, dayZones[index]),
      seenRecommendations,
      destination,
      date,
      preferences
    );
    activities = fillFullDay(activities, { relaxed: 6, balanced: 8, packed: 10 }[preferences.pace] || 8, seenRecommendations, destination, date, preferences, dayZones[index]).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    activities = assignDistinctActivityIcons(activities, index);
    activities.forEach((item) => { item.status = guide.researchMode ? "Needs verification" : "Recommended"; });
    return {
      date,
      zone: dayZones[index],
      title: `${dayZones[index].name} · ${activities[1].title}`,
      activities
    };
  });
  const bookings = parseBookedItems(preferences.bookedItems);
  bookings.forEach((booking) => {
    const dayIndex = booking.date ? itineraryDays.findIndex((day) => toInputDate(day.date) === booking.date) : 0;
    const targetDay = itineraryDays[Math.max(0, dayIndex)];
    const match = targetDay.activities.find((item) => item.title.toLowerCase().includes(booking.name.toLowerCase()) || booking.name.toLowerCase().includes(cleanActivityTitle(item.title).toLowerCase()));
    if (match) {
      match.status = titleCase(booking.status);
      if (booking.time) match.time = booking.time;
    } else {
      targetDay.activities.push(activity("Booking", "🔒", booking.time || "TBD", booking.name, "Locked booking supplied by the traveler. Build the surrounding route around this anchor.", titleCase(booking.status)));
      targetDay.activities.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  });
  parseList(preferences.mustDos).forEach((name, index) => {
    const targetDay = itineraryDays[index % itineraryDays.length];
    if (!itineraryDays.some((day) => day.activities.some((item) => item.title.toLowerCase().includes(name.toLowerCase())))) targetDay.activities.push(activity("Must do", "⭐", "Flexible", name, "Traveler-designated must-do activity. Preserve it unless the traveler explicitly changes it.", "Confirmed"));
  });

  return {
    destination,
    start,
    end,
    wishes,
    selections,
    preferences,
    bookings,
    guide,
    practical: guide.practical || null,
    researchMode: Boolean(guide.researchMode),
    days: itineraryDays
  };
}

function parseList(value = "") { return String(value).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean); }
function parseBookedItems(value = "") {
  return String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name, date = "", time = "", status = "confirmed"] = line.split("|").map((item) => item.trim());
    return { name, date, time, status: normalizeStatus(status) };
  });
}
function normalizeStatus(value = "") {
  const text = value.toLowerCase();
  if (text.includes("confirm")) return "confirmed";
  if (text.includes("backup")) return "backup";
  if (text.includes("optional")) return "optional";
  if (text.includes("booking")) return "needs booking";
  if (text.includes("verif")) return "needs verification";
  return "recommended";
}

function makeActivitiesUnique(activities, seen, destination, date, preferences) {
  let replacementIndex = 0;
  return activities.map((item) => {
    const key = item.title.trim().toLowerCase().replace(/^(breakfast|lunch|dinner|farewell dinner|taste|visit|browse):\s*/, "");
    if (!seen.has(key)) {
      seen.add(key);
      return item;
    }

    const replacement = createPlanningBlock(destination, date, item.time, replacementIndex++, preferences, item.type);
    seen.add(replacement.title.toLowerCase());
    return replacement;
  });
}

function getDayZones(guide, destination, dayCount) {
  const source = guide.zones && guide.zones.length ? guide.zones : guide.attractions.map((item, index) => ({
    name: item.area || `${destination} district ${index + 1}`,
    icon: ["🏛️", "🌆", "🌿", "🎨", "🛍️", "🌉", "📸", "🧭"][index % 8],
    keywords: [item.area, item.name].filter(Boolean)
  }));
  const unique = source.filter((zone, index, zones) => zones.findIndex((candidate) => candidate.name.toLowerCase() === zone.name.toLowerCase()) === index);
  return Array.from({ length: dayCount }, (_, index) => ({ ...unique[index % unique.length], sequence: index }));
}

function geoText(item) {
  return `${item && item.name || ""} ${item && item.area || ""} ${item && item.address || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function zoneScore(item, zone) {
  if (!item || !zone) return 0;
  const text = geoText(item);
  const terms = [zone.name, ...(zone.keywords || [])].flatMap((value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+|&|\//)).filter((term) => term.length > 2);
  return terms.reduce((score, term) => score + (text.includes(term) ? term.length : 0), 0);
}

function pickForZone(items, zone, fallbackIndex = 0) {
  const ranked = items.map((item, index) => ({ item, index, score: zoneScore(item, zone) })).sort((a, b) => b.score - a.score || Math.abs(a.index - (fallbackIndex % items.length)) - Math.abs(b.index - (fallbackIndex % items.length)));
  return ranked[0].score > 0 ? ranked[0].item : items[fallbackIndex % items.length];
}

function rankForZone(items, zone) {
  return [...items].sort((a, b) => zoneScore(b, zone) - zoneScore(a, zone));
}

function findBestZoneIndex(item, zones, fallbackIndex = 0) {
  const ranked = zones.map((zone, index) => ({ index, score: zoneScore(item, zone) })).sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked[0].score > 0 ? ranked[0].index : fallbackIndex % zones.length;
}

function createActivities(index, totalDays, ideas, destination, guide, selectedForDay = [], preferences = {}, zone = null) {
  const firstSight = pickForZone(guide.attractions, zone, index * 2);
  const secondSight = pickForZone(guide.attractions.filter((item) => item !== firstSight), zone, index * 2 + 1);
  const breakfast = pickForZone(guide.food.breakfast, zone, index);
  const lunch = pickForZone(guide.food.lunch, zone, index + 1);
  const dinner = pickForZone(guide.food.dinner, zone, index + 2);
  const shop = pickForZone(guide.shopping, zone, index);
  const idea = ideas[index] || null;
  const afternoonStop = index % 3 === 2 || index === totalDays - 1 ? shop : secondSight;
  const afternoonType = afternoonStop === shop ? "Shop" : "See";
  const afternoonIcon = afternoonType === "Shop" ? "🛍️" : "📍";

  const breakfastTime = preferences.start === "early" ? "07:30" : preferences.start === "slow" ? "10:00" : "08:30";
  const morningTime = preferences.start === "early" ? "09:00" : preferences.start === "slow" ? "11:30" : "10:00";
  const dinnerTime = preferences.evening === "quiet" ? "18:30" : preferences.evening === "nightlife" ? "20:00" : "19:30";
  const zoneNote = zone ? `Today stays centered on ${zone.name}, minimizing cross-city travel.` : "Today follows one compact district.";
  const routeNote = preferences.transport === "low-walking" ? `${zoneNote} Keep walking segments short and use door-to-door transport.` : preferences.transport === "mixed" ? `${zoneNote} Use transit for the main route and a taxi when it saves energy.` : `${zoneNote} Connect nearby stops by walking and public transit.`;
  const baseActivities = [
    activity("Eat", "☕", breakfastTime, `Breakfast: ${breakfast.name}`, `${breakfast.detail} ${areaText(breakfast)} Allow 45–60 minutes.`),
    activity(index === 0 ? "Arrival" : "See", index === 0 ? "🧳" : "🏛️", morningTime, firstSight.name, `${firstSight.detail} ${areaText(firstSight)} Allow about 2–3 hours including nearby streets. ${routeNote}`),
    activity("Eat", "🍽️", "12:30", `Lunch: ${lunch.name}`, `${lunch.detail} ${areaText(lunch)} Check current opening days and queues.`),
    activity(afternoonType, afternoonIcon, "14:30", afternoonStop.name, `${afternoonStop.detail} ${areaText(afternoonStop)} Keep the route flexible for transit and photos.`),
    activity("Evening", "🌙", dinnerTime, `${index === totalDays - 1 ? "Farewell dinner" : "Dinner"}: ${dinner.name}`, `${dinner.detail} ${areaText(dinner)} Reserve when possible and verify current hours.${preferences.notes ? ` Plan around this note: ${preferences.notes}.` : ""}`)
  ];
  if (idea) baseActivities.push(activity("Explore", "✨", "17:00", `Your request: ${titleCase(idea)}`, `A personalized ${destination} stop inspired directly by “${idea},” selected within or near ${zone ? zone.name : "today’s neighborhood"}. Confirm the best current match in Google Maps.`));
  const selectedActivities = selectedForDay.map((suggestion, suggestionIndex) => suggestionToActivity(suggestion, suggestionIndex));
  return [...selectedActivities, ...baseActivities];
}

function fillFullDay(activities, target, seen, destination, date, preferences, zone = null) {
  const slots = preferences.start === "slow" ? ["12:45", "14:00", "15:45", "17:15", "18:30", "21:00", "22:15"] : ["09:15", "10:45", "13:45", "16:00", "17:30", "18:30", "21:00", "22:15"];
  let index = 0;
  while (activities.length < target && index < slots.length * 2) {
    const time = slots[index % slots.length];
    const block = createPlanningBlock(destination, date, time, index, preferences, "Explore", zone);
    const key = block.title.toLowerCase();
    if (!seen.has(key) && !activities.some((item) => item.time === time)) {
      seen.add(key);
      activities.push(block);
    }
    index += 1;
  }
  return activities;
}

function createPlanningBlock(destination, date, time, index, preferences = {}, requestedType = "Explore", zone = null) {
  const pools = {
    Eat: [["Regional snack tasting", "Stop at a busy food hall or market counter for one signature savory bite and one local drink; allow 45 minutes."], ["Pastry, tea, or dessert break", "Choose a long-running bakery or specialty café near the day’s route and sample the item the city is known for; allow 40 minutes."]],
    Evening: [["After-dinner lights walk", "Finish with a 45-minute stroll through a lively illuminated district, keeping the route close to the return transit stop."], ["Live culture evening option", "Look for a short local music, theater, or cultural performance near today’s neighborhood and leave 90 minutes."]],
    Shop: [["Independent makers stop", "Browse a compact cluster of local craft, stationery, book, or design shops and set aside 60 minutes for useful souvenirs."], ["Neighborhood market browse", "Walk one market aisle at an unhurried pace, compare regional products, and leave room for a small food gift."]],
    See: [["Historic streets photo walk", "Follow a 60–75 minute loop through a character-rich neighborhood, pausing at architecture, public art, and a scenic square."], ["Small museum or gallery hour", "Add one focused cultural stop near the main route; prioritize a compact collection that can be enjoyed in about an hour."]],
    Explore: [["Neighborhood orientation walk", "Take a 60-minute loop around today’s main district to learn the streets, spot cafés, and save interesting places for later."], ["Scenic park and viewpoint break", "Slow down for 45–60 minutes in a garden, waterfront, or public overlook with time for photos and a seated rest."], ["Local market and specialty-food stop", "Browse regional produce and prepared foods, then choose one small snack; allow about an hour."], ["Café rest and trip-journal pause", "Build in 45 minutes to sit down, recharge devices, review the route, and note favorite discoveries."], ["Architecture and public-art loop", "Walk a compact route linking notable façades, plazas, murals, or monuments; allow 60–75 minutes."], ["Golden-hour promenade", "Use the softer evening light for a relaxed waterfront, park, or old-town walk before dinner."], ["After-dinner lights walk", "Finish with a 45-minute stroll through a lively illuminated district, keeping the route close to the return transit stop."], ["Live culture evening option", "Look for a short local music, theater, or cultural performance near today’s neighborhood and leave 90 minutes."]]
  };
  const type = pools[requestedType] ? requestedType : "Explore";
  const [title, detail] = pools[type][index % pools[type].length];
  const transport = preferences.transport === "low-walking" ? "Use a taxi or step-free transit and include a seated break." : preferences.transport === "mixed" ? "A short taxi hop is fine if it protects the day’s energy." : "Keep it on the same transit line or within a short walk of the prior stop.";
  const party = preferences.party === "family" ? " Keep the stop interactive and family-friendly." : preferences.party === "solo" ? " This is an easy, low-pressure solo stop." : "";
  const neighborhood = zone ? ` Keep this stop in ${zone.name} so the day remains geographically compact.` : "";
  return activity(type, type === "Eat" ? "🍴" : type === "Shop" ? "🛍️" : type === "Evening" ? "🌙" : "✨", time, `${title} · ${zone ? zone.name : formatDate(date, false)}`, `${detail}${neighborhood} ${transport}${party}`);
}

function suggestionToActivity(suggestion, index) {
  const schedules = {
    see: ["09:00", "14:00", "16:30", "18:00"],
    eat: ["10:30", "12:30", "18:30", "20:00"],
    shop: ["11:00", "15:30", "17:30", "18:30"]
  };
  const category = suggestion.category || "see";
  const time = schedules[category][index % schedules[category].length];
  const type = category === "eat" ? "Eat" : category === "shop" ? "Shop" : "See";
  const icon = category === "eat" ? "🍽️" : category === "shop" ? "🛍️" : "📍";
  const selectedDetail = [suggestion.detail, suggestion.area ? `Area: ${suggestion.area}.` : "",
    suggestion.rating ? `Google rating: ${suggestion.rating}.` : "", suggestion.cuisine ? `Cuisine: ${suggestion.cuisine}.` : "",
    suggestion.order ? `What to order: ${suggestion.order}.` : "", suggestion.bestFor ? `Known for: ${suggestion.bestFor}.` : "",
    suggestion.address ? `Address: ${suggestion.address}.` : "", "Prioritized from your survey selection."].filter(Boolean).join(" ");
  return activity(type, icon, time, suggestion.name, selectedDetail);
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function activity(type, icon, time, title, description, status = "Recommended") { return { type, icon, time, title, description, status }; }
function place(name, area, detail, metadata = {}) { return { name, area, detail, ...metadata }; }
function areaText(item) { return item.area ? `Area: ${item.area}.` : ""; }

function getDestinationGuide(destination) {
  const known = destinationCatalogs.find((catalog) => catalog.match.test(destination));
  if (known) return known;
  return {
    researchMode: true,
    banner: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&q=82",
    attractions: [
      place(`${destination} historic center`, "Central district", "Start with the best-known civic square, landmark streets, and a visitor-information stop."),
      place(`${destination} signature landmark`, "Landmark district", "Prioritize the destination’s most photographed monument and reserve timed entry if available."),
      place(`${destination} main museum`, "Museum district", "Choose the leading local history or art museum and focus on its highlight collection."),
      place(`${destination} old town walk`, "Historic quarter", "Follow a compact walking route through heritage streets, markets, and architecture."),
      place(`${destination} panoramic viewpoint`, "Scenic district", "Plan this stop for late afternoon light and broad city views."),
      place(`${destination} central market`, "Market district", "Sample regional specialties and browse stalls used by local residents."),
      place(`${destination} waterfront or grand park`, "Open-air district", "Balance major sights with a slower scenic walk."),
      place(`${destination} cultural quarter`, "Arts district", "Explore galleries, performance spaces, independent cafés, and evening activity.")
    ],
    food: {
      breakfast: [place("A top-rated neighborhood bakery", "Near your hotel", "Try the region’s best-known pastry with local coffee or tea."), place("The central market breakfast counter", "Market district", "Order a popular savory breakfast made by a busy local vendor."), place("A classic grand café", "Historic center", "Choose a long-running café known for traditional morning service.")],
      lunch: [place("The city’s landmark food hall", "Central district", "Compare several regional specialties in one convenient stop."), place("A beloved local lunch counter", "Old town", "Choose the house specialty at a high-turnover neighborhood favorite."), place("A popular regional restaurant", "Museum district", "Order the destination’s signature dish in a casual setting.")],
      dinner: [place("A celebrated traditional dining room", "Historic center", "Reserve a restaurant specializing in the destination’s classic cuisine."), place("A lively modern local restaurant", "Arts district", "Try a contemporary menu built around regional ingredients."), place("An atmospheric neighborhood favorite", "Old town", "End with a well-reviewed independent restaurant on a walkable evening street.")]
    },
    shopping: [place(`${destination} central shopping street`, "City center", "The best starting point for major brands, department stores, and local flagships."), place(`${destination} artisan market`, "Historic quarter", "Look for regional crafts, food gifts, and independent makers."), place(`${destination} design and vintage district`, "Creative quarter", "Browse independent fashion, vintage shops, books, and contemporary design.")]
  };
}

function renderTrip() {
  document.querySelector(".trip-app").dataset.template = "complete";
  document.querySelector(".trip-app").dataset.mode = trip.preferences.appMode || "free";
  document.querySelector("#appDestination").textContent = "";
  document.querySelector("#resultTitle").textContent = trip.destination;
  document.querySelector("#resultDates").textContent = `${formatDate(trip.start, true)} — ${formatDate(trip.end, true)}`;
  document.querySelector("#tripStats").innerHTML = [
    `${trip.days.length} ${trip.days.length === 1 ? "day" : "days"}`,
    `${trip.days.reduce((sum, day) => sum + day.activities.length, 0)} thoughtful stops`,
    `${titleCase(trip.preferences.pace)} pace · ${titleCase(trip.preferences.party)}`
  ].map((text) => `<span class="trip-stat">${escapeHtml(text)}</span>`).join("");
  const researchModeNotice = document.querySelector("#researchModeNotice");
  researchModeNotice.hidden = !trip.researchMode;

  const dayBar = document.querySelector(".report-day-bar");
  dayBar.style.setProperty("--destination-banner", `url("${trip.guide.banner}")`);
  dayBar.dataset.destination = "";
  document.querySelector(".app-home-hero").style.setProperty("--destination-banner", `url("${trip.guide.banner}")`);
  document.querySelectorAll(".compact-app-hero").forEach((banner) => banner.style.setProperty("--destination-banner", `url("${trip.guide.banner}")`));

  const nav = document.querySelector("#dayNav");
  nav.innerHTML = "";
  trip.days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-button${index === activeDay ? " active" : ""}`;
    button.setAttribute("aria-label", `${formatDate(day.date, false)} — ${day.title}`);
    button.innerHTML = `<span class="day-nav-icon" aria-hidden="true">${getDayIcon(day, index)}</span><span class="day-nav-copy"><span class="day-nav-date">${formatDate(day.date, false)}</span><span class="day-nav-title">${escapeHtml(shortDayTitle(day.title))}</span></span>`;
    button.addEventListener("click", () => {
      activeDay = index;
      renderTrip();
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    });
    nav.appendChild(button);
  });
  requestAnimationFrame(() => {
    const selectedDateButton = nav.querySelector(".day-button.active");
    if (selectedDateButton && window.matchMedia("(max-width: 760px)").matches) {
      selectedDateButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });

  const day = trip.days[activeDay];
  document.querySelector("#reportTripName").textContent = formatDate(day.date, true);
  document.querySelector(".report-day-heading span").textContent = day.title;
  updateSelectedDayBanner(day, activeDay);
  document.querySelector("#activeDayLabel").textContent = formatDate(day.date, false);
  document.querySelector("#activeDayTitle").textContent = day.title;
  document.querySelector("#printDayLabel").textContent = `${trip.destination} · ${formatDate(day.date, true)}`;
  document.querySelector("#printDayTitle").textContent = day.title;
  const content = document.querySelector("#dayContent");
  content.innerHTML = "";
  day.activities.forEach((activity) => content.appendChild(renderActivity(activity)));
  renderRouteFlow(day);
  renderRouteMapPreview(day);
  renderHomePanel();
  renderWeatherPanel();
  renderCollections();
  renderBookings();
  renderDuringTripTools();
  renderRefinementActions();
  renderPhotos();
  document.querySelector("#markdownPreview").textContent = createTripMarkdown();
  switchAppTab(activeTab);
}

function shortDayTitle(title) {
  const clean = String(title || "").replace(/\s*[·—-]\s*.*/, "").trim();
  return clean.length > 30 ? `${clean.slice(0, 28).trim()}…` : clean;
}

async function updateSelectedDayBanner(day, index) {
  const version = ++dayBannerRenderVersion;
  const dayBar = document.querySelector(".report-day-bar");
  const image = document.querySelector("#dayBannerSource");
  const highlight = day.activities.find((item) => !/arrival|departure|orientation|rest|break/i.test(item.type)) || day.activities[0];
  if (!image || !highlight) return;
  image.src = trip.guide.banner;
  dayBar.style.setProperty("--destination-banner", `url("${trip.guide.banner}")`);
  document.querySelector(".itinerary-day-hero")?.style.setProperty("--destination-banner", `url("${trip.guide.banner}")`);
  await hydrateSuggestionImage(image, {
    name: cleanActivityTitle(highlight.title),
    category: highlight.type === "Eat" ? "eat" : highlight.type === "Shop" ? "shop" : "see",
    image: ""
  }, trip.destination);
  if (version !== dayBannerRenderVersion || index !== activeDay) return;
  const source = image.currentSrc || image.src;
  if (source && !source.startsWith("data:")) {
    dayBar.style.setProperty("--destination-banner", `url("${source}")`);
    document.querySelector(".itinerary-day-hero")?.style.setProperty("--destination-banner", `url("${source}")`);
  }
}

function renderHomePanel() {
  const firstDay = trip.days[activeDay];
  const todayCard = document.querySelector("#todayCard");
  todayCard.innerHTML = `
    <div class="today-card-head">
      <div><span>Start here · ${formatDate(firstDay.date, false)}</span><h4>${escapeHtml(firstDay.title)}</h4></div>
      <button type="button" data-card-itinerary>Open day →</button>
    </div>
    <div class="today-stops">${firstDay.activities.slice(0, 3).map((activity) => `<div class="today-stop"><time>${escapeHtml(activity.time)}</time><strong><span aria-hidden="true">${activity.icon}</span> ${escapeHtml(activity.title)}</strong></div>`).join("")}</div>`;
  todayCard.querySelector("[data-card-itinerary]").addEventListener("click", () => switchAppTab("itinerary"));

  const list = document.querySelector("#homeDayList");
  list.innerHTML = "";
  trip.days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-day-item";
    const iconTrail = day.activities.slice(0, 5).map((activity) => activity.icon).join(" ");
    button.innerHTML = `<span class="home-day-date">${formatDate(day.date, false)}</span><div><strong>${getDayIcon(day, index)} ${escapeHtml(day.title)}</strong><small><span class="home-icon-trail" aria-hidden="true">${iconTrail}</span> ${day.activities.length} planned stops</small></div><i>›</i>`;
    button.addEventListener("click", () => { activeDay = index; renderTrip(); switchAppTab("itinerary"); });
    list.appendChild(button);
  });
}

function renderDuringTripTools() {
  const day = trip.days[activeDay];
  const nextBooking = day.activities.find((item) => /confirmed|needs booking/i.test(item.status || ""));
  const backup = day.activities.find((item) => /backup|optional/i.test(item.status || "")) || day.activities[day.activities.length - 1];
  const homeBase = trip.preferences.homeBase || "Add your hotel or home base";
  document.querySelector("#duringTripTools").innerHTML = [
    ["🗓️", "Today’s plan", `${day.activities.length} stops · ${day.zone?.name || trip.destination}`],
    ["⏰", "Next reservation", nextBooking ? `${nextBooking.time} · ${nextBooking.title}` : "No locked reservation today"],
    ["🚇", "Transit note", `Start and finish near ${homeBase}. Keep transfers geographically compact.`],
    ["🧳", "Luggage note", activeDay === 0 || activeDay === trip.days.length - 1 ? "Confirm hotel storage before arrival/departure." : "Leave bags at your home base."],
    ["🌧️", "Rainy-day backup", `Use ${backup?.title || "a nearby indoor stop"} as the flexible alternative.`],
    ...createPracticalToolEntries()
  ].map(([icon, title, copy]) => `<article><span>${icon}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div></article>`).join("");
}

function createPracticalToolEntries() {
  const practical = trip.practical;
  const hasVerified = (value) => value && !/needs verification/i.test(value);
  if (!practical || !["emergencyNumbers", "touristHotline", "nearestEmbassy", "hospitalOrClinic", "transitTips", "tipping"].some((key) => hasVerified(practical[key]))) {
    return [["🆘", "Emergency card", "Save your hotel address, insurance details, local emergency number, and embassy contact offline. Ask your AI to fill the Practical Info section, then import the updated plan."]];
  }
  const entries = [];
  if (hasVerified(practical.emergencyNumbers)) entries.push(["🆘", "Emergency numbers", practical.emergencyNumbers]);
  if (hasVerified(practical.touristHotline)) entries.push(["☎️", "Tourist hotline", practical.touristHotline]);
  if (hasVerified(practical.nearestEmbassy)) entries.push(["🏛️", "Embassy / consulate", practical.nearestEmbassy]);
  if (hasVerified(practical.hospitalOrClinic)) entries.push(["🏥", "Hospital / clinic", practical.hospitalOrClinic]);
  if (hasVerified(practical.transitTips)) entries.push(["🎫", "Transit tips", practical.transitTips]);
  if (hasVerified(practical.tipping)) entries.push(["💴", "Tipping", practical.tipping]);
  if (practical.keyPhrases?.length) entries.push(["🗣️", "Key phrases", practical.keyPhrases.join(" · ")]);
  return entries;
}

function renderBookings() {
  const container = document.querySelector("#bookingList");
  const allBookings = trip.bookings.concat(loadUserEntries("booking").map((item) => ({ name: item.title, date: item.date, time: item.details || "Confirmed", status: "confirmed" })));
  syncUserEntryDates();
  if (!allBookings.length) {
    container.innerHTML = `<div class="empty-section"><span>✅</span><h3>No locked bookings yet</h3><p>Add hotels, tickets, flights, tours, or restaurant reservations through Edit trip.</p></div>`;
    return;
  }
  container.innerHTML = `<div class="booking-cards">${trip.bookings.map((item) => `<article><span class="status-tag status-${item.status.replace(/\s+/g,"-")}">${escapeHtml(titleCase(item.status))}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.date || "Date flexible")} · ${escapeHtml(item.time || "Time TBD")}</p><small>Traveler supplied · preserve this anchor</small></article>`).join("")}</div>`;
  const customCards = loadUserEntries("booking");
  if (customCards.length) {
    const grid = container.querySelector(".booking-cards");
    customCards.forEach((item) => {
      const card = document.createElement("article");
      card.innerHTML = `<span class="status-tag status-confirmed">Confirmed</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.date || "Date flexible")}</p><small>${escapeHtml(item.details || "Traveler supplied · preserve this anchor")}</small>`;
      grid.appendChild(card);
    });
  }
}

function renderRefinementActions() {
  const actions = ["Make this more relaxed", "Add more food options", "Reduce walking", "Add rainy-day backups", "Add kid-friendly options", "Optimize by geography", "Add shopping", "Add free activities", "Make it more luxury", "Make it cheaper", "Create airport plan", "Create packing list", "Create one-page summary"];
  const container = document.querySelector("#refineActions");
  if (!container) return;
  if (!Array.isArray(trip.refinementInstructions)) trip.refinementInstructions = [];
  container.innerHTML = actions.map((label) => `<button type="button" class="${trip.refinementInstructions.includes(label) ? "selected" : ""}" aria-pressed="${trip.refinementInstructions.includes(label)}">${escapeHtml(label)}</button>`).join("");
  container.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const label = button.textContent;
    const selected = new Set(trip.refinementInstructions);
    if (selected.has(label)) selected.delete(label); else selected.add(label);
    trip.refinementInstructions = actions.filter((action) => selected.has(action));
    button.classList.toggle("selected", selected.has(label));
    button.setAttribute("aria-pressed", String(selected.has(label)));
    document.querySelector("#markdownPreview").textContent = createTripMarkdown();
    updateRefinementStatus();
  }));
  updateRefinementStatus();
}

function updateRefinementStatus() {
  const status = document.querySelector("#refineStatus");
  if (!status) return;
  const count = Array.isArray(trip?.refinementInstructions) ? trip.refinementInstructions.length : 0;
  status.textContent = count
    ? `${count} refinement instruction${count === 1 ? "" : "s"} will be included in AI exports.`
    : "No additional refinement instructions selected.";
}

function renderWeatherPanel() {
  const requestedDestination = trip.destination;
  const requestVersion = ++weatherRenderVersion;
  const weather = createSeasonalWeather(requestedDestination, trip.start);
  document.querySelector("#weatherLocation").textContent = requestedDestination;
  document.querySelector("#weatherKicker").textContent = "Current-day forecast loading";
  document.querySelector("#weatherDate").textContent = "Live weather";
  document.querySelector("#weatherIcon").textContent = weather.icon;
  document.querySelector("#tripWeatherBg").textContent = weather.icon;
  document.querySelector("#weatherTemp").textContent = `${weather.tempF}°F`;
  document.querySelector("#weatherCondition").textContent = `${weather.season} planning estimate`;
  document.querySelector("#weatherSummary").textContent = `${weather.summary} Showing an offline estimate while live conditions load.`;
  document.querySelector("#weatherMetrics").innerHTML = [
    `<span><small>🌡 High / low</small><strong>${weather.highF}° / ${weather.lowF}°</strong></span>`,
    `<span><small>🤗 Feels like</small><strong>${weather.tempF}°F</strong></span>`,
    `<span><small>💧 Humidity</small><strong>${weather.humidity}% est.</strong></span>`,
    `<span><small>💨 Wind</small><strong>${weather.windMph} mph est.</strong></span>`,
    `<span><small>☂ Rain</small><strong>${weather.rainChance}% est.</strong></span>`,
    `<span><small>🧳 Pack</small><strong>${escapeHtml(weather.pack)}</strong></span>`
  ].join("");
  document.querySelector("#weatherDisclaimer").textContent = "Seasonal fallback—live conditions will replace this estimate when available.";

  syncItineraryWeatherCard();
  getLiveWeather(requestedDestination).then((live) => {
    if (!trip || trip.destination !== requestedDestination || requestVersion !== weatherRenderVersion) return;
    applyLiveWeather(live);
    syncItineraryWeatherCard();
  }).catch(() => {
    if (!trip || trip.destination !== requestedDestination || requestVersion !== weatherRenderVersion) return;
    document.querySelector("#weatherKicker").textContent = "Seasonal planning estimate";
    document.querySelector("#weatherDate").textContent = formatDate(trip.start, true);
    document.querySelector("#weatherSummary").textContent = `${weather.summary} Typical ${weather.season.toLowerCase()} conditions for planning.`;
    document.querySelector("#weatherDisclaimer").textContent = "Live forecast unavailable—verify conditions closer to departure.";
  }).finally(syncItineraryWeatherCard);
}

function syncItineraryWeatherCard() {
  const source = document.querySelector("#tripWeatherCard");
  const target = document.querySelector("#itineraryWeatherCard");
  if (!source || !target) return;
  target.innerHTML = source.innerHTML;
  target.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  const selectedDay = trip?.days?.[activeDay];
  if (!selectedDay) return;
  const weather = createSeasonalWeather(trip.destination, selectedDay.date);
  target.querySelector(".weather-location").textContent = trip.destination;
  target.querySelector(".weather-kicker").textContent = "Selected-day planning estimate";
  target.querySelector(".weather-date").textContent = formatDate(selectedDay.date, true);
  target.querySelector(".weather-icon").textContent = weather.icon;
  target.querySelector(".trip-weather-bg").textContent = weather.icon;
  target.querySelector(".weather-main strong").textContent = `${weather.tempF}\u00B0F`;
  target.querySelector(".weather-condition").textContent = `${weather.season} estimate`;
  target.querySelector(".weather-summary").textContent = `${weather.summary} Use this seasonal estimate for planning and verify the forecast closer to the selected date.`;
  target.querySelector(".weather-metrics-row").innerHTML = [
    `<span><small>High / low</small><strong>${weather.highF}\u00B0 / ${weather.lowF}\u00B0</strong></span>`,
    `<span><small>Feels like</small><strong>${weather.tempF}\u00B0F est.</strong></span>`,
    `<span><small>Humidity</small><strong>${weather.humidity}% est.</strong></span>`,
    `<span><small>Wind</small><strong>${weather.windMph} mph est.</strong></span>`,
    `<span><small>Rain chance</small><strong>${weather.rainChance}% est.</strong></span>`,
    `<span><small>Pack</small><strong>${escapeHtml(weather.pack)}</strong></span>`
  ].join("");
  target.querySelector(".weather-disclaimer").textContent = "Seasonal planning estimate for the selected itinerary date; verify closer to departure.";
}

function printSelectedDayItinerary() {
  if (!trip?.days?.[activeDay]) return;
  const previousTitle = document.title;
  document.title = `${trip.destination} - ${formatDate(trip.days[activeDay].date, true)} itinerary`;
  window.print();
  setTimeout(() => { document.title = previousTitle; }, 500);
}

async function getLiveWeather(destination) {
  const cacheKey = destination.trim().toLowerCase();
  if (liveWeatherCache.has(cacheKey)) return liveWeatherCache.get(cacheKey);

  const request = (async () => {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`;
    const locationResponse = await fetch(geocodeUrl);
    if (!locationResponse.ok) throw new Error("Location lookup failed");
    const locationData = await locationResponse.json();
    const location = locationData.results && locationData.results[0];
    if (!location) throw new Error("Location not found");

    const forecastParams = new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto",
      forecast_days: "1"
    });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`);
    if (!weatherResponse.ok) throw new Error("Forecast lookup failed");
    const forecast = await weatherResponse.json();
    return { location, forecast };
  })();

  liveWeatherCache.set(cacheKey, request);
  try {
    return await request;
  } catch (error) {
    liveWeatherCache.delete(cacheKey);
    throw error;
  }
}

function applyLiveWeather({ location, forecast }) {
  const current = forecast.current || {};
  const daily = forecast.daily || {};
  const code = Number(current.weather_code ?? daily.weather_code?.[0] ?? 0);
  const visual = weatherVisualForCode(code, current.is_day !== 0);
  const locationLabel = [location.name, location.admin1, location.country].filter((value, index, values) => value && values.indexOf(value) === index).join(", ");
  const localDate = current.time ? parseDate(current.time.slice(0, 10)) : new Date();
  const updatedTime = current.time && current.time.includes("T") ? formatWeatherTime(current.time.split("T")[1]) : "now";
  const high = Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m);
  const low = Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m);
  const rainChance = Math.round(daily.precipitation_probability_max?.[0] ?? current.precipitation_probability ?? 0);
  const sunrise = formatWeatherTime((daily.sunrise?.[0] || "").split("T")[1]);
  const sunset = formatWeatherTime((daily.sunset?.[0] || "").split("T")[1]);

  document.querySelector("#weatherLocation").textContent = locationLabel || trip.destination;
  document.querySelector("#weatherKicker").textContent = "Current conditions · today’s forecast";
  document.querySelector("#weatherDate").textContent = `${formatDate(localDate, true)} · ${updatedTime}`;
  document.querySelector("#weatherIcon").textContent = visual.icon;
  document.querySelector("#tripWeatherBg").textContent = visual.icon;
  document.querySelector("#weatherTemp").textContent = `${Math.round(current.temperature_2m)}°F`;
  document.querySelector("#weatherCondition").textContent = visual.label;
  document.querySelector("#weatherSummary").textContent = `${visual.detail} Feels like ${Math.round(current.apparent_temperature)}°F with ${Math.round(current.cloud_cover ?? 0)}% cloud cover.`;
  document.querySelector("#weatherMetrics").innerHTML = [
    `<span><small>🌡 High / low</small><strong>${high}° / ${low}°</strong></span>`,
    `<span><small>🤗 Feels like</small><strong>${Math.round(current.apparent_temperature)}°F</strong></span>`,
    `<span><small>💧 Humidity</small><strong>${Math.round(current.relative_humidity_2m)}%</strong></span>`,
    `<span><small>💨 Wind</small><strong>${Math.round(current.wind_speed_10m)} mph ${windDirection(current.wind_direction_10m)}</strong></span>`,
    `<span><small>☂ Rain chance</small><strong>${rainChance}%</strong></span>`,
    `<span><small>☀ Daylight</small><strong>${sunrise}–${sunset}</strong></span>`
  ].join("");
  document.querySelector("#weatherDisclaimer").textContent = "Live model forecast from Open-Meteo. Conditions can change; check again before heading out.";
}

function weatherVisualForCode(code, isDay) {
  if (code === 0) return { icon: isDay ? "☀️" : "🌙", label: "Clear", detail: "Clear skies are expected today." };
  if ([1, 2].includes(code)) return { icon: isDay ? "🌤️" : "☁️", label: "Partly cloudy", detail: "A mix of clouds and clearer periods is expected." };
  if (code === 3) return { icon: "☁️", label: "Overcast", detail: "Cloudy skies are expected through much of the day." };
  if ([45, 48].includes(code)) return { icon: "🌫️", label: "Foggy", detail: "Fog may reduce visibility, especially around open viewpoints." };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", label: "Drizzle", detail: "Light drizzle is possible; carry a compact layer." };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧️", label: "Rain", detail: "Rain is expected; keep an indoor alternative nearby." };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "🌨️", label: "Snow", detail: "Snow or wintry showers may affect walking and transit." };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", label: "Thunderstorms", detail: "Thunderstorms are possible; monitor local alerts." };
  return { icon: "🌤️", label: "Variable", detail: "Variable conditions are expected today." };
}

function windDirection(degrees) {
  if (!Number.isFinite(Number(degrees))) return "";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(Number(degrees) / 45) % 8];
}

function formatWeatherTime(value) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

function createSeasonalWeather(destination, date) {
  const southernPattern = /australia|new zealand|argentina|chile|south africa|brazil|sydney|melbourne|auckland|cape town|buenos aires/i;
  let month = date.getMonth();
  if (southernPattern.test(destination)) month = (month + 6) % 12;

  const season = month <= 1 || month === 11 ? "Winter" : month <= 4 ? "Spring" : month <= 7 ? "Summer" : "Autumn";
  const profiles = {
    Winter: { icon: "☁️", tempC: 8, spread: 5, summary: "Cool with changeable skies.", pack: "Warm layers", daylight: "Shorter days", humidity: 72, windMph: 11, rainChance: 38 },
    Spring: { icon: "🌤️", tempC: 17, spread: 6, summary: "Mild with sun and passing showers.", pack: "Light layers", daylight: "Growing light", humidity: 64, windMph: 9, rainChance: 32 },
    Summer: { icon: "☀️", tempC: 27, spread: 7, summary: "Warm, bright, and often lively outdoors.", pack: "Sun protection", daylight: "Long days", humidity: 58, windMph: 7, rainChance: 22 },
    Autumn: { icon: "🍂", tempC: 19, spread: 6, summary: "Comfortable with crisp evenings.", pack: "A light jacket", daylight: "Gentle light", humidity: 67, windMph: 9, rainChance: 30 }
  };
  const profile = profiles[season];
  const offset = destination.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5 - 2;
  const tempC = profile.tempC + offset;
  const lowC = tempC - Math.round(profile.spread / 2);
  const highC = tempC + Math.round(profile.spread / 2);
  const toFahrenheit = (celsius) => Math.round(celsius * 9 / 5 + 32);

  return {
    ...profile,
    season,
    tempF: toFahrenheit(tempC),
    lowF: toFahrenheit(lowC),
    highF: toFahrenheit(highC)
  };
}

function getDayIcon(day, index) {
  if (day.zone && day.zone.icon) return day.zone.icon;
  const palette = ["🛫", "🏯", "🌆", "🎨", "🍜", "🎐", "🌳", "📸", "🗼", "🎭", "🚆", "🌙", "🎡", "🧭"];
  return palette[index % palette.length];
}

function assignDistinctActivityIcons(activities, dayIndex) {
  const pools = {
    Eat: ["☕", "🥐", "🍱", "🍜", "🍣", "🥢", "🍽️", "🍡"],
    See: ["🏯", "🏛️", "⛩️", "🗼", "🖼️", "🌉", "🎨", "📸"],
    Explore: ["🧭", "🚶", "🌿", "🔭", "🏙️", "🎐", "🚤", "✨"],
    Shop: ["🛍️", "👘", "🎁", "🧸", "📚", "⌚", "🎮", "💎"],
    Evening: ["🌙", "🏮", "🎭", "🎶", "🌃", "🍸", "🎆", "🎤"],
    Arrival: ["🛬", "🧳", "🚆", "🚕"]
  };
  const used = new Set();
  return activities.map((item, index) => {
    const pool = pools[item.type] || ["📍", "⭐", "🗺️", "🎟️", "📌", "🌟"];
    const themed = themedActivityIcon(item);
    if (themed && !used.has(themed)) {
      used.add(themed);
      return { ...item, icon: themed };
    }
    const candidates = [...pool.slice((dayIndex + index) % pool.length), ...pool.slice(0, (dayIndex + index) % pool.length)];
    const icon = candidates.find((candidate) => !used.has(candidate)) || pool[index % pool.length];
    used.add(icon);
    return { ...item, icon };
  });
}

function themedActivityIcon(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const themes = [
    [/senso|temple|shrine|meiji|zojoji|pagoda/, "⛩️"], [/tower|sky|viewpoint|observatory|panoramic/, "🗼"],
    [/museum|gallery|art/, "🖼️"], [/market|tsukiji|food hall/, "🐟"], [/sushi|nigiri/, "🍣"],
    [/ramen|noodle|soba/, "🍜"], [/tonkatsu|pork/, "🍱"], [/coffee|cafe|toast|breakfast/, "☕"],
    [/ginza|luxury|department store/, "💎"], [/akihabara|anime|game|electronics/, "🎮"],
    [/harajuku|fashion|vintage/, "👘"], [/bay|odaiba|waterfront|river|harbor/, "🌉"],
    [/park|garden|nature/, "🌳"], [/night|lights|evening/, "🏮"], [/train|transit|station/, "🚆"]
  ];
  const match = themes.find(([pattern]) => pattern.test(text));
  return match ? match[1] : null;
}

function renderRouteFlow(day) {
  const container = document.querySelector("#routeFlowWidget");
  const stops = day.activities.map((item, index) => ({ ...item, index }));
  container.innerHTML = `<div class="widget-title"><span>🗺️</span><div><p>Selected day</p><h3>Route Flow</h3></div></div><div class="route-flow-list"></div>`;
  const list = container.querySelector(".route-flow-list");
  stops.forEach((stop, index) => {
    const row = document.createElement("div");
    row.className = "route-flow-stop";
    const next = stops[index + 1];
    const travel = next ? estimateTravel(stop, next) : null;
    row.innerHTML = `<div class="route-stop-marker">${stop.icon}</div><div><time>${escapeHtml(stop.time)}</time><strong>${escapeHtml(cleanActivityTitle(stop.title))}</strong>${travel ? `<small>${travel.icon} ${travel.minutes} min to next stop · ${travel.mode}</small>` : `<small>🏁 End of today’s route</small>`}</div>`;
    list.appendChild(row);
  });
}

function estimateTravel(current, next) {
  const gap = Math.max(10, timeToMinutes(next.time) - timeToMinutes(current.time));
  const mode = trip.preferences.transport === "low-walking" ? "taxi / accessible transit" : trip.preferences.transport === "mixed" ? "transit or taxi" : "walk + transit";
  const minutes = Math.min(45, Math.max(8, Math.round(Math.min(gap * .22, 35) / 5) * 5));
  return { minutes, mode, icon: trip.preferences.transport === "low-walking" ? "🚕" : gap <= 75 ? "🚶" : "🚇" };
}

function renderRouteMapPreview(day) {
  const container = document.querySelector("#routeMapPreview");
  const namedStops = day.activities.map((item) => cleanActivityTitle(item.title)).filter(Boolean);
  const routeUrl = googleMapsDirectionsUrl(namedStops);
  const embedUrl = googleMapsEmbedRouteUrl(namedStops);
  container.innerHTML = `<section class="route-map-widget"><div class="widget-title"><span>🧭</span><div><p>${escapeHtml(formatDate(day.date, false))}</p><h3>Google Route Map</h3></div><a class="google-maps-link" href="${routeUrl}" target="_blank" rel="noopener noreferrer">Open full Google route ↗</a></div><div class="route-map-grid"><iframe class="google-route-frame" src="${embedUrl}" title="Google map of the ${escapeHtml(formatDate(day.date, false))} itinerary in ${escapeHtml(trip.destination)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe><ol>${namedStops.map((name, index) => `<li><span>${day.activities[index].icon}</span><a href="${googleMapsSearchUrl(name)}" target="_blank" rel="noopener noreferrer"><b>${index + 1}.</b> ${escapeHtml(name)}</a></li>`).join("")}</ol></div><p class="map-estimate-note">The embedded Google map uses today’s ordered itinerary places. Open the full route for live traffic, transit schedules, and detailed turn-by-turn directions.</p></section>`;
}

function googleMapsEmbedRouteUrl(stops) {
  const routeQuery = stops.length ? stops.slice(0, 8).map((stop) => `${stop} ${trip.destination}`).join(" to ") : trip.destination;
  return `https://www.google.com/maps?q=${encodeURIComponent(routeQuery)}&output=embed`;
}

function googleMapsDirectionsUrl(stops) {
  if (!stops.length) return googleMapsSearchUrl(trip.destination);
  const params = new URLSearchParams({ api: "1", origin: `${stops[0]} ${trip.destination}`, destination: `${stops[stops.length - 1]} ${trip.destination}`, travelmode: trip.preferences.transport === "low-walking" ? "driving" : "transit" });
  if (stops.length > 2) params.set("waypoints", stops.slice(1, -1).map((stop) => `${stop} ${trip.destination}`).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

function renderCollections() {
  renderCollection("#mapsList", ["Explore", "See", "Arrival", "Eat", "Shop", "Evening"], "Your planned stops will appear here by day.", true);
  renderFoodOptions();
  renderShoppingOptions();
}

function renderFoodOptions() {
  const container = document.querySelector("#foodList");
  const activeZone = trip.days[activeDay].zone;
  container.innerHTML = `<div class="selected-date-context"><span>Selected date · ${escapeHtml(activeZone ? activeZone.name : trip.destination)}</span><strong>${formatDate(trip.days[activeDay].date, false)}</strong><a class="google-maps-link" href="${googleMapsSearchUrl(`best restaurants ${activeZone ? activeZone.name : ""}`)}" target="_blank" rel="noopener noreferrer">Discover more on Google Maps ↗</a></div>`;
  [
    { label: "Breakfast", icon: "☕", options: trip.guide.food.breakfast },
    { label: "Lunch", icon: "🥪", options: trip.guide.food.lunch },
    { label: "Dinner", icon: "🍽️", options: trip.guide.food.dinner }
  ].forEach((group) => {
    const section = document.createElement("section");
    section.className = "option-group";
    section.innerHTML = `<div class="option-group-heading"><span>${group.icon}</span><div><p>Three popular options</p><h3>${group.label}</h3></div></div>`;
    const grid = document.createElement("div");
    grid.className = "option-card-grid";
    rankForZone(group.options, activeZone).slice(0, 3).forEach((option, index) => grid.appendChild(renderRecommendationCard(option, `${group.label} option ${index + 1}`, group.icon)));
    section.appendChild(grid);
    container.appendChild(section);
  });
  renderUserEntryCards(container, "food", "Your saved food places");
  container.appendChild(renderPlanningNote("Restaurant popularity, hours, and reservation policies change. Verify details before visiting."));
}

function renderShoppingOptions() {
  const container = document.querySelector("#shopList");
  const activeZone = trip.days[activeDay].zone;
  container.innerHTML = `<div class="selected-date-context"><span>Selected date · ${escapeHtml(activeZone ? activeZone.name : trip.destination)}</span><strong>${formatDate(trip.days[activeDay].date, false)}</strong><a class="google-maps-link" href="${googleMapsSearchUrl(`best shopping ${activeZone ? activeZone.name : ""}`)}" target="_blank" rel="noopener noreferrer">Discover more on Google Maps ↗</a></div><section class="option-group"><div class="option-group-heading"><span>🛍️</span><div><p>Popular near today’s route</p><h3>Where to shop</h3></div></div><div class="option-card-grid" id="shoppingOptionGrid"></div></section>`;
  const grid = container.querySelector("#shoppingOptionGrid");
  rankForZone(trip.guide.shopping, activeZone).slice(0, 3).forEach((option, index) => grid.appendChild(renderRecommendationCard(option, `Shopping option ${index + 1}`, "🛍️")));
  renderUserEntryCards(container, "shop", "Your saved shopping places");
  container.appendChild(renderPlanningNote("Market days and store hours vary. Confirm schedules before building the final route."));
}

function userEntryStorageKey(kind) {
  return `plantoguide-${kind}-entries-${tripStorageSlug()}-${tripStorageStartDate()}`;
}

function legacyUserEntryStorageKey(kind) {
  return `x-travel-agent-${kind}-entries-${tripStorageSlug()}`;
}

function tripStorageSlug() {
  return (trip?.destination || destinationInput?.value || "trip").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
}

function tripStorageStartDate() {
  if (trip?.start instanceof Date && !Number.isNaN(trip.start.getTime())) return toInputDate(trip.start);
  return startDateInput?.value || "undated";
}

function readMigratedArray(newKey, legacyKey) {
  const current = safeStorageGet(newKey);
  if (current && current !== "[]") return current;
  const legacy = safeStorageGet(legacyKey);
  if (legacy && legacy !== "[]") {
    safeStorageSet(newKey, legacy);
    return legacy;
  }
  return current || "[]";
}

function loadUserEntries(kind) {
  try {
    const entries = JSON.parse(readMigratedArray(userEntryStorageKey(kind), legacyUserEntryStorageKey(kind)));
    return Array.isArray(entries) ? entries.filter((item) => item?.title) : [];
  } catch (_) { return []; }
}

function saveUserEntries(kind, entries) {
  safeStorageSet(userEntryStorageKey(kind), JSON.stringify(entries));
}

function syncUserEntryDates() {
  if (!trip?.days?.[activeDay]) return;
  const selectedDate = toInputDate(trip.days[activeDay].date);
  ["booking", "food", "shop"].forEach((kind) => {
    const input = document.querySelector(`#${kind}EntryDate`);
    if (input && !input.value) input.value = selectedDate;
  });
}

function addUserEntry(kind) {
  const titleInput = document.querySelector(`#${kind}EntryTitle`);
  const dateInput = document.querySelector(`#${kind}EntryDate`);
  const detailsInput = document.querySelector(`#${kind}EntryDetails`);
  const status = document.querySelector(`#${kind}EntryStatus`);
  const title = titleInput.value.trim();
  if (!title) {
    status.textContent = "Add a location or name before saving.";
    status.classList.add("error");
    titleInput.focus();
    return;
  }
  const entries = loadUserEntries(kind);
  entries.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, date: dateInput.value || currentPhotoDate(), details: detailsInput.value.trim() });
  saveUserEntries(kind, entries);
  titleInput.value = "";
  detailsInput.value = "";
  status.textContent = `${title} added.`;
  status.classList.remove("error");
  if (kind === "booking") renderBookings();
  if (kind === "food") renderFoodOptions();
  if (kind === "shop") renderShoppingOptions();
}

function renderUserEntryCards(container, kind, heading) {
  syncUserEntryDates();
  const selectedDate = currentPhotoDate();
  const entries = loadUserEntries(kind).filter((item) => !item.date || item.date === selectedDate);
  if (!entries.length) return;
  const section = document.createElement("section");
  section.className = "option-group user-saved-section";
  section.innerHTML = `<div class="option-group-heading"><div><p>Traveler supplied</p><h3>${escapeHtml(heading)}</h3></div></div><div class="user-saved-card-list"></div>`;
  const list = section.querySelector(".user-saved-card-list");
  entries.forEach((item) => {
    const card = document.createElement("article");
    card.className = "user-saved-card";
    card.innerHTML = `<div><span class="status-tag status-confirmed">Saved</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.details || "Traveler-added place")}</p><small>${escapeHtml(item.date || "Date flexible")}</small><a class="google-maps-link" href="${googleMapsSearchUrl(item.title)}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></div>`;
    list.appendChild(card);
  });
  container.appendChild(section);
}

function renderRecommendationCard(option, label, icon) {
  const article = document.createElement("article");
  article.className = "recommendation-card";
  const category = option.order ? "eat" : option.bestFor ? "shop" : /breakfast|lunch|dinner/i.test(label) ? "eat" : "shop";
  const rating = option.rating ? `<span class="place-fact"><b>⭐ Google rating</b>${escapeHtml(option.rating)} / 5 <em>· verify live</em></span>` : "";
  const address = option.address ? `<span class="place-fact"><b>📍 Address</b>${escapeHtml(option.address)}</span>` : `<span class="place-fact"><b>📍 Area</b>${escapeHtml(option.area || trip.destination)}</span>`;
  const specialty = option.order ? `<span class="place-fact"><b>🥢 What to order</b>${escapeHtml(option.order)}</span>` : option.bestFor ? `<span class="place-fact"><b>🛍️ Best for</b>${escapeHtml(option.bestFor)}</span>` : "";
  article.innerHTML = `<img class="recommendation-photo" src="${escapeHtml(option.image || suggestionImagePlaceholder({ name: option.name, category }))}" alt="${escapeHtml(`${option.name} in ${trip.destination}`)}" loading="lazy"><span class="recommendation-icon" aria-hidden="true">${icon}</span><div><span class="recommendation-label">${escapeHtml(label)}</span><h4>${escapeHtml(option.name)}</h4><p>${escapeHtml(option.detail)}</p><div class="place-facts">${rating}${address}${specialty}</div><a class="google-maps-link" href="${googleMapsSearchUrl(option.name, option.address || option.area)}" target="_blank" rel="noopener noreferrer" aria-label="Find ${escapeHtml(option.name)} on Google Maps">Live details on Google Maps ↗</a></div>`;
  hydrateSuggestionImage(article.querySelector(".recommendation-photo"), { name: option.name, category, image: option.image || "" }, trip.destination);
  return article;
}

function renderPlanningNote(text) {
  const note = document.createElement("p");
  note.className = "planning-note";
  note.textContent = text;
  return note;
}

function renderCollection(selector, types, emptyText, includeMapLinks = false) {
  const container = document.querySelector(selector);
  container.innerHTML = includeMapLinks ? `<div class="maps-destination-context"><span>Map context for</span><strong>${escapeHtml(trip.destination)}</strong><a class="google-maps-link" href="${googleMapsSearchUrl(`popular places to see eat and shop`, "")}" target="_blank" rel="noopener noreferrer">Explore ${escapeHtml(trip.destination)} on Google Maps ↗</a></div>` : "";
  const sourceDays = includeMapLinks ? [{ day: trip.days[activeDay], dayIndex: activeDay }] : trip.days.map((day, dayIndex) => ({ day, dayIndex }));
  const matches = sourceDays.flatMap(({ day, dayIndex }) => day.activities.filter((activity) => types.includes(activity.type)).map((activity) => ({ activity, dayIndex, day })));
  if (!matches.length) {
    container.innerHTML = `<p class="empty-collection">${escapeHtml(emptyText)}</p>`;
    return;
  }
  matches.forEach(({ activity, dayIndex, day }) => {
    const fragment = document.querySelector("#collectionTemplate").content.cloneNode(true);
    const card = fragment.querySelector(".collection-card");
    fragment.querySelector(".collection-icon").textContent = activity.icon;
    fragment.querySelector(".collection-day").textContent = `${formatDate(day.date, false)} · ${activity.time}`;
    fragment.querySelector("h3").textContent = activity.title;
    fragment.querySelector("p").textContent = activity.description;
    if (includeMapLinks) {
      const mapLink = document.createElement("a");
      mapLink.className = "google-maps-link";
      mapLink.href = googleMapsSearchUrl(cleanActivityTitle(activity.title), "");
      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";
      mapLink.textContent = "Open this stop in Google Maps ↗";
      mapLink.addEventListener("click", (event) => event.stopPropagation());
      fragment.querySelector("p").after(mapLink);
    }
    card.addEventListener("click", () => { activeDay = dayIndex; renderTrip(); switchAppTab("itinerary"); });
    container.appendChild(fragment);
  });
}

function cleanActivityTitle(title) {
  return title.replace(/^(Breakfast|Lunch|Dinner|Farewell dinner):\s*/i, "").replace(/\s·\s(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),.*$/i, "").trim();
}

function googleMapsSearchUrl(name, area = "") {
  const query = [name, area, trip && trip.destination].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function renderActivity(activity) {
  const fragment = document.querySelector("#activityTemplate").content.cloneNode(true);
  fragment.querySelector(".activity-time").textContent = activity.time;
  fragment.querySelector(".activity-icon").textContent = activity.icon;
  fragment.querySelector(".activity-type").textContent = activity.type;
  const status = fragment.querySelector(".activity-status");
  status.textContent = activity.status || "Recommended";
  status.className = `activity-status status-${normalizeStatus(activity.status).replace(/\s+/g, "-")}`;
  fragment.querySelector("h4").textContent = activity.title;
  const activityImage = fragment.querySelector(".activity-photo");
  const activityName = cleanActivityTitle(activity.title);
  activityImage.src = suggestionImagePlaceholder({ name: activityName, category: activity.type === "Eat" ? "eat" : activity.type === "Shop" ? "shop" : "see" });
  activityImage.alt = `${activityName} in ${trip.destination}`;
  hydrateSuggestionImage(activityImage, { name: activityName, category: activity.type === "Eat" ? "eat" : activity.type === "Shop" ? "shop" : "see", image: "" }, trip.destination);
  fragment.querySelector(".activity-copy p").textContent = activity.description;
  const mapLink = document.createElement("a");
  mapLink.className = "google-maps-link";
  mapLink.href = googleMapsSearchUrl(cleanActivityTitle(activity.title), "");
  mapLink.target = "_blank";
  mapLink.rel = "noopener noreferrer";
  mapLink.textContent = "Google Maps details ↗";
  fragment.querySelector(".activity-copy p").after(mapLink);
  fragment.querySelector(".activity-menu").addEventListener("click", (event) => {
    const card = event.currentTarget.closest(".activity-card");
    card.querySelector("h4").contentEditable = "true";
    card.querySelector("h4").focus();
  });
  return fragment;
}

function photoStorageKey() {
  return `plantoguide-photos-${tripStorageSlug()}-${tripStorageStartDate()}`;
}

function legacyPhotoStorageKey() {
  return `x-travel-agent-photos-${tripStorageSlug()}`;
}

function loadStoredTripPhotos() {
  try {
    const photos = JSON.parse(readMigratedArray(photoStorageKey(), legacyPhotoStorageKey()));
    return Array.isArray(photos) ? photos.filter((photo) => photo?.id) : [];
  } catch (_) { return []; }
}

function loadTripPhotos() {
  return loadStoredTripPhotos().filter((photo) => photo?.src);
}

function saveTripPhotos(photos) {
  try {
    window.localStorage.setItem(photoStorageKey(), JSON.stringify(photos));
    return true;
  } catch (_) {
    setPhotoStatus("This browser is out of photo storage. Remove an image or upload a smaller file.", true);
    return false;
  }
}

function setPhotoStatus(message, isError = false) {
  const status = document.querySelector("#photoManagerStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function currentPhotoDate() {
  return trip?.days?.[activeDay] ? toInputDate(trip.days[activeDay].date) : "";
}

async function handlePhotoUploads(event) {
  const files = [...(event.target.files || [])].filter((file) => file.type.startsWith("image/"));
  const requestedCaption = document.querySelector("#photoCaptionInput").value.trim();
  event.target.value = "";
  if (!files.length) return setPhotoStatus("Choose one or more image files.", true);
  setPhotoStatus(`Preparing ${files.length} ${files.length === 1 ? "photo" : "photos"}…`);
  const existing = loadStoredTripPhotos();
  const additions = [];
  for (const file of files.slice(0, 12)) {
    try {
      const metadata = await readPhotoMetadata(file);
      const metadataDate = itineraryDateFromMetadata(metadata.capturedDate);
      additions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        src: await resizePhotoFile(file),
        caption: requestedCaption
          ? (files.length === 1 ? requestedCaption : `${requestedCaption} · ${file.name.replace(/\.[^.]+$/, "")}`)
          : file.name.replace(/\.[^.]+$/, ""),
        date: metadataDate || currentPhotoDate(),
        capturedAt: metadata.capturedAt || "",
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        source: "upload"
      });
    } catch (_) { /* Continue with the remaining valid images. */ }
  }
  if (!additions.length) return setPhotoStatus("Those images could not be prepared. Try JPG, PNG, or WebP files.", true);
  if (saveTripPhotos([...existing, ...additions])) {
    document.querySelector("#photoCaptionInput").value = "";
    setPhotoStatus(`${additions.length} ${additions.length === 1 ? "photo" : "photos"} added to your journal.`);
    renderPhotos();
  }
}

function itineraryDateFromMetadata(capturedDate) {
  if (!capturedDate) return "";
  return trip.days.some((day) => toInputDate(day.date) === capturedDate) ? capturedDate : "";
}

async function readPhotoMetadata(file) {
  if (!/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) return {};
  try { return parseJpegExif(await file.arrayBuffer()); }
  catch (_) { return {}; }
}

function parseJpegExif(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return {};
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset, false);
    offset += 2;
    if ((marker & 0xff00) !== 0xff00 || offset + 2 > view.byteLength) break;
    const length = view.getUint16(offset, false);
    const dataStart = offset + 2;
    if (marker === 0xffe1 && length >= 8 && dataStart + 6 < view.byteLength && view.getUint32(dataStart, false) === 0x45786966) {
      return parseTiffExif(view, dataStart + 6);
    }
    if (length < 2) break;
    offset += length;
  }
  return {};
}

function parseTiffExif(view, tiffStart) {
  if (tiffStart + 8 > view.byteLength) return {};
  const byteOrder = view.getUint16(tiffStart, false);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) return {};
  const u16 = (position) => view.getUint16(position, little);
  const u32 = (position) => view.getUint32(position, little);
  if (u16(tiffStart + 2) !== 42) return {};
  const typeSize = { 1:1, 2:1, 3:2, 4:4, 5:8, 7:1, 9:4, 10:8 };
  const readEntries = (relativeOffset) => {
    if (!relativeOffset) return new Map();
    const start = tiffStart + relativeOffset;
    if (start < tiffStart || start + 2 > view.byteLength) return new Map();
    const count = u16(start);
    const entries = new Map();
    for (let index = 0; index < count; index += 1) {
      const entry = start + 2 + index * 12;
      if (entry + 12 > view.byteLength) break;
      entries.set(u16(entry), entry);
    }
    return entries;
  };
  const valuePosition = (entry) => {
    const type = u16(entry + 2);
    const count = u32(entry + 4);
    const bytes = (typeSize[type] || 1) * count;
    return { type, count, position: bytes <= 4 ? entry + 8 : tiffStart + u32(entry + 8) };
  };
  const ascii = (entry) => {
    if (!entry) return "";
    const value = valuePosition(entry);
    if (value.position < 0 || value.position + value.count > view.byteLength) return "";
    let text = "";
    for (let index = 0; index < value.count; index += 1) {
      const code = view.getUint8(value.position + index);
      if (!code) break;
      text += String.fromCharCode(code);
    }
    return text.trim();
  };
  const pointer = (entry) => entry ? u32(entry + 8) : 0;
  const rationalArray = (entry) => {
    if (!entry) return [];
    const value = valuePosition(entry);
    const numbers = [];
    for (let index = 0; index < value.count && value.position + index * 8 + 8 <= view.byteLength; index += 1) {
      const numerator = u32(value.position + index * 8);
      const denominator = u32(value.position + index * 8 + 4);
      numbers.push(denominator ? numerator / denominator : 0);
    }
    return numbers;
  };
  const ifd0 = readEntries(u32(tiffStart + 4));
  const exifIfd = readEntries(pointer(ifd0.get(0x8769)));
  const gpsIfd = readEntries(pointer(ifd0.get(0x8825)));
  const capturedAt = ascii(exifIfd.get(0x9003)) || ascii(exifIfd.get(0x9004)) || ascii(ifd0.get(0x0132));
  const dateMatch = capturedAt.match(/^(\d{4}):(\d{2}):(\d{2})/);
  const latitudeParts = rationalArray(gpsIfd.get(0x0002));
  const longitudeParts = rationalArray(gpsIfd.get(0x0004));
  const latitudeRef = ascii(gpsIfd.get(0x0001)).toUpperCase();
  const longitudeRef = ascii(gpsIfd.get(0x0003)).toUpperCase();
  const decimal = (parts, reference) => {
    if (parts.length < 3) return null;
    const value = parts[0] + parts[1] / 60 + parts[2] / 3600;
    return /[SW]/.test(reference) ? -value : value;
  };
  const latitude = decimal(latitudeParts, latitudeRef);
  const longitude = decimal(longitudeParts, longitudeRef);
  return {
    capturedAt,
    capturedDate: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : "",
    latitude: Number.isFinite(latitude) && Math.abs(latitude) <= 90 ? latitude : null,
    longitude: Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? longitude : null
  };
}

function resizePhotoFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", .8));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image could not be read")); };
    image.src = objectUrl;
  });
}

function renderPhotos() {
  const gallery = document.querySelector("#photoGallery");
  const empty = document.querySelector("#photoEmptyState");
  const bottomUpload = document.querySelector("#photoBottomUpload");
  const selectedDate = currentPhotoDate();
  const photos = loadTripPhotos().filter((photo) => photo.date === selectedDate);
  const selectedDay = trip.days[activeDay];
  document.querySelector("#photoSelectedDayTitle").textContent = `${formatDate(selectedDay.date, true)} · ${selectedDay.title}`;
  document.querySelector("#photoSelectedDayCount").textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
  gallery.replaceChildren();
  photos.forEach((photo) => {
    const card = document.createElement("figure");
    card.className = "photo-card";
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.caption || "Trip photo";
    image.loading = "lazy";
    image.addEventListener("error", () => card.classList.add("photo-load-error"));
    const caption = document.createElement("figcaption");
    const metadataLabel = photo.capturedAt ? ` · Captured ${escapeHtml(photo.capturedAt.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"))}` : "";
    caption.innerHTML = `<strong>${escapeHtml(photo.caption || "Trip photo")}</strong><span>${photo.date ? escapeHtml(formatDate(parseDate(photo.date), true)) : "Trip journal"} · ${photo.source === "link" ? "Linked image" : "Uploaded image"}${metadataLabel}</span>`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "photo-remove-button";
    remove.setAttribute("aria-label", `Remove ${photo.caption || "photo"}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      if (saveTripPhotos(loadStoredTripPhotos().filter((candidate) => candidate.id !== photo.id))) {
        setPhotoStatus("Photo removed.");
        renderPhotos();
      }
    });
    card.append(image, caption, remove);
    if (hasPhotoCoordinates(photo)) {
      const locate = document.createElement("button");
      locate.type = "button";
      locate.className = "photo-location-button";
      locate.textContent = "📍 Show on map";
      locate.addEventListener("click", () => { focusedPhotoId = photo.id; renderPhotoMap(photos); });
      card.appendChild(locate);
    }
    gallery.appendChild(card);
  });
  empty.hidden = photos.length > 0;
  bottomUpload.hidden = photos.length === 0;
  if (!photos.length && !empty.querySelector(".photo-empty-upload")) {
    const upload = document.createElement("label");
    upload.className = "photo-upload-button photo-empty-upload";
    upload.htmlFor = "photoUploadInput";
    upload.textContent = "Upload photos";
    empty.appendChild(upload);
  }
  renderPhotoMap(photos);
}

function hasPhotoCoordinates(photo) {
  return Number.isFinite(Number(photo?.latitude)) && Number.isFinite(Number(photo?.longitude));
}

function renderPhotoMap(photos) {
  const container = document.querySelector("#photoDayMap");
  const geotagged = photos.filter(hasPhotoCoordinates);
  container.hidden = geotagged.length === 0;
  if (!geotagged.length) {
    container.innerHTML = `<div class="photo-day-map-head"><div><div class="photo-day-map-title">🗺️ Today’s photo trail</div><div class="photo-day-map-sub">Google Maps locations appear here when uploaded photos contain GPS metadata.</div></div><div class="photo-day-map-count">0 tagged</div></div><div class="photo-map-empty"><strong>No geotagged photos for this date</strong>Photos without GPS still remain in the selected day’s gallery.</div>`;
    return;
  }
  container.hidden = false;
  const focused = geotagged.find((photo) => photo.id === focusedPhotoId) || geotagged[0];
  focusedPhotoId = focused.id;
  const latitude = Number(focused.latitude);
  const longitude = Number(focused.longitude);
  const coordinate = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(coordinate)}&z=14&t=m&hl=en&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinate)}`;
  const groups = new Map();
  geotagged.forEach((photo) => {
    const key = `${Number(photo.latitude).toFixed(5)},${Number(photo.longitude).toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, { photo, count: 0 });
    groups.get(key).count += 1;
  });
  container.innerHTML = `<div class="photo-day-map-head"><div><div class="photo-day-map-title">🗺️ Today’s photo trail</div><div class="photo-day-map-sub">Google Maps view plotted from the original photo geotags. Choose a location below to move the map.</div></div><div class="photo-day-map-count">${geotagged.length} tagged</div></div><div class="photo-map-frame"><iframe title="Google Map of the selected photo location" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="${mapEmbed}"></iframe><a class="photo-map-open" href="${mapLink}" target="_blank" rel="noopener">View interactive map ↗</a></div><div class="photo-map-legend"></div>`;
  const legend = container.querySelector(".photo-map-legend");
  [...groups.values()].forEach(({ photo, count }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-map-place";
    button.innerHTML = `<b>${count}</b><span>${escapeHtml(photo.caption || "Geotagged photo")}<br>${Number(photo.latitude).toFixed(4)}, ${Number(photo.longitude).toFixed(4)}</span>`;
    button.addEventListener("click", () => { focusedPhotoId = photo.id; renderPhotoMap(photos); });
    legend.appendChild(button);
  });
}

function parseIdeas(text) {
  const ideas = text.split(/,|\n|;|\band\b/i).map((part) => part.trim()).filter((part) => part.length > 2);
  return [...new Map(ideas.map((idea) => [idea.toLowerCase(), idea])).values()];
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function parseDate(value) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); }
function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function toInputDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDate(date, includeYear) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: includeYear ? undefined : "short", year: includeYear ? "numeric" : undefined }).format(date); }
function titleCase(text) { return text.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

function safeStorageGet(key) {
  try { return window.localStorage.getItem(key); } catch (error) { return null; }
}

function safeStorageSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch (error) { /* The file-based public demo still works without storage. */ }
}

function safeStorageRemove(key) {
  try { window.localStorage.removeItem(key); } catch (error) { /* Storage is optional. */ }
}

function restoreSavedTrip() {
  let saved = null;
  try {
    const importedCurrent = safeStorageGet("plantoguide-imported-trip");
    const importedLegacy = safeStorageGet("x-travel-agent-imported-trip");
    if (!importedCurrent && importedLegacy) safeStorageSet("plantoguide-imported-trip", importedLegacy);
    const current = safeStorageGet("plantoguide-trip");
    const legacy = safeStorageGet("x-travel-agent-trip") || safeStorageGet("x-travel-guide-trip") || safeStorageGet("roam-trip");
    const raw = current || legacy || "null";
    if (!current && legacy) safeStorageSet("plantoguide-trip", legacy);
    saved = JSON.parse(raw);
  } catch (error) { saved = null; }
  if (!saved) return;

  destinationInput.value = saved.destination || "";
  suggestionDestination = (saved.destination || "").trim().toLowerCase();
  startDateInput.value = saved.start || startDateInput.value;
  endDateInput.value = saved.end || endDateInput.value;
  wishListInput.value = saved.wishes || "";
  setTripPreferences(saved.preferences || {});
  selectedSuggestions.clear();
  (saved.selections || []).forEach((suggestion) => {
    if (suggestion && suggestion.key) selectedSuggestions.set(suggestion.key, suggestion);
  });

  if (!saved.destination || !saved.start || !saved.end || (!saved.wishes && !selectedSuggestions.size)) return;
  const start = parseDate(saved.start);
  const end = parseDate(saved.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return;

  trip = buildTrip(saved.destination.trim(), start, end, saved.wishes.trim(), [...selectedSuggestions.values()], saved.preferences || {});
  activeDay = 0;
  activeTab = "home";
  builder.hidden = true;
  result.hidden = false;
  document.body.classList.add("trip-mode");
  renderTrip();
  switchAppTab("home");
}

restoreSavedTrip();
