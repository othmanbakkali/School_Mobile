<template>
  <ion-page>
    <ion-header :translucent="true" class="faq-header">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-button router-link="/login" fill="clear" class="back-btn">
            <ion-icon :icon="arrowBackOutline" slot="start"></ion-icon>
            <span class="btn-text">Connexion</span>
          </ion-button>
        </ion-buttons>
        <ion-title class="main-title">
          <div class="brand-title">
            <span class="school-name">Al Ibdae Al Alamia</span>
            <span class="portal-badge">Centre d'Aide & FAQ</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="toggleAll" class="action-btn">
            <ion-icon :icon="allExpanded ? removeCircleOutline : addCircleOutline" slot="start"></ion-icon>
            <span class="btn-text">{{ allExpanded ? 'Tout fermer' : 'Tout ouvrir' }}</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="faq-content">
      <div class="faq-container">
        <!-- Hero Banner -->
        <div class="hero-section">
          <div class="hero-icon-box">
            <ion-icon :icon="helpCircleOutline"></ion-icon>
          </div>
          <h1>Foire Aux Questions & Guides</h1>
          <p class="subtitle">
            Documentation complète d'utilisation du <strong>Backend Odoo</strong> (Administration & Enseignants) 
            et de l'<strong>Espace Scolaire</strong> (Parents & Élèves).
          </p>

          <!-- Search Bar -->
          <div class="search-box">
            <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Rechercher une question, une étape, Massar, notes, devoirs, rôles..." 
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </button>
          </div>

          <!-- Category Filter Tabs -->
          <div class="category-tabs">
            <button 
              v-for="cat in categories" 
              :key="cat.id" 
              class="cat-chip" 
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <ion-icon :icon="cat.icon"></ion-icon>
              <span>{{ cat.label }}</span>
              <span class="count-badge">{{ getCategoryCount(cat.id) }}</span>
            </button>
          </div>
        </div>

        <!-- Quick Access Banner -->
        <div class="quick-links-card">
          <div class="quick-link-item">
            <div class="ql-icon backend-icon">
              <ion-icon :icon="desktopOutline"></ion-icon>
            </div>
            <div class="ql-text">
              <strong>Espace Backend Odoo</strong>
              <span>Gestion administrative, notes Massar, profs</span>
            </div>
            <a href="https://adminschool.alibdaealamia.ma" target="_blank" rel="noopener" class="ql-btn">
              Ouvrir Odoo <ion-icon :icon="openOutline"></ion-icon>
            </a>
          </div>

          <div class="ql-divider"></div>

          <div class="quick-link-item">
            <div class="ql-icon frontend-icon">
              <ion-icon :icon="phonePortraitOutline"></ion-icon>
            </div>
            <div class="ql-text">
              <strong>Espace Parents & Élèves</strong>
              <span>Consultation bulletins, devoirs, absences</span>
            </div>
            <router-link to="/login" class="ql-btn primary">
              Se connecter <ion-icon :icon="arrowForwardOutline"></ion-icon>
            </router-link>
          </div>
        </div>

        <!-- FAQ Items List -->
        <div class="faq-list">
          <div v-if="filteredItems.length === 0" class="no-results">
            <ion-icon :icon="searchOutline"></ion-icon>
            <h3>Aucun résultat trouvé</h3>
            <p>Essayez un autre mot-clé ou réinitialisez la recherche.</p>
            <button class="reset-btn" @click="resetFilters">Réinitialiser les filtres</button>
          </div>

          <div 
            v-for="(item, index) in filteredItems" 
            :key="item.id" 
            class="faq-card" 
            :class="{ open: isOpen(item.id) }"
          >
            <div class="faq-card-header" @click="toggleItem(item.id)">
              <div class="category-tag" :class="item.category">
                <ion-icon :icon="getCategoryIcon(item.category)"></ion-icon>
                <span>{{ getCategoryLabel(item.category) }}</span>
              </div>
              <div class="title-row">
                <span class="faq-question">{{ item.question }}</span>
                <span class="toggle-indicator">
                  <ion-icon :icon="isOpen(item.id) ? chevronUpOutline : chevronDownOutline"></ion-icon>
                </span>
              </div>
            </div>

            <transition name="expand">
              <div v-if="isOpen(item.id)" class="faq-card-body">
                <div class="faq-answer-content" v-html="item.answerHtml"></div>
                
                <div v-if="item.tips && item.tips.length" class="tips-box">
                  <div class="tips-title">
                    <ion-icon :icon="bulbOutline"></ion-icon>
                    <span>Conseils & Astuces :</span>
                  </div>
                  <ul>
                    <li v-for="(tip, tIdx) in item.tips" :key="tIdx" v-html="tip"></li>
                  </ul>
                </div>

                <div v-if="item.warning" class="warning-box">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <div class="warning-text" v-html="item.warning"></div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Footer Assistance -->
        <div class="faq-footer">
          <div class="footer-help-box">
            <ion-icon :icon="chatbubblesOutline" class="help-icon"></ion-icon>
            <div class="help-content">
              <h3>Besoin d'une assistance supplémentaire ?</h3>
              <p>Notre équipe technique et administrative est à votre disposition.</p>
              <div class="contact-links">
                <a href="mailto:contact@alibdaealamia.ma" class="contact-pill">
                  <ion-icon :icon="mailOutline"></ion-icon> contact@alibdaealamia.ma
                </a>
                <span class="contact-pill">
                  <ion-icon :icon="callOutline"></ion-icon> +212 5 39 99 99 99
                </span>
              </div>
            </div>
          </div>
          <p class="copyright">
            © 2026 Groupe Scolaire Al Ibdae Al Alamia • Tous droits réservés
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonButton, 
  IonTitle, IonContent, IonIcon 
} from '@ionic/vue';
import {
  arrowBackOutline, searchOutline, closeCircleOutline, helpCircleOutline,
  desktopOutline, phonePortraitOutline, buildOutline, openOutline,
  arrowForwardOutline, chevronUpOutline, chevronDownOutline, bulbOutline,
  alertCircleOutline, chatbubblesOutline, mailOutline, callOutline,
  addCircleOutline, removeCircleOutline
} from 'ionicons/icons';

interface FaqItem {
  id: string;
  category: 'backend' | 'frontend' | 'troubleshoot';
  question: string;
  answerHtml: string;
  tips?: string[];
  warning?: string;
}

const searchQuery = ref('');
const selectedCategory = ref('all');
const openItemIds = ref<Set<string>>(new Set(['roles-odoo', 'login-parent', 'massar-import']));

const categories = [
  { id: 'all', label: 'Tous', icon: helpCircleOutline },
  { id: 'backend', label: 'Backend Odoo', icon: desktopOutline },
  { id: 'frontend', label: 'Espace Parents & Élèves', icon: phonePortraitOutline },
  { id: 'troubleshoot', label: 'Dépannage & FAQ', icon: buildOutline },
];

const faqData: FaqItem[] = [
  // --- BACKEND ODOO ---
  {
    id: 'roles-odoo',
    category: 'backend',
    question: "Quels sont les rôles d'accès dans Odoo et leurs autorisations ?",
    answerHtml: `
      <p>Le système dispose de <strong>3 niveaux d'accès distincts</strong> configurés sous la catégorie <em>Éducation > Gestion Scolaire</em> :</p>
      <div class="table-responsive">
        <table class="faq-table">
          <thead>
            <tr>
              <th>Rôle</th>
              <th>Périmètre & Autorisations</th>
              <th>Restrictions de Sécurité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>👑 Direction / Super Admin</strong></td>
              <td>Accès complet et illimité à toute l'école, barèmes, années scolaires, gestion des professeurs, comptabilité et toutes les classes.</td>
              <td>Aucune restriction.</td>
            </tr>
            <tr>
              <td><strong>🏢 Administration (Staff)</strong></td>
              <td>Gestion de la scolarité sur <strong>toutes les classes</strong> : inscriptions, présences, passage d'année, cantine, transport, import des notes Massar.</td>
              <td>Pas d'accès aux configurations système critiques ni à la suppression de comptes.</td>
            </tr>
            <tr>
              <td><strong>👨‍🏫 Enseignant / Professeur</strong></td>
              <td>Accès <strong>strictement restreint à ses classes assignées</strong> et à <strong>ses matières</strong>. Saisie des devoirs, notes et présences.</td>
              <td>Ne peut pas voir les autres classes ni accéder à la comptabilité. Rejet automatique en cas de tentative de création de devoir hors périmètre.</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    tips: [
      "Pour changer le rôle d'un utilisateur, allez dans <strong>Paramètres > Utilisateurs & Sociétés > Utilisateurs</strong>, ouvrez l'utilisateur et modifiez le champ <strong>Gestion Scolaire</strong>."
    ]
  },
  {
    id: 'create-user-odoo',
    category: 'backend',
    question: "Comment créer un nouvel utilisateur et lui attribuer ses droits ?",
    answerHtml: `
      <ol class="step-list">
        <li>Rendez-vous dans <strong>Paramètres</strong> ⚙️ &gt; <strong>Utilisateurs &amp; Sociétés</strong> &gt; <strong>Utilisateurs</strong>.</li>
        <li>Cliquez sur <strong>Nouveau</strong> :
          <ul>
            <li><strong>Nom</strong> : Renseignez le nom complet (ex: <em>Younes Bakkali</em>).</li>
            <li><strong>Courriel / Identifiant</strong> : L'adresse email professionnelle de connexion.</li>
          </ul>
        </li>
        <li>Dans l'onglet <strong>Droits d'accès</strong>, localisez la section <strong>ÉDUCATION</strong> :
          <ul>
            <li>Dans le champ <strong>Gestion Scolaire</strong>, choisissez entre <code>Enseignant</code>, <code>Administration</code> ou <code>Direction / Super Admin</code>.</li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Enregistrer</strong>.</li>
        <li>Définissez son mot de passe initial via le menu d'actions (roue crantée ⚙️) &gt; <strong>Changer le mot de passe</strong>.</li>
      </ol>
    `,
    warning: "Pour un professeur, vous devez impérativement configurer sa <strong>Fiche Enseignant</strong> à l'étape suivante, sinon il n'aura accès à aucune classe."
  },
  {
    id: 'config-teacher-scope',
    category: 'backend',
    question: "Comment affecter les classes et matières d'un professeur (Périmètre pédagogique) ?",
    answerHtml: `
      <p>C'est cette étape qui applique la restriction de sécurité stricte au professeur :</p>
      <ol class="step-list">
        <li>Allez dans le menu <strong>Portail Scolaire</strong> &gt; <strong>Configuration</strong> &gt; <strong>Professeurs</strong>.</li>
        <li>Ouvrez la fiche de l'enseignant (ou cliquez sur <strong>Nouveau</strong>).</li>
        <li>Associez son <strong>Compte Utilisateur Odoo</strong> (créé précédemment).</li>
        <li>Dans la section <strong>Affectation Pédagogique</strong> :
          <ul>
            <li><strong>Classes / Niveaux</strong> : Sélectionnez exactement ses classes (ex: <em>6APG-1</em>, <em>6APG-2</em>).</li>
            <li><strong>Matières Enseignées</strong> : Sélectionnez ses matières (ex: <em>Mathématiques</em>, <em>Informatique</em>).</li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Sauvegarder</strong>.</li>
      </ol>
    `,
    tips: [
      "Dès la validation, l'enseignant ne verra que ces élèves, ces devoirs et ces notes lors de sa prochaine connexion."
    ]
  },
  {
    id: 'massar-import',
    category: 'backend',
    question: "Comment importer les notes depuis un fichier Excel MASSAR (.xlsx) ?",
    answerHtml: `
      <p>L'assistant d'import analyse directement les fichiers exportés depuis la plateforme officielle <strong>MASSAR</strong> :</p>
      <ol class="step-list">
        <li>Rendez-vous dans <strong>Portail Scolaire</strong> &gt; <strong>📥 Import Notes MASSAR</strong>.</li>
        <li>Sélectionnez votre fichier Excel <code>.xlsx</code> officiel téléchargé depuis Massar.</li>
        <li>Le système lit automatiquement l'en-tête officiel marocain :
          <ul>
            <li>Matière (<code>المادة</code>)</li>
            <li>Classe / Niveau (<code>القسم / المستوى</code>)</li>
            <li>Semestre (<code>الدورة الأولى / الثانية</code>)</li>
            <li>Numéro du contrôle continu (<code>الفرض الأول / الثاني</code>)</li>
          </ul>
        </li>
        <li>Vérifiez la détection automatique puis cliquez sur <strong>Importer &amp; Alimenter les Notes</strong>.</li>
        <li>Odoo apparie chaque note avec le <strong>Code Massar</strong> ou le nom de l'élève et recalcule automatiquement les moyennes globales.</li>
      </ol>
    `,
    warning: "N'altérez pas la structure des colonnes ni les cellules d'en-tête du fichier Excel téléchargé depuis Massar pour garantir une détection 100% automatique."
  },
  {
    id: 'homework-translation',
    category: 'backend',
    question: "Comment fonctionne la traduction automatique bilingue (Arabe ↔ Français) des devoirs ?",
    answerHtml: `
      <p>Lors de la création d'un devoir dans <strong>Portail Scolaire &gt; Devoirs</strong> :</p>
      <ul>
        <li><strong>Si vous saisissez en Arabe</strong> dans <em>العنوان بالعربية</em> et <em>التعليمات بالعربية</em> : le système traduit et complète automatiquement les champs <strong>Titre</strong> et <strong>Description</strong> en français.</li>
        <li><strong>Si vous saisissez en Français</strong> dans <em>Titre</em> et <em>Description</em> : le système génère instantanément la version arabe correspondante.</li>
      </ul>
      <p>Sur l'application mobile et le portail web, les parents et élèves peuvent basculer entre l'affichage arabe et français en un seul clic !</p>
    `
  },
  {
    id: 'hr-employee-sync',
    category: 'backend',
    question: "Comment les professeurs et administrateurs sont-ils reliés au module RH (Employés) ?",
    answerHtml: `
      <p>Une synchronisation bidirectionnelle automatique est en place :</p>
      <ul>
        <li>Tout professeur créé dans <strong>Professeurs</strong> génère ou met à jour sa fiche dans <strong>Employés</strong> (<code>hr.employee</code>).</li>
        <li>Les professeurs sont automatiquement affectés au département <strong>Corps Enseignant</strong>.</li>
        <li>Le personnel administratif est classé dans le département <strong>Administration</strong>.</li>
        <li>Les coordonnées, photos, téléphones et adresses email sont synchronisés en temps réel.</li>
      </ul>
    `
  },

  // --- FRONTEND PARENTS & ELEVES ---
  {
    id: 'login-parent',
    category: 'frontend',
    question: "Comment les parents se connectent-ils à l'application mobile et au portail web ?",
    answerHtml: `
      <p>L'accès pour les parents a été simplifié au maximum pour éviter les oublis d'identifiants :</p>
      <div class="credentials-badge-box">
        <div class="cred-item">
          <span class="cred-label">Identifiant de connexion :</span>
          <span class="cred-val">Numéro de Téléphone du parent (ex: 06XXXXXXXX ou 07XXXXXXXX)</span>
        </div>
        <div class="cred-item">
          <span class="cred-label">Mot de passe standard :</span>
          <span class="cred-val highlight">20262027</span>
        </div>
      </div>
      <p>Si le parent a plusieurs enfants scolarisés dans l'établissement, un écran de sélection lui permet de basculer instantanément d'un enfant à l'autre sans se reconnecter.</p>
    `,
    tips: [
      "Le numéro de téléphone doit être celui renseigné sur la fiche parent dans Odoo. En cas de changement de numéro, l'administration peut le mettre à jour instantanément."
    ]
  },
  {
    id: 'view-grades-parent',
    category: 'frontend',
    question: "Où et comment consulter les notes, contrôles et bulletins scolaires ?",
    answerHtml: `
      <ol class="step-list">
        <li>Connectez-vous à votre espace parent.</li>
        <li>Ouvrez le menu latéral ou l'onglet <strong>Notes &amp; Bulletins</strong>.</li>
        <li>Vous visualisez :
          <ul>
            <li>La <strong>Moyenne Générale</strong> et l'évolution par semestre.</li>
            <li>Le détail par matière avec les notes de chaque contrôle continu.</li>
            <li>Le rang et les observations des enseignants.</li>
          </ul>
        </li>
        <li>Vous pouvez télécharger le bulletin officiel en format PDF dès sa publication par la direction.</li>
      </ol>
    `
  },
  {
    id: 'homework-tracking',
    category: 'frontend',
    question: "Comment suivre les devoirs, leçons et travaux à faire à la maison ?",
    answerHtml: `
      <p>Dans l'onglet <strong>Devoirs</strong> :</p>
      <ul>
        <li>Les devoirs sont classés par date d'échéance (Aujourd'hui, Demain, Cette semaine).</li>
        <li>Chaque devoir affiche la matière, l'enseignant, la date limite et le statut (À faire / Terminé).</li>
        <li><strong>Affichage Bilingue</strong> : Grâce au bouton de langue en haut du menu (🇲🇦 AR / 🇫🇷 FR), le devoir s'affiche dans la langue choisie par la famille.</li>
        <li>L'élève ou le parent peut cocher la case pour marquer le devoir comme accompli.</li>
      </ul>
    `
  },
  {
    id: 'absences-parent',
    category: 'frontend',
    question: "Comment déclarer et justifier une absence ou un retard ?",
    answerHtml: `
      <ol class="step-list">
        <li>Allez dans le menu <strong>Vie Scolaire</strong> &gt; <strong>Absences &amp; Retards</strong>.</li>
        <li>Consultez l'historique complet des séances manquées.</li>
        <li>Pour justifier une absence :
          <ul>
            <li>Cliquez sur le bouton <strong>Justifier une absence</strong>.</li>
            <li>Sélectionnez la date concernée et précisez le motif (maladie, urgence familiale...).</li>
            <li>Prenez en photo ou joignez le justificatif médical / document officiel.</li>
          </ul>
        </li>
        <li>L'administration reçoit la notification et valide la justification.</li>
      </ol>
    `
  },
  {
    id: 'payments-parent',
    category: 'frontend',
    question: "Comment suivre les paiements de scolarité, cantine et transport ?",
    answerHtml: `
      <p>Dans la section <strong>Paiements &amp; Échéances</strong> :</p>
      <ul>
        <li>Visualisation claire des mensualités réglées et des échéances à venir.</li>
        <li>Historique détaillé des reçus de paiement émis par l'établissement.</li>
        <li>Suivi des options souscrites : transport scolaire, restauration/cantine et activités périscolaires.</li>
      </ul>
    `
  },

  // --- DEPANNAGE & QUESTIONS FREQUENTES ---
  {
    id: 'troubleshoot-teacher-empty',
    category: 'troubleshoot',
    question: "Pourquoi un enseignant ne voit aucune classe ou aucun élève après sa connexion ?",
    answerHtml: `
      <p>Ce cas arrive lorsque l'utilisateur Odoo a été créé mais que sa <strong>Fiche Enseignant</strong> n'a pas été liée :</p>
      <ol class="step-list">
        <li>Connectez-vous en tant qu'administrateur dans Odoo.</li>
        <li>Allez dans <strong>Portail Scolaire &gt; Configuration &gt; Professeurs</strong>.</li>
        <li>Trouvez la fiche du professeur en question.</li>
        <li>Assurez-vous que le champ <strong>Compte Utilisateur Odoo</strong> pointe bien sur son compte utilisateur.</li>
        <li>Vérifiez qu'au moins une classe est ajoutée dans <strong>Classes / Niveaux</strong> et une matière dans <strong>Matières Enseignées</strong>.</li>
        <li>Sauvegardez. Le professeur verra ses classes immédiatement après actualisation.</li>
      </ol>
    `
  },
  {
    id: 'troubleshoot-massar-format',
    category: 'troubleshoot',
    question: "Que faire en cas d'erreur lors de l'import d'un fichier Excel Massar ?",
    answerHtml: `
      <p>Vérifiez les points suivants sur votre fichier Excel :</p>
      <ul>
        <li>Le fichier doit être au format <strong>.xlsx</strong> (et non pas .xls ou .csv).</li>
        <li>Assurez-vous d'avoir exporté le fichier officiel sans modifier les premières lignes d'en-tête (qui contiennent les métadonnées de la classe et de la matière).</li>
        <li>Vérifiez que le code de la classe (ex: <code>6APG-1</code>) correspond exactement aux classes définies dans Odoo.</li>
        <li>Si une note apparaît avec une virgule au lieu d'un point, le système s'en charge automatiquement mais évitez les caractères alphabétiques dans les colonnes de notes.</li>
      </ul>
    `
  },
  {
    id: 'troubleshoot-parent-login-failed',
    category: 'troubleshoot',
    question: "Un parent n'arrive pas à se connecter avec son numéro de téléphone, que faire ?",
    answerHtml: `
      <ol class="step-list">
        <li>Vérifiez dans Odoo le numéro enregistré : <strong>Portail Scolaire &gt; Configuration &gt; Parents</strong>.</li>
        <li>Vérifiez qu'il n'y a pas d'espaces superflus ou de caractères spéciaux (le numéro doit être au format national marocain ex: <code>0612345678</code>).</li>
        <li>Assurez-vous que l'élève est bien rattaché à ce parent dans l'onglet <strong>Enfants / Élèves</strong>.</li>
        <li>Rappelez au parent que le mot de passe par défaut est <code>20262027</code>.</li>
      </ol>
    `
  },
  {
    id: 'troubleshoot-reset-password',
    category: 'troubleshoot',
    question: "Comment réinitialiser le mot de passe d'un enseignant ou d'un administrateur Odoo ?",
    answerHtml: `
      <ol class="step-list">
        <li>En tant qu'administrateur, ouvrez <strong>Paramètres &gt; Utilisateurs &amp; Sociétés &gt; Utilisateurs</strong>.</li>
        <li>Cliquez sur le compte concerné.</li>
        <li>Dans la barre supérieure, cliquez sur la roue d'engrenage ⚙️ puis sur <strong>Changer le mot de passe</strong>.</li>
        <li>Saisissez le nouveau mot de passe et cliquez sur <strong>Enregistrer</strong>.</li>
      </ol>
    `
  }
];

const filteredItems = computed(() => {
  return faqData.filter(item => {
    // Filter by Category
    if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
      return false;
    }
    // Filter by Search Query
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase().trim();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answerHtml.toLowerCase().includes(q);
      const matchTips = item.tips ? item.tips.some(t => t.toLowerCase().includes(q)) : false;
      return matchQ || matchA || matchTips;
    }
    return true;
  });
});

const allExpanded = computed(() => {
  return filteredItems.value.length > 0 && filteredItems.value.every(item => openItemIds.value.has(item.id));
});

const isOpen = (id: string) => openItemIds.value.has(id);

const toggleItem = (id: string) => {
  if (openItemIds.value.has(id)) {
    openItemIds.value.delete(id);
  } else {
    openItemIds.value.add(id);
  }
};

const toggleAll = () => {
  if (allExpanded.value) {
    openItemIds.value.clear();
  } else {
    filteredItems.value.forEach(item => openItemIds.value.add(item.id));
  }
};

const getCategoryCount = (catId: string) => {
  if (catId === 'all') return faqData.length;
  return faqData.filter(item => item.category === catId).length;
};

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'backend': return 'Backend Odoo';
    case 'frontend': return 'Espace Parents';
    case 'troubleshoot': return 'Dépannage & FAQ';
    default: return 'Général';
  }
};

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'backend': return desktopOutline;
    case 'frontend': return phonePortraitOutline;
    case 'troubleshoot': return buildOutline;
    default: return helpCircleOutline;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
};
</script>

<style scoped>
.faq-header {
  --background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.header-toolbar {
  --background: transparent;
  padding: 4px 8px;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.school-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
}

.portal-badge {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #eff6ff;
  color: #2563eb;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #bfdbfe;
}

.back-btn, .action-btn {
  --color: #3b82f6;
  font-weight: 600;
  font-size: 0.9rem;
}

.faq-content {
  --background: #f8fafc;
}

.faq-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 20px 12px 28px;
}

.hero-icon-box {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 34px;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
}

.hero-section h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.hero-section .subtitle {
  font-size: 1.05rem;
  color: #64748b;
  max-width: 650px;
  margin: 0 auto 24px;
  line-height: 1.6;
}

/* Search Box */
.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto 20px;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 14px 44px 14px 48px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.98rem;
  color: #1e293b;
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.clear-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.cat-chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.cat-chip.active {
  background: #1e293b;
  color: white;
  border-color: #1e293b;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
}

.cat-chip .count-badge {
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.75rem;
  padding: 1px 7px;
  border-radius: 999px;
}

.cat-chip.active .count-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Quick Links Card */
.quick-links-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 16px 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  gap: 20px;
}

@media (max-width: 640px) {
  .quick-links-card {
    flex-direction: column;
  }
  .ql-divider {
    width: 100% !important;
    height: 1px !important;
    margin: 8px 0;
  }
  .brand-title .school-name {
    font-size: 0.9rem;
  }
}

.quick-link-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.ql-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.ql-icon.backend-icon {
  background: #e0e7ff;
  color: #4338ca;
}

.ql-icon.frontend-icon {
  background: #dcfce7;
  color: #15803d;
}

.ql-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ql-text strong {
  font-size: 0.95rem;
  color: #0f172a;
}

.ql-text span {
  font-size: 0.8rem;
  color: #64748b;
}

.ql-divider {
  width: 1px;
  background: #e2e8f0;
}

.ql-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.ql-btn:hover {
  background: #e2e8f0;
}

.ql-btn.primary {
  background: #2563eb;
  color: white;
}

.ql-btn.primary:hover {
  background: #1d4ed8;
}

/* FAQ List */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
}

.no-results ion-icon {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.no-results h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}

.no-results p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 16px;
}

.reset-btn {
  padding: 8px 18px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

/* FAQ Card */
.faq-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
}

.faq-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.faq-card.open {
  border-color: #93c5fd;
  box-shadow: 0 8px 24px -4px rgba(59, 130, 246, 0.1);
}

.faq-card-header {
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.category-tag.backend {
  background: #ede9fe;
  color: #6d28d9;
}

.category-tag.frontend {
  background: #dcfce7;
  color: #15803d;
}

.category-tag.troubleshoot {
  background: #fef3c7;
  color: #b45309;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.faq-question {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.toggle-indicator {
  font-size: 1.25rem;
  color: #3b82f6;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* FAQ Body */
.faq-card-body {
  padding: 0 20px 20px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.65;
}

.faq-answer-content {
  padding-top: 14px;
}

.faq-answer-content p {
  margin: 0 0 12px;
}

.faq-answer-content ul, .faq-answer-content ol {
  padding-left: 20px;
  margin: 8px 0 14px;
}

.faq-answer-content li {
  margin-bottom: 6px;
}

.faq-answer-content code {
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: monospace;
}

/* Table */
.table-responsive {
  overflow-x: auto;
  margin: 12px 0;
}

.faq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.faq-table th, .faq-table td {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.faq-table th {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
}

/* Credentials Badge */
.credentials-badge-box {
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  padding: 14px;
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cred-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.92rem;
}

.cred-label {
  font-weight: 600;
  color: #475569;
}

.cred-val.highlight {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

/* Tips Box */
.tips-box {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 14px;
  font-size: 0.88rem;
  color: #166534;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin-bottom: 6px;
}

.tips-box ul {
  margin: 0;
  padding-left: 18px;
}

/* Warning Box */
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 14px;
  font-size: 0.88rem;
  color: #92400e;
}

.warning-box ion-icon {
  font-size: 20px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Footer Help */
.faq-footer {
  margin-top: 48px;
  text-align: center;
}

.footer-help-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-align: left;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

@media (max-width: 640px) {
  .footer-help-box {
    flex-direction: column;
    text-align: center;
  }
}

.help-icon {
  font-size: 48px;
  color: #3b82f6;
  flex-shrink: 0;
}

.help-content h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}

.help-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 12px;
}

.contact-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.contact-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #334155;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
}

.copyright {
  margin-top: 24px;
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Animations */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
