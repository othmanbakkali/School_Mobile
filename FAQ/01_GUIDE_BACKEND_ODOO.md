# 🖥️ Guide Complet Backend Odoo (Administration & Enseignants)

Ce guide détaille le fonctionnement complet de l'espace administratif Odoo pour la gestion des utilisateurs, des enseignants, des élèves, des notes, des devoirs bilingues et de la scolarité.

---

## 1. Niveaux de Rôles et Droits d'Accès

Le système dispose de **3 niveaux d'accès distincts** :

| Rôle Odoo | Périmètre et Autorisations | Restrictions |
| :--- | :--- | :--- |
| **👑 Direction / Super Admin** | • Accès total et illimité à toute l'école.<br>• Configuration générale, années scolaires, barèmes.<br>• Gestion des professeurs, du personnel et de la comptabilité.<br>• Consultation et modification de toutes les classes. | Aucune restriction. |
| **🏢 Administration (Staff)** | • Gestion quotidienne de la scolarité sur **toutes les classes**.<br>• Inscription des élèves, passage d'année, absences.<br>• Suivi des paiements, cantine, transport, objets trouvés.<br>• Importation des notes Massar sur tous les niveaux. | • Pas d'accès aux configurations système critiques.<br>• Pas de suppression des comptes professeurs ou personnel. |
| **👨‍🏫 Enseignant / Professeur** | • Accès restreint strictement à **ses propres classes** (`level_ids`).<br>• Accès uniquement à **ses propres matières** (`subject_ids`).<br>• Saisie des devoirs, notes et présences de ses élèves.<br>• Consultation de son emploi du temps et cahier de texte. | • Impossible de voir les autres classes ou matières.<br>• Bloqué en comptabilité, paiements et configuration.<br>• Toute tentative de créer un devoir pour une classe non assignée est rejetée par Odoo. |

---

## 2. Création d'un Utilisateur et Attribution des Droits

Pour créer un accès à un nouvel enseignant ou membre du personnel :

### Étape 1 : Créer le compte utilisateur Odoo
1. Allez dans **Paramètres** ⚙️ > **Utilisateurs & Sociétés** > **Utilisateurs**.
2. Cliquez sur **Nouveau** :
   - **Nom** : Nom complet (ex: *Younes Bakkali*).
   - **Courriel / Identifiant** : Son adresse email professionnelle (ex: *younes.bakkali@alibdaealamia.ma*).
3. Dans l'onglet **Droits d'accès**, descendez à la section **ÉDUCATION** :
   - Dans le champ **Gestion Scolaire**, sélectionnez le rôle souhaité :
     - `Enseignant`
     - `Administration`
     - `Direction / Super Admin`
4. Cliquez sur **Enregistrer**.
5. Définissez son mot de passe en cliquant sur la roue crantée ⚙️ > **Changer le mot de passe**.

---

## 3. Configuration d'une Fiche Enseignant (Périmètre Pédagogique)

> ⚠️ **Important :** C'est cette étape qui active le filtrage de sécurité pour le professeur. Sans cette étape, le professeur ne verra aucune classe.

1. Allez dans le menu **Portail Scolaire** > **Configuration** > **Professeurs**.
2. Cliquez sur la fiche de l'enseignant (ou créez-en une nouvelle avec **Nouveau**).
3. Renseignez les sections :
   - **Coordonnées & Accès Odoo** :
     - **Compte Utilisateur Odoo** : Choisissez l'utilisateur Odoo créé à l'étape précédente.
     - **Fiche Employé Odoo** : Se remplit automatiquement grâce à la synchronisation RH.
     - **Téléphone & Email**.
   - **Affectation Pédagogique** :
     - **Classes / Niveaux** : Sélectionnez les classes qu'il encadre (ex: `6APG-1`, `5APG-1`).
     - **Matières Enseignées** : Sélectionnez ses matières (ex: `Mathématiques`, `Informatique`).
4. Cliquez sur **Sauvegarder**.
   - *Effet immédiat : Dès sa prochaine connexion, le professeur ne verra que ces classes et ces matières.*

---

## 4. Lien avec le Module Employés (RH)

Chaque professeur et administrateur possède une fiche dans le module **Employés** (`hr.employee`) :
- Les professeurs sont automatiquement classés dans le département **Corps Enseignant**.
- Le personnel administratif est classé dans le département **Administration**.
- Toute modification apportée sur la fiche professeur (photo, téléphone, email, poste) met à jour la fiche employé instantanément.
- Vous pouvez consulter l'organigramme et les fiches depuis le menu **Portail Scolaire > Configuration > Employés (RH)**.

---

## 5. Importation des Notes MASSAR (Fichiers Excel .xlsx)

Le module intègre un assistant intelligent capable d'analyser directement les fichiers exports officiels de la plateforme nationale **MASSAR**.

### Procédure d'importation :
1. Allez dans le menu **Portail Scolaire** > **📥 Import Notes MASSAR**.
2. Cliquez sur le champ **Fichier Excel MASSAR (.xlsx)** et sélectionnez votre fichier exporté depuis Massar (ex: `Note_CC1_Maths_6APG.xlsx`).
3. Le système dispose d'une **détection automatique** :
   - Il lit l'en-tête du fichier pour détecter automatiquement :
     - La matière (`المادة`)
     - Le niveau / classe (`القسم / المستوى`)
     - Le semestre (`الدورة الأولى / الدورة الثانية`)
     - Le numéro de contrôle (`الفرض الأول / الثاني`)
   - *(Optionnel) : Vous pouvez forcer manuellement le niveau ou le semestre si votre fichier ne respecte pas l'en-tête standard.*
4. Cliquez sur le bouton bleu **Importer & Alimenter les Notes**.
5. **Résultats générés automatiquement par Odoo** :
   - Les notes détaillées par contrôle sont créées dans **Bulletins & Notes** (`school.grade`).
   - Le système fait la correspondance avec chaque élève par son **Code Massar** ou son nom.
   - Les synthèses et moyennes par matière (`school.grade.summary`) sont recalculées automatiquement.

---

## 6. Création de Devoirs avec Traduction Automatique (Arabe ↔ Français)

Le formulaire de devoir intègre un moteur d'intelligence de traduction instantanée.

### Comment créer un devoir bilingue :
1. Allez dans **Portail Scolaire** > **Devoirs** > **Nouveau**.
2. Renseignez la matière, la classe (`Niveau / Classe`) et la date d'échéance.
3. Allez dans l'onglet **Contenu Bilingue (Arabe ↔ Français)** :
   - **Cas A : Vous saisissez en Arabe**
     - Tapez le titre dans **العنوان بالعربية** (ex: `واجب في النشاط العلمي`).
     - Tapez les consignes dans **التعليمات والتفاصيل بالعربية**.
     - 👉 Dès que vous changez de champ, la **Version Française** (`Titre` et `Description`) se remplit **automatiquement en français**.
   - **Cas B : Vous saisissez en Français**
     - Tapez le titre et la description dans la colonne française.
     - 👉 La colonne arabe se génère instantanément.
4. Vous pouvez ajuster ou corriger les textes à tout moment.
5. Vous pouvez également cliquer sur le bouton d'action **`🔄 Traduire (Arabe ↔ Français)`** dans l'en-tête pour forcer la mise à jour.
6. Ajoutez une pièce jointe (PDF, image, document d'exercice) dans l'onglet **Document / Fichier** si nécessaire.
7. Cliquez sur **Sauvegarder**.

---

## 7. Gestion des Inscriptions et Passage d'Année Scolaire

Pour basculer les élèves vers une nouvelle année ou inscrire des promotions :
1. Allez dans **Portail Scolaire** > **Inscription / Passage Année**.
2. Sélectionnez :
   - **Année Scolaire Cible** (ex: `2025-2026`).
   - **Niveau / Classe Actuelle** (ex: `5APG-1`).
   - **Niveau Suivant** (ex: `6APG-1`).
3. Cochez les élèves admis à passer au niveau supérieur.
4. Cliquez sur **Valider le passage**. Les élèves sont inscrits dans leur nouvelle classe tout en conservant l'historique de leurs années précédentes.

---

## 8. Suivi des Absences et Retards

1. Allez dans **Portail Scolaire** > **Absences & Présences**.
2. Cliquez sur **Nouveau** :
   - Sélectionnez la classe et l'élève.
   - Indiquez la date, le type (`Absence` ou `Retard`) et si elle est `Justifiée` ou non.
   - Précisez le motif (maladie, convenance personnelle, etc.).
3. Cliquez sur **Sauvegarder**.
   - L'information apparaît **en temps réel sur le smartphone des parents**.

---

## 9. Génération et Suivi des Mensualités (Paiements)

1. **Génération massive mensuelle** :
   - Allez dans **Portail Scolaire** > **Générer Mensualités**.
   - Choisissez l'année scolaire et le mois concerné (ex: `Octobre`).
   - Cliquez sur **Générer** : Odoo crée un enregistrement de paiement à l'état `Non payé` pour chaque élève inscrit.
2. **Encaissement d'un paiement** :
   - Allez dans **Portail Scolaire** > **Paiements Scolarité**.
   - Ouvrez la ligne de l'élève ou recherchez par son nom.
   - Cliquez sur **Marquer comme Payé** et indiquez la méthode (Espèces, Virement, Chèque).
   - Les parents voient immédiatement la confirmation de paiement sur leur application.
