# Plan de migration : localStorage → IndexedDB

## Contexte

L'application utilise actuellement localStorage pour :
- Sauvegarder le fichier TOML principal (`cashflow-current-file`)
- Gérer les backups automatiques (`cashflow-backups`)

### Limitations actuelles de localStorage
- Limite de stockage : ~5-10 MB
- API synchrone (bloque le thread principal)
- Risque de `QuotaExceededError` avec de gros fichiers
- Pas de support pour transactions ou index

### Avantages d'IndexedDB
- Limite de stockage : plusieurs centaines de MB à GB
- API asynchrone (performante)
- Support des transactions ACID
- Support des index pour requêtes rapides
- Meilleure gestion des données structurées

## Architecture actuelle

### Fichiers concernés
- `src/lib/infrastructure/fileStorage.js` : Fonctions de stockage
- `src/lib/stores/dataStore.js` : Utilise `saveToLocalStorage()`
- Tests associés

### Fonctions localStorage à migrer
```javascript
// fileStorage.js
- saveToLocalStorage(data, fileName)       // ligne 176
- getFromLocalStorage()                    // ligne 212
- clearFromLocalStorage()                  // ligne 225
- getBackups()                             // ligne 238
- saveBackups(backups)                     // ligne 253
- cleanupOldBackups(maxBackups)            // ligne 308
```

### Clés localStorage utilisées
```javascript
'cashflow-current-file'  // Fichier TOML actuel avec métadonnées
'cashflow-backups'       // Array des backups avec contenu et timestamps
```

## Plan de migration

### Phase 1 : Création de la couche IndexedDB

**Fichier** : `src/lib/infrastructure/indexedDbStorage.js`

#### 1.1 Structure de la base de données
```javascript
Nom de la DB : 'cashflow-chronicles'
Version : 1

Object Stores :
  1. 'currentFile'
     - keyPath: 'id' (valeur fixe: 'current')
     - Index: fileName, lastModified

  2. 'backups'
     - keyPath: 'id' (généré automatiquement)
     - Index: name, timestamp
```

#### 1.2 Fonctions à implémenter
- `initDatabase()` : Initialise la base de données
- `saveToIndexedDB(data, fileName)` : Sauvegarde le fichier actuel
- `getFromIndexedDB()` : Récupère le fichier actuel
- `clearFromIndexedDB()` : Supprime le fichier actuel
- `saveBackupsToIndexedDB(backups)` : Sauvegarde les backups
- `getBackupsFromIndexedDB()` : Récupère les backups
- `deleteBackupFromIndexedDB(backupId)` : Supprime un backup
- `cleanupOldBackupsFromIndexedDB(maxBackups)` : Nettoie les vieux backups
- `getDatabaseStats()` : Statistiques d'utilisation

#### 1.3 Gestion d'erreurs
- Détecter si IndexedDB est disponible
- Fallback vers localStorage si nécessaire
- Gestion des erreurs de quota
- Gestion des erreurs de transaction

### Phase 2 : Migration des données existantes

**Fichier** : `src/lib/infrastructure/migrationHelper.js`

#### 2.1 Fonction de migration
```javascript
migrateFromLocalStorageToIndexedDB()
  1. Vérifier si migration déjà effectuée
  2. Lire 'cashflow-current-file' depuis localStorage
  3. Lire 'cashflow-backups' depuis localStorage
  4. Sauvegarder dans IndexedDB
  5. Vérifier l'intégrité des données
  6. Supprimer de localStorage (optionnel, garder backup temporaire)
  7. Marquer migration comme complétée
```

#### 2.2 Détection de migration nécessaire
- Créer une clé `'cashflow-migrated-to-indexeddb'` dans localStorage
- Vérifier au démarrage de l'application
- Exécuter migration automatiquement si nécessaire

### Phase 3 : Mise à jour de fileStorage.js

#### 3.1 Refactorisation
- Remplacer toutes les fonctions localStorage par IndexedDB
- Garder les mêmes signatures de fonction (compatibilité)
- Ajouter des fonctions de compatibilité si nécessaire

#### 3.2 Fonctions à modifier
```javascript
// Avant
export function saveToLocalStorage(data, fileName)

// Après
export async function saveToStorage(data, fileName) {
  return await saveToIndexedDB(data, fileName);
}

// Créer des alias pour compatibilité ascendante
export const saveToLocalStorage = saveToStorage;
```

#### 3.3 Mise à jour des appels asynchrones
- Toutes les fonctions de stockage deviennent `async`
- Mettre à jour les appels dans `fileStorage.js` :
  - `createBackup()` : async
  - `saveToFile()` : déjà async, ajouter await pour saveToStorage

### Phase 4 : Mise à jour de dataStore.js

#### 4.1 Modifications nécessaires
```javascript
// Ligne 65 - dans loadData()
await saveToStorage(parsedData, fileName);

// Importer la nouvelle fonction
import { saveToFile, saveToStorage } from '../infrastructure/fileStorage.js';
```

### Phase 5 : Tests

#### 5.1 Nouveaux fichiers de tests
- `src/lib/infrastructure/__tests__/indexedDbStorage.test.js`
- `src/lib/infrastructure/__tests__/migrationHelper.test.js`

#### 5.2 Mise à jour des tests existants
- `src/lib/infrastructure/__tests__/fileStorage.test.js`
  - Mocker IndexedDB
  - Tester les fonctions async
- `src/lib/stores/__tests__/dataStore.test.js`
  - Mettre à jour les mocks pour fonctions async

#### 5.3 Tests E2E
- Vérifier US-001-03 (sauvegarde TOML)
- Vérifier US-001-04 (backups)
- Vérifier US-001-06 (auto-save)
- Tester la migration avec données existantes

### Phase 6 : Initialisation au démarrage

**Fichier** : `src/routes/+layout.svelte` ou point d'entrée principal

#### 6.1 Initialisation
```javascript
import { onMount } from 'svelte';
import { initDatabase } from '$lib/infrastructure/indexedDbStorage.js';
import { migrateFromLocalStorageToIndexedDB } from '$lib/infrastructure/migrationHelper.js';

onMount(async () => {
  // Initialiser IndexedDB
  await initDatabase();

  // Migration automatique si nécessaire
  await migrateFromLocalStorageToIndexedDB();
});
```

### Phase 7 : Documentation et nettoyage

#### 7.1 Documentation
- Mettre à jour README.md
- Documenter l'architecture IndexedDB
- Documenter le processus de migration

#### 7.2 Nettoyage
- Vérifier que tous les tests passent
- Supprimer le code mort
- Vérifier les performances

## Ordre d'implémentation recommandé

1. **Créer indexedDbStorage.js** avec toutes les fonctions de base
2. **Créer les tests pour indexedDbStorage.js**
3. **Créer migrationHelper.js**
4. **Créer les tests pour migrationHelper.js**
5. **Mettre à jour fileStorage.js** pour utiliser IndexedDB
6. **Mettre à jour les tests de fileStorage.js**
7. **Mettre à jour dataStore.js**
8. **Mettre à jour les tests de dataStore.js**
9. **Ajouter l'initialisation au démarrage**
10. **Tester l'ensemble des fonctionnalités E2E**
11. **Documenter et nettoyer**

## Points d'attention

### Compatibilité navigateur
- IndexedDB est supporté par tous les navigateurs modernes
- Prévoir un fallback vers localStorage pour navigateurs très anciens
- Tester sur Safari (comportement parfois différent)

### Performances
- IndexedDB est asynchrone : ne bloque pas l'UI
- Utiliser des transactions pour opérations multiples
- Implémenter un système de cache en mémoire si nécessaire

### Sécurité
- IndexedDB est lié au domaine (comme localStorage)
- Les données ne sont pas chiffrées par défaut
- Envisager le chiffrement pour données sensibles (future amélioration)

### Migration progressive
- La migration est automatique et transparente
- Garder localStorage comme fallback temporaire
- Possibilité de revenir en arrière si problème détecté

## Estimation

- **Phase 1** : Création couche IndexedDB - 4-6 heures
- **Phase 2** : Migration des données - 2-3 heures
- **Phase 3** : Mise à jour fileStorage - 2-3 heures
- **Phase 4** : Mise à jour dataStore - 1 heure
- **Phase 5** : Tests - 4-5 heures
- **Phase 6** : Initialisation - 1 heure
- **Phase 7** : Documentation - 2 heures

**Total estimé** : 16-21 heures de développement

## Risques et mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Corruption de données lors de la migration | Élevé | Faible | Backup localStorage avant migration, validation après |
| IndexedDB non disponible | Moyen | Très faible | Fallback vers localStorage |
| Problèmes de performances | Faible | Faible | Tests de charge, optimisation des requêtes |
| Erreurs dans les tests async | Moyen | Moyen | Bonne couverture de tests, mocks appropriés |

## Prochaines étapes

1. Valider ce plan avec l'équipe
2. Créer une branche dédiée : `feature/migrate-to-indexeddb`
3. Commencer l'implémentation phase par phase
4. Faire des revues de code intermédiaires
5. Tester en profondeur avant merge sur main

## Références

- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
- [Working with IndexedDB](https://developers.google.com/web/ilt/pwa/working-with-indexeddb)
