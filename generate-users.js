// generate-users.js
const { Client, Databases } = require('node-appwrite');
const ngeohash = require('ngeohash');
require('dotenv').config({ path: '.env.local' });

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Remplacez par votre endpoint
  .setProject(process.env.REACT_APP_PROJECT_ID) // Remplacez par votre ID de projet
  .setKey(process.env.APPWRITE_API_KEY); // Créez une clé API dans le dashboard Appwrite

const databases = new Databases(client);

// Constantes pour les identifiants
const DATABASE_ID = process.env.REACT_APP_DATABASE_ID;
const USERS_COLLECTION_ID = process.env.REACT_APP_USERS_COLLECTION_ID;
const GEOHASHES_COLLECTION_ID = process.env.REACT_APP_GEOHASHES_COLLECTION_ID;
console.log(DATABASE_ID, USERS_COLLECTION_ID, GEOHASHES_COLLECTION_ID);
// Position centrale (Paris)
const CENTER_LAT = 48.8566;
const CENTER_LON = 2.3522;

// Noms aléatoires pour les utilisateurs
const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Camille', 'Lucas', 'Emma', 'Hugo', 'Léa'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];

// Génère un nom aléatoire
const getRandomName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Génère une bio aléatoire
const getRandomBio = () => {
  const bios = [
    'J\'aime voyager et découvrir de nouveaux endroits.',
    'Passionné(e) de photographie et de nature.',
    'Fan de cinéma et de séries télé.',
    'Amateur de bonne cuisine et de vin.',
    'Sportif/sportive, j\'aime courir et faire du vélo.'
  ];
  return bios[Math.floor(Math.random() * bios.length)];
};

// Génère un genre aléatoire
const getRandomGender = () => {
  const genders = ['Homme', 'Femme', 'Non-binaire'];
  return genders[Math.floor(Math.random() * genders.length)];
};

// Génère des coordonnées proches ou lointaines
const generateLocation = (isNearby) => {
  // Conversion de km en degrés (approximatif)
  // 1 degré = environ 111km à l'équateur
  const degreesPerKm = 1 / 111;
  
  if (isNearby) {
    // Générer des coordonnées dans un rayon de 5km
    const radius = 5 * degreesPerKm;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;
    
    const lat = CENTER_LAT + (distance * Math.sin(angle));
    const lon = CENTER_LON + (distance * Math.cos(angle) / Math.cos(CENTER_LAT * Math.PI / 180));
    
    return { lat, lon };
  } else {
    // Générer des coordonnées dans un rayon de 20-100km
    const minRadius = 20 * degreesPerKm;
    const maxRadius = 100 * degreesPerKm;
    const radius = minRadius + (Math.random() * (maxRadius - minRadius));
    const angle = Math.random() * 2 * Math.PI;
    
    const lat = CENTER_LAT + (radius * Math.sin(angle));
    const lon = CENTER_LON + (radius * Math.cos(angle) / Math.cos(CENTER_LAT * Math.PI / 180));
    
    return { lat, lon };
  }
};

// Stocker les geohashes pour un utilisateur
async function storeUserGeohashes(userId, latitude, longitude) {
  // Créer le geohash précis (9 caractères)
  const fullGeohash = ngeohash.encode(latitude, longitude, 9);
  
  // Créer tous les niveaux de précision du geohash
  const geohashes = [];
  for (let precision = 9; precision >= 1; precision--) {
    const gh = fullGeohash.substring(0, precision);
    geohashes.push({
      userId: userId,
      geohash: gh
    });
  }
  
  // Stocker les nouveaux geohashes
  for (const gh of geohashes) {
    await databases.createDocument(
      DATABASE_ID,
      GEOHASHES_COLLECTION_ID,
      'unique()',
      gh
    );
  }
}

// Fonction principale pour générer les utilisateurs
async function generateUsers() {
  try {
    console.log('Début de la génération des utilisateurs factices...');
    
    // Générer 15 utilisateurs proches
    console.log('Génération des utilisateurs proches...');
    for (let i = 0; i < 15; i++) {
      const location = generateLocation(true);
      const userData = {
        name: getRandomName(),
        bio: getRandomBio(),
        gender: getRandomGender(),
        lat: location.lat,
        long: location.lon
      };
      
      // Créer l'utilisateur
      const newUser = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        'unique()',
        userData
      );
      
      // Stocker ses geohashes
      await storeUserGeohashes(newUser.$id, location.lat, location.lon);
      
      console.log(`Utilisateur proche #${i+1} créé: ${userData.name}`);
    }
    
    // Générer 15 utilisateurs lointains
    console.log('Génération des utilisateurs lointains...');
    for (let i = 0; i < 15; i++) {
      const location = generateLocation(false);
      const userData = {
        name: getRandomName(),
        bio: getRandomBio(),
        gender: getRandomGender(),
        lat: location.lat,
        long: location.lon
      };
      
      // Créer l'utilisateur
      const newUser = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        'unique()',
        userData
      );
      
      // Stocker ses geohashes
      await storeUserGeohashes(newUser.$id, location.lat, location.lon);
      
      console.log(`Utilisateur lointain #${i+1} créé: ${userData.name}`);
    }
    
    console.log('Génération des utilisateurs terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la génération des utilisateurs:', error);
  }
}

// Fonction pour générer des utilisateurs spécifiquement aux bordures des geohash
const generateBorderUsers = async () => {
  // Position centrale (Paris)
  const centerLat = 48.8566;
  const centerLon = 2.3522;
  
  // Geohash central
  const centerGeohash = ngeohash.encode(centerLat, centerLon, 6);
  
  // Obtenir les geohashes voisins
  const neighbors = ngeohash.neighbors(centerGeohash);
  
  console.log(`Geohash central: ${centerGeohash}`);
  console.log(`Geohashes voisins: ${neighbors.join(', ')}`);
  
  // Pour chaque voisin, créer un utilisateur très proche de la frontière
  for (let i = 0; i < neighbors.length; i++) {
    const neighborHash = neighbors[i];
    
    // Décoder le geohash voisin pour obtenir ses coordonnées
    const neighborCoords = ngeohash.decode(neighborHash);
    
    // Créer un point très proche de la frontière avec le geohash central
    const factor = 0.0005; // ~50 mètres
    const latAdjust = (centerLat - neighborCoords.latitude) * 0.1 * factor;
    const lonAdjust = (centerLon - neighborCoords.longitude) * 0.1 * factor;
    
    const userData = {
      name: `Utilisateur Frontalier ${i+1}`,
      bio: `Je suis situé juste à la frontière du geohash ${centerGeohash}`,
      gender: Math.random() > 0.5 ? 'Homme' : 'Femme',
      lat: neighborCoords.latitude + latAdjust,
      long: neighborCoords.longitude + lonAdjust,
      isBorderUser: true
    };
    
    // Créer l'utilisateur
    const newUser = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      'unique()',
      userData
    );
    
    // Stocker ses geohashes
    await storeUserGeohashes(newUser.$id, userData.lat, userData.long);
    
    console.log(`Utilisateur frontalier créé: ${userData.name} dans ${neighborHash}`);
  }
  
  console.log('Utilisateurs frontaliers créés avec succès!');
};

// Exécuter la fonction
generateUsers();
generateBorderUsers();
