// src/services/userService.js
import geohash from 'ngeohash';
import appwrite from './appwrite';
import { Query } from 'appwrite';
import { DATABASE_ID, USERS_COLLECTION_ID, GEOHASHES_COLLECTION_ID } from './appwrite';
import { getCurrentPosition } from './locationService';
import { storeUserGeohashes } from './locationService';

// Calculer la distance entre deux points (formule de Haversine)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance en km
};

// Fonction pour créer un nouvel utilisateur
export const createUser = async (userData) => {
  try {
    const newUser = await appwrite.databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      'unique()',
      userData
    );
    
    // Stocker les geohashes pour le nouvel utilisateur
    if (userData.lat && userData.long) {
      await storeUserGeohashes(newUser.$id, userData.lat, userData.long);
    }
    
    return newUser;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

// Trouver les utilisateurs à proximité
export const findNearbyUsers = async (distance = 10, currentUserId = null) => {
  try {
    // Obtenir la position actuelle (factice pour l'exemple)
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // Déterminer la précision du geohash en fonction de la distance
    let precision = 9; // Maximum de précision
    if (distance > 5) precision = 6;
    if (distance > 20) precision = 5;
    if (distance > 100) precision = 4;
    if (distance > 500) precision = 3;
    if (distance > 2000) precision = 2;
    
    // Créer le geohash du centre
    const centerGeohash = geohash.encode(latitude, longitude, precision);
    
    // Obtenir les geohashes adjacents
    const neighbors = geohash.neighbors(centerGeohash);
    neighbors.push(centerGeohash); // Ajouter le centre
    
    // Trouver les utilisateurs dans ces zones
    const { documents: geohashDocs } = await appwrite.databases.listDocuments(
        DATABASE_ID,
        GEOHASHES_COLLECTION_ID,
        [Query.equal('geohash', neighbors)] // Retirez la vérification avec userIds
    );
    
    // Extraire les IDs d'utilisateurs uniques
    const userIds = [...new Set(geohashDocs.map(doc => doc.userId))];
    
    if (userIds.length === 0) return [];
    
    // Récupérer les profils utilisateurs
    const { documents: userDocs } = await appwrite.databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userIds.length > 0 ? [Query.equal('$id', userIds)] : []
    );
    
    // Calculer la distance pour chaque utilisateur
    const nearbyUsers = userDocs
      .filter(user => !currentUserId || user.$id !== currentUserId)
      .map(user => ({
        ...user,
        distance: calculateDistance(latitude, longitude, user.lat, user.long)
      }))
      // Filtrer par distance maximale
      .filter(user => user.distance <= distance)
      // Trier du plus proche au plus éloigné
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs à proximité:', error);
    throw error;
  }
};
