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
        distance: calculateDistance(latitude, longitude, user.lat, user.long),
        geohash: geohash.encode(user.lat, user.long, precision) // Add user's geohash
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

// Trouver tous les utilisateurs à proximité par calcul brut (méthode de référence)
export const findAllNearbyUsers = async (distance = 10) => {
  try {
    // Obtenir tous les utilisateurs
    const { documents: allUsers } = await appwrite.databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );
    
    // Obtenir la position actuelle
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // Calculer la distance pour chaque utilisateur
    const usersWithDistance = allUsers.map(user => ({
      ...user,
      distance: calculateDistance(latitude, longitude, user.lat, user.long)
    }));
    
    // Filtrer par distance et trier
    const nearbyUsers = usersWithDistance
      .filter(user => user.distance <= distance)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  } catch (error) {
    console.error('Erreur lors de la recherche brute d\'utilisateurs:', error);
    throw error;
  }
};

// Trouver les utilisateurs manqués en comparant les deux méthodes
export const findMissedUsers = async (distance = 10) => {
  // Obtenir les utilisateurs par méthode geohash
  const geohashUsers = await findNearbyUsers(distance);
  const geohashUserIds = new Set(geohashUsers.map(user => user.$id));
  
  // Obtenir tous les utilisateurs à proximité par calcul brut
  const allNearbyUsers = await findAllNearbyUsers(distance);
  
  // Trouver les utilisateurs qui sont proches mais pas dans les résultats geohash
  const missedUsers = allNearbyUsers.filter(user => !geohashUserIds.has(user.$id));
  
  return {
    found: geohashUsers,
    missed: missedUsers,
    totalNearby: allNearbyUsers.length
  };
};

// Recherche étendue incluant les cellules adjacentes
export const findNearbyUsersWithAdjacent = async (distance = 10, currentUserId = null) => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // MODIFICATION 1: Réduire la précision du geohash pour élargir la zone
    // Utiliser une précision plus faible que dans findNearbyUsers
    let precision = 9;
    if (distance > 5) precision = 5; // Une précision de niveau inférieur
    if (distance > 20) precision = 4;
    if (distance > 100) precision = 3;
    if (distance > 500) precision = 2;
    if (distance > 2000) precision = 1;
    
    // Créer le geohash central avec précision réduite
    const centerGeohash = geohash.encode(latitude, longitude, precision);
    
    // Obtenir les cellules voisines et le centre
    const neighbors = geohash.neighbors(centerGeohash);
    neighbors.push(centerGeohash);
    
    // MODIFICATION 2: Étendre aux voisins des voisins pour les plus grandes distances
    let expandedNeighbors = [...neighbors];
    if (distance > 10) {
      // Pour chaque voisin, obtenir ses propres voisins
      for (const neighborHash of neighbors) {
        const secondaryNeighbors = geohash.neighbors(neighborHash);
        expandedNeighbors = [...expandedNeighbors, ...secondaryNeighbors];
      }
      // Éliminer les doublons
      expandedNeighbors = [...new Set(expandedNeighbors)];
    }
    
    // Obtenir tous les utilisateurs dans ces cellules
    const { documents: geohashDocs } = await appwrite.databases.listDocuments(
      DATABASE_ID,
      GEOHASHES_COLLECTION_ID,
      [Query.equal('geohash', expandedNeighbors)]
    );
    
    // Extraire les IDs uniques
    const userIds = [...new Set(geohashDocs.map(doc => doc.userId))];
    
    if (userIds.length === 0) return [];
    
    // Récupérer les documents utilisateurs
    const { documents: userDocs } = await appwrite.databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userIds.length > 0 ? [Query.equal('$id', userIds)] : []
    );
    
    // Calculer la distance, filtrer et trier
    const nearbyUsers = userDocs
      .filter(user => !currentUserId || user.$id !== currentUserId)
      .map(user => ({
        ...user,
        distance: calculateDistance(latitude, longitude, user.lat, user.long),
        geohash: geohash.encode(user.lat, user.long, precision) // Add user's geohash
      }))
      .filter(user => user.distance <= distance)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  } catch (error) {
    console.error('Erreur lors de la recherche étendue:', error);
    throw error;
  }
};
