// src/components/NearbyUsers.js
import React, { useState, useEffect } from 'react';
import { findNearbyUsers } from '../services/userService';

const NearbyUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const nearbyUsers = await findNearbyUsers(distance);
        setUsers(nearbyUsers);
        setError(null);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les utilisateurs proches");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [distance]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="nearby-users">
      <h2>Utilisateurs à proximité ({distance} km)</h2>
      
      <div className="distance-controls">
        <button onClick={() => setDistance(5)}>5 km</button>
        <button onClick={() => setDistance(10)}>10 km</button>
        <button onClick={() => setDistance(50)}>50 km</button>
      </div>
      
      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé à proximité</p>
      ) : (
        <ul className="user-list">
          {users.map(user => (
            <li key={user.$id} className="user-card">
              <h3>{user.name}</h3>
              <p><strong>Distance:</strong> {user.distance.toFixed(2)} km</p>
              <p>{user.bio}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NearbyUsers;
