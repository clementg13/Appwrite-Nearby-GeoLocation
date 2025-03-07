// src/services/appwrite.js
import { Client, Databases, Account } from 'appwrite';

const client = new Client();

const appwrite = {
  client: client
    .setEndpoint('https://cloud.appwrite.io/v1') // Remplacez par votre endpoint si auto-hébergé
    .setProject(process.env.REACT_APP_PROJECT_ID), // Remplacez par votre ID de projet
  databases: new Databases(client),
  account: new Account(client)
};


// Constantes pour les identifiants des collections
export const DATABASE_ID = process.env.REACT_APP_DATABASE_ID;
export const USERS_COLLECTION_ID = process.env.REACT_APP_USERS_COLLECTION_ID;
export const GEOHASHES_COLLECTION_ID = process.env.REACT_APP_GEOHASHES_COLLECTION_ID;
export default appwrite;
