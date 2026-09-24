# ❓ Questions Fréquentes & Guide de Dépannage (FAQ)

Retrouvez ici les réponses aux questions les plus courantes et les solutions pratiques aux incidents d'utilisation courants.

---

### ❓ Q1 : Un professeur s'est connecté à Odoo mais ne voit aucune classe ni aucun élève. Pourquoi ?
**Cause :** Son compte utilisateur Odoo existe bien, mais sa **fiche professeur** n'a pas encore été reliée à ses classes d'enseignement.  
**Solution (par l'administrateur) :**
1. Allez dans **Portail Scolaire** > **Configuration** > **Professeurs**.
2. Ouvrez la fiche du professeur.
3. Vérifiez deux champs essentiels :
   - **Compte Utilisateur Odoo** : Doit pointer vers son compte utilisateur.
   - **Classes / Niveaux (`level_ids`)** : Vous devez sélectionner au moins une classe (ex: `6APG-1`).
   - **Matières Enseignées (`subject_ids`)** : Vous devez sélectionner ses matières.
4. Cliquez sur **Sauvegarder**. Demandez au professeur de rafraîchir son écran (F5) : ses classes apparaissent immédiatement.

---

### ❓ Q2 : Comment réinitialiser ou changer le mot de passe d'un enseignant ou membre du personnel ?
**Solution :**
1. Allez dans **Paramètres** ⚙️ > **Utilisateurs & Sociétés** > **Utilisateurs**.
2. Ouvrez la fiche de l'utilisateur concerné.
3. Cliquez sur le menu **Action** (ou roue crantée) en haut à gauche > **Changer le mot de passe**.
4. Saisissez le nouveau mot de passe et cliquez sur **Changer le mot de passe**.
5. Communiquez les nouveaux identifiants à l'intéressé.

---

### ❓ Q3 : Comment réinitialiser le mot de passe d'un parent d'élève sur l'application mobile ?
**Solution :**
1. Allez dans **Portail Scolaire** > **Parents**.
2. Recherchez le parent par son nom ou son adresse email.
3. Vérifiez l'adresse email et le numéro de téléphone enregistrés.
4. Si le compte utilisateur associé existe dans *Paramètres > Utilisateurs*, utilisez la procédure de réinitialisation du mot de passe standard Odoo ou mettez à jour son mot de passe directement.

---

### ❓ Q4 : Lors de l'importation du fichier Excel Massar, une erreur apparaît ou des notes ne sont pas créées. Que faire ?
**Causes possibles et solutions :**
1. **Format du fichier** : Assurez-vous d'importer un fichier officiel au format `.xlsx` (et non `.xls` ancien format ou `.csv`). Si besoin, ouvrez le fichier dans Excel et enregistrez-le au format *Classeur Excel (.xlsx)*.
2. **Élèves non reconnus** : L'assistant Massar fait la correspondance en priorité avec le **Code Massar** de l'élève (ex: `R13456789`). Vérifiez dans *Portail Scolaire > Élèves* que les élèves de la classe ont bien leur Code Massar renseigné.
3. **Sélection manuelle de secours** : Dans l'assistant d'importation, si l'en-tête du fichier est particulier, vous pouvez sélectionner manuellement la **Classe**, la **Matière** et le **Semestre** avant de cliquer sur le bouton d'importation.

---

### ❓ Q5 : Si un enseignant saisit un devoir en arabe et que la traduction en français ne lui plaît pas, peut-il la corriger ?
**Oui, absolument !**
La traduction automatique est une proposition instantanée pour faire gagner du temps. L'enseignant reste libre à 100% :
- Il peut cliquer dans le champ français ou arabe et modifier n'importe quel mot ou phrase.
- Le texte corrigé manuellement sera conservé et enregistré tel quel.
- Le bouton **`🔄 Traduire`** permet de relancer la traduction si besoin.

---

### ❓ Q6 : Un parent a deux enfants dans l'école mais n'en voit qu'un seul dans l'application mobile. Comment lier le deuxième enfant ?
**Cause :** Le deuxième élève n'est pas rattaché à la fiche du parent dans Odoo.  
**Solution :**
1. Allez dans **Portail Scolaire** > **Élèves**.
2. Ouvrez la fiche du deuxième enfant.
3. Dans le champ **Parent / Responsable**, sélectionnez la fiche du parent (ou assurez-vous que les deux enfants ont exactement la même fiche parent sélectionnée).
4. Cliquez sur **Sauvegarder**.
5. Le parent verra immédiatement apparaître son deuxième enfant dans le sélecteur en haut de son écran sans avoir besoin de se déconnecter.

---

### ❓ Q7 : Comment retirer les accès d'un professeur ou d'un membre de l'équipe qui quitte l'établissement ?
**Solution :**
1. Allez dans **Paramètres** ⚙️ > **Utilisateurs & Sociétés** > **Utilisateurs**.
2. Ouvrez le compte de l'ancien collaborateur.
3. Cliquez sur l'onglet **Droits d'accès** > mettez le rôle **Gestion Scolaire** sur `Aucun` (ou décochez la case **Actif** sous le nom de l'utilisateur).
4. L'accès au système est révoqué **instantanément**. Toutes ses anciennes données historiques (notes passées, devoirs archivés) restent conservées dans Odoo.

---

### ❓ Q8 : L'application mobile ou web affiche un écran de chargement infini ou « Erreur de connexion ». Que vérifier ?
**Points de contrôle :**
1. Vérifiez que votre téléphone ou ordinateur est bien connecté à Internet (Wi-Fi ou 4G/5G).
2. Vérifiez que le serveur Odoo est actif : rendez-vous sur [https://adminschool.alibdaealamia.ma](https://adminschool.alibdaealamia.ma).
3. Si le serveur Odoo répond mais que l'application mobile ne charge pas, videz le cache de votre navigateur ou redémarrez l'application PWA.

---

### ❓ Q9 : Peut-on exporter les listes d'élèves ou de notes vers Excel pour les imprimer ?
**Oui !**
Depuis n'importe quelle vue liste dans Odoo (Élèves, Bulletins, Paiements, Absences) :
1. Cochez les lignes que vous souhaitez exporter (ou cochez la case en haut pour tout sélectionner).
2. Cliquez sur le bouton **Action** (ou l'icône de téléchargement) > **Exporter**.
3. Choisissez le format **Excel (.xlsx)** et téléchargez votre fichier prêt à l'impression.
