# Documentation du Projet : Bibliothèque App

## Introduction

**Bibliothèque App** est une application web permettant de gérer les activités d'une bibliothèque, comme l'emprunt et le retour de livres. L'application utilise des technologies modernes côté client et serveur.

## Fonctionnalités principales

- **Ajout de livres** : Permet d'ajouter des livres à la base de données.
- **Gestion des utilisateurs** : Administration des comptes utilisateurs pour emprunter des livres.
- **Historique des emprunts** : Suivi des emprunts et retours.
- **Interface utilisateur dynamique** : Créée avec EJS pour des vues dynamiques.
- **API REST** : Gestion des données avec des endpoints sécurisés en JavaScript côté serveur.

## Technologies utilisées

- **Front-end** : 
  - EJS pour le rendu côté serveur.
  - CSS pour le design de l'interface utilisateur.

- **Back-end** :
  - Node.js et Express.js pour la logique applicative et le routage.
  - Structure MVC pour une séparation claire des responsabilités.

- **Base de données** :
  - MySQL

## Installation et Configuration

1. **Prérequis** :
   - Node.js installé sur votre machine.
   - Base de donnée MySQL

2. **Clonage du dépôt** :
   ```bash
   git clone https://github.com/Kanoox/bibliotheque_app.git
   cd bibliotheque_app
   ```

3. **Installation des dépendances** :
   ```bash
   npm install
   ```

4. **Configuration** :
   - Créez un fichier `.env` à la racine avec les variables suivantes :
     ```env
      DB_HOST=
      DB_USER=
      DB_PASS=
      DB_DATABASE=

      SECRET_KEY=UneCléSecrete
      PORT=3000 ## Pour le serveur web
     ```

5. **Lancement de l'application** :
   ```bash
   npm start
   ```

6. **Accéder à l'application** :
   Rendez-vous sur [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du projet

- **`public/`** : Fichiers statiques (CSS, JS côté client).
- **`views/`** : Modèles EJS pour les pages web.
- **`utils/`** : Scripts utilitaires pour le projet.
- **`server.js`** : Point d'entrée principal de l'application.

## Contribution

Les contributions sont les bienvenues ! Créez une *issue* ou soumettez une *pull request* avec vos suggestions.

## Licence

Aucune licence spécifique n'est mentionnée dans le dépôt pour le moment.

---

Si vous avez des questions ou souhaitez ajouter des détails supplémentaires, n’hésitez pas à me le faire savoir !