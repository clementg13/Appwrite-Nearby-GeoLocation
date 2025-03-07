// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import NearbyUsers from './components/NearbyUsers';
import appwrite from './services/appwrite';
import { getCurrentPosition, updateUserLocation } from './services/locationService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const currentUser = await appwrite.account.get();
        setUser(currentUser);
        
        // Si connecté, mettre à jour sa position
        if (currentUser) {
          const position = await getCurrentPosition();
          await updateUserLocation(currentUser.$id, position);
        }
      } catch (error) {
        console.log('Utilisateur non connecté');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Pour l'exemple, on utilise un ID utilisateur factice
  const mockUserId = 'current-user-id';

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Application de géolocalisation avec Appwrite</h1>
      </header>
      <main>
        <NearbyUsers currentUserId={user ? user.$id : mockUserId} />
      </main>
    </div>
  );
}

export default App;
