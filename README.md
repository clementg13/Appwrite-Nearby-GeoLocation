# 🌍 Appwrite Geohash Demo

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=appwrite&logoColor=white)
![GeoHash](https://img.shields.io/badge/GeoHash-00ADD8?style=for-the-badge&logo=map&logoColor=white)

---

🇬🇧 [English](#english-documentation) | 🇫🇷 [Français](#documentation-fran%C3%A7aise)

---

## English Documentation

### Overview

This application demonstrates how to implement geolocation-based user search with Appwrite, despite Appwrite 1.6 not having native geolocation queries. The solution uses Geohash encoding to efficiently find nearby users without having to calculate distances for all users in the database.

### 🌟 Features

- Find users near a location using Geohash algorithm
- Visualize Geohash cells at different precision levels
- Compare standard and extended search modes
- See which users were found through extended search
- Understand how Geohash improves geolocation queries
- Support for different search radiuses with appropriate geohash precision


### 💡 Understanding Geohash

Geohash is a hierarchical spatial data structure that converts 2D geographic coordinates into a short string of letters and digits. Each character added to a Geohash increases precision:


| Precision | Size | Real-world scope |
| :-- | :-- | :-- |
| 1 | ≈ 5,000km | Continent |
| 3 | ≈ 156km | Region |
| 5 | ≈ 4.9km | Neighborhood |
| 7 | ≈ 153m | Street |
| 9 | ≈ 4.8m | Precise location |

**Key Benefits:**

- Efficient storage: Geohashes are simple strings
- Hierarchical: Prefixes represent larger areas
- Fast proximity search: Find nearby points without calculating distances to all points
- Works with any DB: No need for specialized geo-database

**How It Works in This App:**

- Each user's location is encoded at multiple precision levels
- To find nearby users, we query for users in the same or adjacent Geohash cells
- Only then do we calculate exact distances for the subset of users
- The app demonstrates both standard and extended search strategies


### 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/Appwrite-Nearby-GeoLocation.git
cd appwrite-geohash-demo
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
Create a `.env.local` file in the project root:
```
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=your-project-id
REACT_APP_APPWRITE_DATABASE_ID=your-database-id
REACT_APP_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
REACT_APP_APPWRITE_GEOHASHES_COLLECTION_ID=your-geohashes-collection-id
REACT_APP_APPWRITE_API_KEY=your-api-key
```


### 🗄️ Appwrite Setup

1. **Create an Appwrite project**
    - Go to Appwrite Console and create a new project
2. **Create a database**
    - In your project, create a new database (note its ID for the `.env` file)
3. **Create collections**

**Users Collection:**
    - Create a collection named "Users"
    - Add the following attributes:
        - name (string, required)
        - lat (double, required)
        - long (double, required)
        - gender (string, optional)
        - bio (string, optional)
        - isBorderUser (boolean, optional)
    - Set appropriate permissions

**Geohashes Collection:**
    - Create a collection named "Geohashes"
    - Add the following attributes:
        - userId (string, required) - References the user's ID
        - geohash (string, required) - The geohash string
    - Create an index for faster queries on the geohash field
    - Set appropriate permissions
4. **Create an API Key**
    - Go to API Keys in the Appwrite console and create a new key with these permissions:
        - databases.collections.read
        - databases.documents.read
        - databases.documents.write
    - Save this key for the APPWRITE_API_KEY in your `.env.local` file

### 🧪 Generate Mock Users

Before running the application, you need to populate your database with mock users:

```bash
node generate-users.js
```

This script will create:

- 15 users near the default location (Paris)
- 15 users further away
- Several "border users" at the edges of Geohash cells to demonstrate boundary cases


### 🚀 Usage

1. **Run the application**
```bash
npm start
```

2. **Open the application**
    - Navigate to [http://localhost:3000](http://localhost:3000) in your browser
3. **Search for users**
    - Choose a search radius
    - View results on the map and in the list view
    - Toggle between standard and extended search modes to see the difference

### 🔍 Key Functions

- `findNearbyUsers`: Standard search using appropriate Geohash precision
- `findNearbyUsersWithAdjacent`: Extended search with neighboring cells
- `storeUserGeohashes`: Stores multiple precision levels for each user
- `calculateDistance`: Uses the Haversine formula to calculate actual distance


## Documentation Française

### Vue d'ensemble

Cette application démontre comment implémenter une recherche d'utilisateurs basée sur la géolocalisation avec Appwrite, malgré le fait qu'Appwrite 1.6 ne dispose pas de requêtes de géolocalisation natives. La solution utilise l'encodage Geohash pour trouver efficacement les utilisateurs à proximité sans avoir à calculer les distances pour tous les utilisateurs de la base de données.

### 🌟 Fonctionnalités

- Trouver des utilisateurs près d'une position en utilisant l'algorithme Geohash
- Visualiser les cellules Geohash à différents niveaux de précision
- Comparer les modes de recherche standard et étendu
- Voir quels utilisateurs ont été trouvés grâce à la recherche étendue
- Comprendre comment Geohash améliore les requêtes de géolocalisation
- Support de différents rayons de recherche avec une précision Geohash appropriée


### 💡 Comprendre Geohash

Geohash est une structure de données spatiale hiérarchique qui convertit les coordonnées géographiques 2D en une courte chaîne de lettres et de chiffres. Chaque caractère ajouté à un Geohash augmente la précision :


| Précision | Taille | Portée réelle |
| :-- | :-- | :-- |
| 1 | ≈ 5 000 km | Continent |
| 3 | ≈ 156 km | Région |
| 5 | ≈ 4,9 km | Quartier |
| 7 | ≈ 153 m | Rue |
| 9 | ≈ 4,8 m | Position précise |

**Avantages clés :**

- Stockage efficace : Les Geohashes sont de simples chaînes de caractères
- Hiérarchique : Les préfixes représentent des zones plus grandes
- Recherche de proximité rapide : Trouvez des points à proximité sans calculer les distances pour tous les points
- Fonctionne avec n'importe quelle BD : Pas besoin de base de données géospatiale spécialisée

**Comment ça fonctionne dans cette application :**

- La position de chaque utilisateur est encodée à plusieurs niveaux de précision
- Pour trouver des utilisateurs à proximité, nous recherchons des utilisateurs dans les mêmes cellules Geohash ou dans des cellules adjacentes
- Ce n'est qu'ensuite que nous calculons les distances exactes pour le sous-ensemble d'utilisateurs
- L'application démontre à la fois les stratégies de recherche standard et étendue


### 🛠️ Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/your-username/Appwrite-Nearby-GeoLocation.git
cd appwrite-geohash-demo
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Créer un fichier d'environnement**
Créez un fichier `.env.local` à la racine du projet :
```
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=votre-id-projet
REACT_APP_APPWRITE_DATABASE_ID=votre-id-database
REACT_APP_APPWRITE_USERS_COLLECTION_ID=votre-id-collection-utilisateurs
REACT_APP_APPWRITE_GEOHASHES_COLLECTION_ID=votre-id-collection-geohashes
REACT_APP_APPWRITE_API_KEY=votre-clé-api
```


### 🗄️ Configuration d'Appwrite

1. **Créer un projet Appwrite**
    - Rendez-vous sur la Console Appwrite et créez un nouveau projet
2. **Créer une base de données**
    - Dans votre projet, créez une nouvelle base de données (notez son ID pour le fichier `.env`)
3. **Créer des collections**

**Collection Utilisateurs :**
    - Créez une collection nommée "Users"
    - Ajoutez les attributs suivants :
        - name (chaîne, requis)
        - lat (double, requis)
        - long (double, requis)
        - gender (chaîne, optionnel)
        - bio (chaîne, optionnel)
        - isBorderUser (booléen, optionnel)
    - Définissez les permissions appropriées

**Collection Geohashes :**
    - Créez une collection nommée "Geohashes"
    - Ajoutez les attributs suivants :
        - userId (chaîne, requis) - Référence l'ID de l'utilisateur
        - geohash (chaîne, requis) - La chaîne de caractères du geohash
    - Créez un index sur le champ geohash pour des requêtes plus rapides
    - Définissez les permissions appropriées
4. **Créer une clé API**
    - Allez dans API Keys dans la console Appwrite et créez une nouvelle clé avec ces permissions :
        - databases.collections.read
        - databases.documents.read
        - databases.documents.write
    - Enregistrez cette clé pour APPWRITE_API_KEY dans votre fichier `.env.local`

### 🧪 Générer des Utilisateurs Fictifs

Avant de lancer l'application, vous devez peupler votre base de données avec des utilisateurs fictifs :

```bash
node run generate-users.js
```

Ce script créera :

- 15 utilisateurs près d'un emplacement par défaut (Paris)
- 15 utilisateurs plus éloignés
- Plusieurs "utilisateurs frontaliers" positionnés spécifiquement aux bords des cellules geohash pour démontrer les cas limites


### 🚀 Utilisation

1. **Lancer l'application**
```bash
npm start
```

2. **Ouvrir l'application**
    - Allez sur [http://localhost:3000](http://localhost:3000) dans votre navigateur
3. **Rechercher des utilisateurs**
    - Choisissez un rayon de recherche
    - Visualisez les résultats sur la carte et dans la vue liste
    - Basculez entre les modes de recherche standard et étendu pour voir la différence

### 🔍 Fonctions clés

- `findNearbyUsers` : Recherche standard utilisant une précision Geohash appropriée
- `findNearbyUsersWithAdjacent` : Recherche étendue avec cellules voisines
- `storeUserGeohashes` : Stocke plusieurs niveaux de précision pour chaque utilisateur
- `calculateDistance` : Utilise la formule de Haversine pour calculer la distance réelle
