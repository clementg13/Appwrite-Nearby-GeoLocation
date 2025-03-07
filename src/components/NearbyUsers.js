import React, { useState, useEffect } from 'react';
import { findNearbyUsers, findMissedUsers, findNearbyUsersWithAdjacent } from '../services/userService';

const NearbyUsers = () => {
  const [users, setUsers] = useState([]);
  const [missedUsers, setMissedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(10);
  const [searchMode, setSearchMode] = useState('standard'); // 'standard' ou 'extended'

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        if (searchMode === 'standard') {
          // Mode standard - utilisez la méthode geohash simple
          const result = await findMissedUsers(distance);
          setUsers(result.found);
          setMissedUsers(result.missed);
        } else {
          // Mode étendu - recherche dans les cellules adjacentes
          const extendedUsers = await findNearbyUsersWithAdjacent(distance);
          setUsers(extendedUsers);
          setMissedUsers([]);
        }
        
        setError(null);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les utilisateurs proches");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [distance, searchMode]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="nearby-users">
      <h2>Utilisateurs à proximité ({distance} km)</h2>
      
      <div className="distance-controls">
        <button onClick={() => setDistance(5)}>5 km</button>
        <button onClick={() => setDistance(10)}>10 km</button>
        <button onClick={() => setDistance(50)}>50 km</button>
        <button 
          className={`mode-button ${searchMode === 'extended' ? 'active' : ''}`}
          onClick={() => setSearchMode(searchMode === 'standard' ? 'extended' : 'standard')}
        >
          {searchMode === 'standard' ? 'Activer recherche zones adjacentes' : 'Désactiver recherche étendue'}
        </button>
      </div>
      
      {missedUsers.length > 0 && searchMode === 'standard' && (
        <div className="missed-users-warning">
          <p><strong>Attention:</strong> {missedUsers.length} utilisateurs sont à proximité mais n'ont pas été trouvés 
             à cause de l'effet de bordure du geohash.</p>
          <button onClick={() => setSearchMode('extended')}>
            Afficher tous les utilisateurs proches
          </button>
        </div>
      )}
      
      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé à proximité</p>
      ) : (
        <div>
          <p>Utilisateurs trouvés: {users.length}</p>
          <ul className="user-list">
            {users.map(user => (
              <li key={user.$id} className={`user-card ${user.isBorderUser ? 'border-user' : ''}`}>
                <h3>{user.name}</h3>
                <p><strong>Distance:</strong> {user.distance.toFixed(2)} km</p>
                <p>{user.bio}</p>
                {user.isBorderUser && (
                  <span className="border-badge">Utilisateur à la bordure</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {searchMode === 'extended' && (
        <div className="search-info">
          <p>Mode de recherche étendu activé. La recherche inclut les cellules geohash adjacentes.</p>
        </div>
      )}
    </div>
  );
};

export default NearbyUsers;
