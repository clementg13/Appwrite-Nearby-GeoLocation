import React, { useState, useEffect } from 'react';
import { findNearbyUsers, findNearbyUsersWithAdjacent } from '../services/userService';
import { getCurrentPosition } from '../services/locationService';
import geohash from 'ngeohash';

const NearbyUsers = ({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(10);
  const [method, setMethod] = useState('standard');
  const [currentGeohash, setCurrentGeohash] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [searchGeohashes, setSearchGeohashes] = useState([]);
  const [extendedGeohashes, setExtendedGeohashes] = useState([]);
  const [standardUsers, setStandardUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        // Get current position
        const position = await getCurrentPosition();
        setCurrentPosition(position.coords);
        
        // Calculate current user's geohash with different precision levels
        const { latitude, longitude } = position.coords;
        const fullGeohash = geohash.encode(latitude, longitude, 9);
        
        // Create an object with different precision levels
        const geohashLevels = {};
        for (let precision = 9; precision >= 1; precision--) {
          geohashLevels[precision] = fullGeohash.substring(0, precision);
        }
        setCurrentGeohash(geohashLevels);
        
        // Determine the precision for search based on distance
        let standardPrecision = 9;
        if (distance > 5) standardPrecision = 6;
        if (distance > 20) standardPrecision = 5;
        if (distance > 100) standardPrecision = 4;
        if (distance > 500) standardPrecision = 3;
        if (distance > 2000) standardPrecision = 2;
        
        // Get center geohash for standard search
        const standardCenterGeohash = fullGeohash.substring(0, standardPrecision);
        
        // Get standard search geohashes (center + neighbors)
        const standardNeighbors = geohash.neighbors(standardCenterGeohash);
        standardNeighbors.push(standardCenterGeohash);
        setSearchGeohashes(standardNeighbors);
        
        // Calculate extended geohashes for extended search
        let extendedPrecision = standardPrecision;
        if (distance > 5) extendedPrecision = 5; // Reduced precision for extended
        if (distance > 20) extendedPrecision = 4;
        if (distance > 100) extendedPrecision = 3;
        if (distance > 500) extendedPrecision = 2;
        if (distance > 2000) extendedPrecision = 1;
        
        const extendedCenterGeohash = fullGeohash.substring(0, extendedPrecision);
        const firstLevelNeighbors = geohash.neighbors(extendedCenterGeohash);
        firstLevelNeighbors.push(extendedCenterGeohash);
        
        // For extended search, also get neighbors of neighbors
        let allExpandedGeohashes = [...firstLevelNeighbors];
        
        if (distance > 10) {
          const secondLevelGeohashes = [];
          for (const neighborHash of firstLevelNeighbors) {
            const secondaryNeighbors = geohash.neighbors(neighborHash);
            secondLevelGeohashes.push(...secondaryNeighbors);
          }
          
          // Add all second level neighbors (without duplicates)
          allExpandedGeohashes = [...new Set([...allExpandedGeohashes, ...secondLevelGeohashes])];
        }
        
        // Calculate which geohashes are unique to the extended search
        const standardGeohashSet = new Set(standardNeighbors);
        const additionalGeohashes = allExpandedGeohashes.filter(gh => !standardGeohashSet.has(gh));
        setExtendedGeohashes(additionalGeohashes);
        
        // Load nearby users with standard method first
        const standardNearbyUsers = await findNearbyUsers(distance, currentUserId);
        setStandardUsers(standardNearbyUsers.map(user => user.$id));
        
        // Then, based on selected method, decide if extended search is needed
        if (method === 'standard') {
          setUsers(standardNearbyUsers);
        } else {
          const extendedUsers = await findNearbyUsersWithAdjacent(distance, currentUserId);
          setUsers(extendedUsers);
        }
      } catch (error) {
        console.error('Error loading nearby users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [distance, method, currentUserId]);

  const handleDistanceChange = (e) => {
    setDistance(Number(e.target.value));
  };

  const handleMethodChange = (e) => {
    setMethod(e.target.value);
  };

  const isExtendedUser = (userId) => {
    return method === 'extended' && !standardUsers.includes(userId);
  };

  // Calculate user's geohash at the current precision level for display
  const getUserGeohash = (lat, long) => {
    // Determine the precision for search based on distance
    let precision = 9;
    if (distance > 5) precision = 6;
    if (distance > 20) precision = 5;
    if (distance > 100) precision = 4;
    if (distance > 500) precision = 3;
    if (distance > 2000) precision = 2;
    
    return geohash.encode(lat, long, precision);
  };

  return (
    <div className="nearby-users-container">
      <h2>Utilisateurs à proximité</h2>
      
      {currentPosition && (
        <div className="current-location">
          <h3>Votre position</h3>
          <p>Latitude: {currentPosition.latitude.toFixed(6)}</p>
          <p>Longitude: {currentPosition.longitude.toFixed(6)}</p>
        </div>
      )}
      
      {currentGeohash && (
        <div className="geohash-info">
          <h3>Votre Geohash</h3>
          <table>
            <thead>
              <tr>
                <th>Précision</th>
                <th>Geohash</th>
                <th>Taille approx.</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(currentGeohash).map(([precision, hash]) => (
                <tr key={precision}>
                  <td>{precision}</td>
                  <td>{hash}</td>
                  <td>{getPrecisionDescription(Number(precision))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="search-geohashes">
        <h3>Geohashes utilisés pour la recherche {method === 'extended' ? '(méthode étendue)' : '(méthode standard)'}</h3>
        <h4>Cellules standard:</h4>
        <div className="geohash-chips">
          {searchGeohashes.map((hash, index) => (
            <span key={index} className="geohash-chip" title={`Geohash: ${hash}`}>
              {hash}
            </span>
          ))}
        </div>
        
        {method === 'extended' && extendedGeohashes.length > 0 && (
          <>
            <h4>Cellules additionnelles (recherche étendue):</h4>
            <div className="geohash-chips extended-chips">
              {extendedGeohashes.map((hash, index) => (
                <span key={index} className="geohash-chip extended-chip" title={`Geohash étendu: ${hash}`}>
                  {hash}
                </span>
              ))}
            </div>
            <div className="extended-stats">
              <p>{extendedGeohashes.length} cellules additionnelles pour une couverture étendue</p>
            </div>
          </>
        )}
      </div>
      
      <div className="filters">
        <div className="filter-group">
          <label>
            Distance maximale (km):
            <select value={distance} onChange={handleDistanceChange}>
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            Méthode de recherche:
            <select value={method} onChange={handleMethodChange}>
              <option value="standard">Standard</option>
              <option value="extended">Étendue</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p>Chargement des utilisateurs...</p>
      ) : (
        <div className="users-list">
          <h3>{users.length} utilisateurs trouvés</h3>
          {users.length === 0 ? (
            <p>Aucun utilisateur à proximité.</p>
          ) : (
            <ul>
              {users.map(user => (
                <li 
                  key={user.$id} 
                  className={`user-card ${isExtendedUser(user.$id) ? 'extended-user' : ''}`}
                >
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p>Distance: {user.distance.toFixed(2)} km</p>
                    <p>Lat: {user.lat.toFixed(6)} / Long: {user.long.toFixed(6)}</p>
                    <p>Geohash: <span className="user-geohash">{getUserGeohash(user.lat, user.long)}</span></p>
                    {isExtendedUser(user.$id) && (
                      <span className="extended-badge">Trouvé via recherche étendue</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to describe geohash precision
function getPrecisionDescription(precision) {
  const descriptions = {
    1: "≈ 5,000km (continent)",
    2: "≈ 1,250km (pays)",
    3: "≈ 156km (région)",
    4: "≈ 39km (ville)",
    5: "≈ 4.9km (quartier)",
    6: "≈ 1.2km (secteur)",
    7: "≈ 153m (rue)",
    8: "≈ 38m (bâtiment)",
    9: "≈ 4.8m (précis)"
  };
  return descriptions[precision] || `Précision ${precision}`;
}

export default NearbyUsers;
