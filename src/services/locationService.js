// src/services/locationService.js
import geohash from 'ngeohash';
import appwrite from './appwrite';
import { DATABASE_ID, USERS_COLLECTION_ID, GEOHASHES_COLLECTION_ID } from './appwrite';

// Fonction simulant la récupération de position pour un test web
const getMockPosition = () => {
  // Paris, France comme position par défaut
  return {
    coords: {
      latitude: 48.8566,
      longitude: 2.3522
    }
  };
};

// Obtenir la position actuelle (factice pour l'exemple)
export const getCurrentPosition = () => {
  return Promise.resolve(getMockPosition());
};

// Fonction pour mettre à jour la position d'un utilisateur
export const updateUserLocation = async (userId, mockLocation = null) => {
  try {
    // Utiliser une position mockée ou en obtenir une nouvelle
    const position = mockLocation || await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // Mettre à jour la position dans la collection Users
    await appwrite.databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        lat: latitude,
        long: longitude
      }
    );
    
    // Générer et stocker les geohashes
    await storeUserGeohashes(userId, latitude, longitude);
    
    return position;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la position:', error);
    throw error;
  }
};

// Stocker les geohashes pour un utilisateur
export const storeUserGeohashes = async (userId, latitude, longitude) => {
  // Créer le geohash précis (9 caractères)
  const fullGeohash = geohash.encode(latitude, longitude, 9);
  
  // Supprimer les anciens geohashes
  try {
    const { documents } = await appwrite.databases.listDocuments(
      DATABASE_ID,
      GEOHASHES_COLLECTION_ID,
      [`userId=${userId}`]
    );
    
    for (const doc of documents) {
      await appwrite.databases.deleteDocument(
        DATABASE_ID,
        GEOHASHES_COLLECTION_ID,
        doc.$id
      );
    }
  } catch (error) {
    console.log('Erreur lors de la suppression des anciens geohashes', error);
  }
  
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
    await appwrite.databases.createDocument(
      DATABASE_ID,
      GEOHASHES_COLLECTION_ID,
      'unique()',
      gh
    );
  }
};
