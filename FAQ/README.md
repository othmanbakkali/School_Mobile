# 📚 Guide & FAQ - Plateforme Scolaire Al Ibdae Al Alamia
> **Documentation Complète & Foire Aux Questions (FAQ)**  
> Système de gestion scolaire Odoo 19 (Backend) & Application Mobile / Portail Web (Frontend Parents & Élèves).

---

## 🗂️ Sommaire de la Documentation

La documentation est structurée en 3 guides complets détaillés :

| Guide | Description | Public Cible |
| :--- | :--- | :--- |
| [**1. Guide Backend Odoo (Administration & Professeurs)**](./01_GUIDE_BACKEND_ODOO.md) | Création des utilisateurs, gestion des droits d'accès, affectation des classes/matières aux professeurs, importation des notes MASSAR / Excel, gestion des devoirs bilingues, inscriptions et paiements. | Direction, Administration, Professeurs |
| [**2. Guide Frontend (Application Mobile & Portail Parents/Élèves)**](./02_GUIDE_FRONTEND_PARENTS_ELEVES.md) | Connexion, sélecteur multi-enfants, consultation des notes et bulletins, suivi des devoirs et pièces jointes, absences, emploi du temps, cahier de transmission et paiements. | Parents d'élèves, Étudiants, Administration |
| [**3. FAQ & Dépannage Technique**](./03_QUESTIONS_FREQUENTES_ET_DEPANNAGE.md) | Réponses aux questions fréquentes, résolution des blocages de connexion, assignation des droits d'accès, erreurs d'importation Massar et synchronisation mobile. | Tous utilisateurs, Support technique |

---

## 🏗️ Architecture Globale du Système

```
                              ┌──────────────────────────────────┐
                              │     SERVEUR CENTRAL ODOO 19      │
                              │  Base de données : alibdaealamia │
                              └─────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    ┌─────────────────────────┐                                   ┌─────────────────────────┐
    │     BACKEND ODOO 19     │                                   │     API NODE.JS / WEB   │
    │  (Portail Administratif)│                                   │    (Serveur Middleware) │
    ├─────────────────────────┤                                   ├─────────────────────────┤
    │ • Direction Générale    │                                   │ • Authentification JWT  │
    │ • Staff Administratif   │                                   │ • Données en temps réel │
    │ • Professeurs / RH      │                                   │ • Traduction bilingue   │
    └─────────────────────────┘                                   └─────────────┬───────────┘
                                                                                │
                                                                  ┌─────────────┴───────────┐
                                                                  ▼                         ▼
                                                     ┌───────────────────────┐   ┌───────────────────────┐
                                                     │   APPLICATION MOBILE  │   │      PORTAIL WEB      │
                                                     │     (iOS / Android)   │   │  (Navigateurs Web)    │
                                                     ├───────────────────────┤   ├───────────────────────┤
                                                     │ • Espace Parents      │   │ • Accès tous écrans   │
                                                     │ • Espace Élèves       │   │ • Mode RTL (Arabe)    │
                                                     │ • Multi-enfants       │   │ • Mode LTR (Français) │
                                                     └───────────────────────┘   └───────────────────────┘
```

---

## ⚡ Accès Rapides

- **URL d'administration Odoo** : [https://adminschool.alibdaealamia.ma](https://adminschool.alibdaealamia.ma) *(ou `http://68.183.19.16:8069`)*
- **Application Web / Mobile Parents** : Accessible sur mobile ou via le navigateur configuré pour l'établissement.
- **Identifiant Super Admin** : `othmanbakkali@gmail.com`
