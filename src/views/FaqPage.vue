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
            <span class="portal-badge">Base de Connaissance & FAQ</span>
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
            <ion-icon :icon="bookOutline"></ion-icon>
          </div>
          <h1>Guide Complet & Foire Aux Questions</h1>
          <p class="subtitle">
            Documentation détaillée, illustrée et pas à pas pour l'utilisation du 
            <strong>Backend Odoo</strong> (Direction, Staff & Enseignants) 
            et du <strong>Portail Scolaire</strong> (Parents & Élèves).
          </p>

          <!-- Search Bar -->
          <div class="search-box">
            <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Rechercher par mot-clé (ex: Massar, notes, devoirs, mot de passe, profs, absences, RH, PWA...)" 
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

        <!-- Quick Access Banners -->
        <div class="quick-links-card">
          <div class="quick-link-item">
            <div class="ql-icon backend-icon">
              <ion-icon :icon="desktopOutline"></ion-icon>
            </div>
            <div class="ql-text">
              <strong>Portail Administratif Odoo</strong>
              <span>Gestion globale, notes Massar, profs, scolarité</span>
            </div>
            <a href="https://adminschool.alibdaealamia.ma" target="_blank" rel="noopener" class="ql-btn">
              Accès Odoo <ion-icon :icon="openOutline"></ion-icon>
            </a>
          </div>

          <div class="ql-divider"></div>

          <div class="quick-link-item">
            <div class="ql-icon frontend-icon">
              <ion-icon :icon="phonePortraitOutline"></ion-icon>
            </div>
            <div class="ql-text">
              <strong>Espace Mobile Parents & Élèves</strong>
              <span>Bulletins, devoirs bilingues, justificatifs d'absence</span>
            </div>
            <router-link to="/login" class="ql-btn primary">
              Espace Scolarité <ion-icon :icon="arrowForwardOutline"></ion-icon>
            </router-link>
          </div>
        </div>

        <!-- Section Navigation / Quick Jump Bar -->
        <div class="quick-summary-bar">
          <span class="qs-title"><ion-icon :icon="listOutline"></ion-icon> Rubriques disponibles :</span>
          <div class="qs-chips">
            <span class="qs-pill" @click="selectedCategory = 'backend'">🖥️ Backend Odoo ({{ getCategoryCount('backend') }})</span>
            <span class="qs-pill" @click="selectedCategory = 'frontend'">📱 Espace Parents ({{ getCategoryCount('frontend') }})</span>
            <span class="qs-pill" @click="selectedCategory = 'troubleshoot'">🛠️ Dépannage & FAQ ({{ getCategoryCount('troubleshoot') }})</span>
          </div>
        </div>

        <!-- FAQ Items List -->
        <div class="faq-list">
          <div v-if="filteredItems.length === 0" class="no-results">
            <ion-icon :icon="searchOutline"></ion-icon>
            <h3>Aucun résultat trouvé pour « {{ searchQuery }} »</h3>
            <p>Essayez avec d'autres termes (ex: <em>notes, mot de passe, téléphone, Massar, classe</em>) ou réinitialisez les filtres.</p>
            <button class="reset-btn" @click="resetFilters">Réinitialiser tous les filtres</button>
          </div>

          <div 
            v-for="(item, index) in filteredItems" 
            :key="item.id" 
            class="faq-card" 
            :class="{ open: isOpen(item.id) }"
          >
            <div class="faq-card-header" @click="toggleItem(item.id)">
              <div class="header-meta">
                <div class="category-tag" :class="item.category">
                  <ion-icon :icon="getCategoryIcon(item.category)"></ion-icon>
                  <span>{{ getCategoryLabel(item.category) }}</span>
                </div>
                <span class="badge-index">#{{ index + 1 }}</span>
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
                
                <!-- Tips box if present -->
                <div v-if="item.tips && item.tips.length" class="tips-box">
                  <div class="tips-title">
                    <ion-icon :icon="bulbOutline"></ion-icon>
                    <span>Conseils & Astuces Pratiques :</span>
                  </div>
                  <ul>
                    <li v-for="(tip, tIdx) in item.tips" :key="tIdx" v-html="tip"></li>
                  </ul>
                </div>

                <!-- Warning box if present -->
                <div v-if="item.warning" class="warning-box">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <div class="warning-text" v-html="item.warning"></div>
                </div>

                <!-- Example box if present -->
                <div v-if="item.example" class="example-box">
                  <div class="example-title">
                    <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                    <span>Exemple Concret :</span>
                  </div>
                  <div class="example-text" v-html="item.example"></div>
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
              <h3>Vous n'avez pas trouvé votre réponse ?</h3>
              <p>L'équipe d'administration et de support technique de l'école est à votre service pour vous guider.</p>
              <div class="contact-links">
                <a href="mailto:contact@alibdaealamia.ma" class="contact-pill">
                  <ion-icon :icon="mailOutline"></ion-icon> contact@alibdaealamia.ma
                </a>
                <span class="contact-pill">
                  <ion-icon :icon="callOutline"></ion-icon> +212 5 39 99 99 99
                </span>
                <a href="https://adminschool.alibdaealamia.ma" target="_blank" rel="noopener" class="contact-pill odoo">
                  <ion-icon :icon="desktopOutline"></ion-icon> Portail Odoo
                </a>
              </div>
            </div>
          </div>
          <p class="copyright">
            © 2026 Groupe Scolaire Al Ibdae Al Alamia • Système de Gestion Scolaire Intégré
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
  addCircleOutline, removeCircleOutline, bookOutline, listOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

interface FaqItem {
  id: string;
  category: 'backend' | 'frontend' | 'troubleshoot';
  question: string;
  answerHtml: string;
  tips?: string[];
  warning?: string;
  example?: string;
}

const searchQuery = ref('');
const selectedCategory = ref('all');
const openItemIds = ref<Set<string>>(new Set([
  'roles-odoo', 'create-user-odoo', 'config-teacher-scope', 
  'massar-import', 'login-parent', 'homework-tracking'
]));

const categories = [
  { id: 'all', label: 'Toutes les rubriques', icon: helpCircleOutline },
  { id: 'backend', label: 'Backend Odoo', icon: desktopOutline },
  { id: 'frontend', label: 'Espace Parents & Élèves', icon: phonePortraitOutline },
  { id: 'troubleshoot', label: 'Dépannage & FAQ', icon: buildOutline },
];

const faqData: FaqItem[] = [
  // ==========================================
  // --- 1. BACKEND ODOO (ADMIN & ENSEIGNANTS)
  // ==========================================
  {
    id: 'roles-odoo',
    category: 'backend',
    question: "Quels sont les rôles d'accès dans Odoo et leurs autorisations détaillées ?",
    answerHtml: `
      <p>Le système scolaire est doté d'une gouvernance à <strong>3 niveaux de sécurité hermétiques</strong> configurés sous la catégorie <em>Éducation > Gestion Scolaire</em> :</p>
      
      <div class="table-responsive">
        <table class="faq-table">
          <thead>
            <tr>
              <th>Rôle Odoo</th>
              <th>Périmètre & Autorisations</th>
              <th>Restrictions & Sécurité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>👑 Direction / Super Admin</strong></td>
              <td>
                • Accès illimité à l'intégralité du système.<br>
                • Configuration des années scolaires, classes, coefficients et matières.<br>
                • Gestion financière, comptabilité, facturation et paiements.<br>
                • Gestion des comptes utilisateurs, professeurs et personnel RH.<br>
                • Consultation et modification des bulletins de toutes les classes.
              </td>
              <td><span class="badge-success">Aucune restriction</span></td>
            </tr>
            <tr>
              <td><strong>🏢 Administration (Staff)</strong></td>
              <td>
                • Gestion quotidienne de la vie scolaire sur <strong>toutes les classes</strong>.<br>
                • Inscription des élèves, passage d'année et fiches familles.<br>
                • Import des fichiers de notes officiels <strong>MASSAR</strong> pour tous les niveaux.<br>
                • Traitement des absences, justificatifs médicaux et retards.<br>
                • Gestion du transport scolaire, cantine et objets trouvés.
              </td>
              <td>
                <span class="badge-warning">Pas d'accès aux configurations système critiques ni à la suppression de comptes professeurs ou RH.</span>
              </td>
            </tr>
            <tr>
              <td><strong>👨‍🏫 Enseignant / Professeur</strong></td>
              <td>
                • Accès <strong>strictement restreint à ses propres classes</strong> (<code>level_ids</code>).<br>
                • Accès uniquement à <strong>ses propres matières</strong> (<code>subject_ids</code>).<br>
                • Saisie des devoirs à la maison avec traduction bilingue automatique.<br>
                • Saisie des présences / absences de ses élèves à chaque séance.<br>
                • Consultation de son emploi du temps et cahier de texte.
              </td>
              <td>
                <span class="badge-danger">
                  Hermétisme total : invisible sur les autres classes. Rejet immédiat par Odoo si tentative de créer un devoir hors de ses classes assignées.
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    tips: [
      "Dans Odoo 19, ce rôle est contrôlé par le champ <strong>Gestion Scolaire</strong> dans l'onglet <strong>Droits d'accès</strong> de chaque utilisateur."
    ]
  },
  {
    id: 'create-user-odoo',
    category: 'backend',
    question: "Comment créer un nouvel utilisateur (Professeur ou Staff) et lui attribuer son rôle ?",
    answerHtml: `
      <p>Pour créer un compte d'accès au portail administratif Odoo :</p>
      <ol class="step-list">
        <li>Connectez-vous en tant qu'administrateur à <a href="https://adminschool.alibdaealamia.ma" target="_blank">adminschool.alibdaealamia.ma</a>.</li>
        <li>Ouvrez le menu <strong>Paramètres</strong> ⚙️ &gt; <strong>Utilisateurs &amp; Sociétés</strong> &gt; <strong>Utilisateurs</strong>.</li>
        <li>Cliquez sur le bouton <strong>Nouveau</strong> en haut à gauche :
          <ul>
            <li><strong>Nom</strong> : Prénom et Nom de la personne (ex: <em>Younes Bakkali</em>).</li>
            <li><strong>Courriel / Identifiant</strong> : Son adresse email professionnelle (ex: <code>younes.bakkali@alibdaealamia.ma</code>).</li>
          </ul>
        </li>
        <li>Dans l'onglet <strong>Droits d'accès</strong>, faites défiler jusqu'à la section <strong>ÉDUCATION</strong> :
          <ul>
            <li>Dans le champ <strong>Gestion Scolaire</strong>, sélectionnez :
              <ul>
                <li><code>Enseignant</code> : pour les professeurs.</li>
                <li><code>Administration</code> : pour le secrétariat et surveillants généraux.</li>
                <li><code>Direction / Super Admin</code> : pour la direction générale.</li>
              </ul>
            </li>
          </ul>
        </li>
        <li>Cliquez sur le nuage / bouton <strong>Enregistrer</strong>.</li>
        <li>Définissez son mot de passe initial en cliquant sur la roue crantée ⚙️ (en haut à gauche de la fiche) &gt; <strong>Changer le mot de passe</strong>.</li>
      </ol>
    `,
    warning: "Pour un professeur, vous <strong>devez obligatoirement</strong> passer à l'étape suivante (configuration de la fiche professeur), sans quoi il ne verra aucune classe après sa connexion.",
    example: "Pour Mme Fatima en charge des Maths en 6APG : Créez l'utilisateur avec le rôle <code>Enseignant</code>, puis associez-le à la fiche professeur en sélectionnant la classe <code>6APG-1</code> et la matière <code>Mathématiques</code>."
  },
  {
    id: 'config-teacher-scope',
    category: 'backend',
    question: "Comment configurer le périmètre pédagogique d'un professeur (Classes & Matières) ?",
    answerHtml: `
      <p>C'est cette étape clé qui active le filtrage de sécurité strict pour chaque enseignant :</p>
      <ol class="step-list">
        <li>Allez dans le menu <strong>Portail Scolaire</strong> &gt; <strong>Configuration</strong> &gt; <strong>Professeurs</strong>.</li>
        <li>Recherchez le professeur dans la liste ou cliquez sur <strong>Nouveau</strong>.</li>
        <li>Dans la section <strong>Coordonnées &amp; Accès Odoo</strong> :
          <ul>
            <li><strong>Compte Utilisateur Odoo</strong> : Sélectionnez l'utilisateur créé à l'étape précédente.</li>
            <li><strong>Téléphone</strong> &amp; <strong>Courriel</strong> : Renseignez ses coordonnées directes.</li>
          </ul>
        </li>
        <li>Dans la section <strong>Affectation Pédagogique</strong> :
          <ul>
            <li><strong>Classes / Niveaux</strong> : Cochez exactement les classes qu'il encadre (ex: <code>6APG-1</code>, <code>6APG-2</code>, <code>5APG-1</code>).</li>
            <li><strong>Matières Enseignées</strong> : Choisissez les matières dispensées (ex: <code>Mathématiques</code>, <code>Sciences</code>).</li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Sauvegarder</strong>.</li>
      </ol>
      <div class="result-banner">
        <strong>Effet immédiat en temps réel :</strong> Dès que le professeur se connecte, Odoo filtre automatiquement l'ensemble des modules (élèves, devoirs, notes, présences) pour n'afficher <em>que</em> ces classes et matières.
      </div>
    `
  },
  {
    id: 'hr-employee-sync',
    category: 'backend',
    question: "Comment fonctionne la synchronisation avec le module Employés RH (hr.employee) ?",
    answerHtml: `
      <p>Pour assurer une gestion administrative centralisée, chaque enseignant et administrateur est automatiquement synchronisé avec le module officiel des <strong>Ressources Humaines Odoo</strong> :</p>
      <ul>
        <li><strong>Création automatique</strong> : Toute création d'une fiche dans <em>Portail Scolaire &gt; Professeurs</em> génère ou lie automatiquement une fiche dans <strong>Employés</strong> (<code>hr.employee</code>).</li>
        <li><strong>Départementation automatique</strong> :
          <ul>
            <li>Les enseignants sont automatiquement rattachés au département <strong>Corps Enseignant</strong>.</li>
            <li>Le personnel administratif est classé dans le département <strong>Administration Scolaire</strong>.</li>
          </ul>
        </li>
        <li><strong>Mise à jour bidirectionnelle</strong> : Si vous changez le numéro de téléphone, l'email, la photo ou le poste de l'enseignant, la fiche employé RH est mise à jour instantanément.</li>
        <li><strong>Organigramme &amp; Présences</strong> : Vous pouvez visualiser l'organigramme de l'école directement depuis le menu <em>Employés</em>.</li>
      </ul>
    `
  },
  {
    id: 'massar-import',
    category: 'backend',
    question: "Comment importer les notes depuis un fichier Excel officiel MASSAR (.xlsx) ?",
    answerHtml: `
      <p>L'assistant d'importation Odoo a été spécialement développé pour analyser les exports officiels générés par la plateforme marocaine <strong>MASSAR</strong> :</p>
      
      <ol class="step-list">
        <li>Depuis MASSAR, téléchargez le fichier Excel de notes officiel de la classe (ex: <code>Note_CC1_Maths_6APG.xlsx</code>).</li>
        <li>Dans Odoo, rendez-vous dans <strong>Portail Scolaire</strong> &gt; <strong>📥 Import Notes MASSAR</strong>.</li>
        <li>Cliquez sur le champ <strong>Fichier Excel MASSAR (.xlsx)</strong> et sélectionnez votre fichier.</li>
        <li><strong>Détection Automatique Intelligente :</strong> Odoo inspecte instantanément les métadonnées de l'en-tête marocain :
          <ul>
            <li>La matière (<code>المادة</code>, ex: Mathématiques / الرياضيات).</li>
            <li>Le niveau et la section (<code>القسم / المستوى</code>, ex: 6APG-1).</li>
            <li>Le semestre (<code>الدورة الأولى / الدورة الثانية</code>).</li>
            <li>Le numéro de contrôle continu (<code>الفرض الأول / الثاني / الثالث</code>).</li>
          </ul>
        </li>
        <li>Vérifiez les champs pré-remplis (vous pouvez les ajuster manuellement si besoin).</li>
        <li>Cliquez sur le bouton bleu <strong>Importer &amp; Alimenter les Notes</strong>.</li>
      </ol>

      <div class="result-box">
        <strong>Traitement effectué par Odoo :</strong>
        <ul>
          <li>Appariement de chaque élève par son <strong>Code National Massar</strong> ou nom complet.</li>
          <li>Enregistrement des notes individuelles dans <code>school.grade</code>.</li>
          <li>Recalcul automatique immédiat des moyennes et synthèses de bulletins (<code>school.grade.summary</code>).</li>
          <li>Publication automatique sur l'application mobile des parents d'élèves concernés.</li>
        </ul>
      </div>
    `,
    tips: [
      "Pour éviter toute erreur, veillez à ne pas supprimer les 5 premières lignes d'en-tête du fichier Excel téléchargé depuis Massar."
    ]
  },
  {
    id: 'homework-translation',
    category: 'backend',
    question: "Comment fonctionne la traduction automatique bilingue (Arabe ↔ Français) des devoirs ?",
    answerHtml: `
      <p>Pour faciliter la communication avec toutes les familles, le module de devoirs intègre un moteur de <strong>traduction bidirectionnelle instantanée</strong> :</p>
      
      <ol class="step-list">
        <li>Allez dans <strong>Portail Scolaire</strong> &gt; <strong>Devoirs</strong> &gt; <strong>Nouveau</strong>.</li>
        <li>Sélectionnez la classe (<code>Niveau / Classe</code>), la matière et la date d'échéance.</li>
        <li>Ouvrez l'onglet <strong>Contenu Bilingue (Arabe ↔ Français)</strong> :
          <ul>
            <li><strong>Cas 1 : Vous écrivez en Arabe</strong>
              <br>Saisissez le titre dans <em>العنوان بالعربية</em> et les instructions dans <em>التعليمات بالعربية</em>.
              <br>👉 Dès la sortie du champ, Odoo génère et traduit automatiquement le <strong>Titre</strong> et la <strong>Description</strong> en français !
            </li>
            <li><strong>Cas 2 : Vous écrivez en Français</strong>
              <br>Saisissez le titre et la description en français.
              <br>👉 Odoo génère et traduit immédiatement la version arabe correspondante dans les champs arabes.
            </li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Sauvegarder</strong>.</li>
      </ol>
      <p>Sur l'application mobile, chaque parent ou élève voit le devoir s'afficher dans la langue de son choix (FR ou AR) en fonction du sélecteur en haut du menu.</p>
    `,
    example: "Si vous tapez en titre arabe : <code>واجب منزلي في مادة النشاط العلمي</code>, le champ français se remplit automatiquement avec <code>Devoir à domicile en sciences</code>."
  },
  {
    id: 'attendance-backend',
    category: 'backend',
    question: "Comment enregistrer les absences et retards côté administration ?",
    answerHtml: `
      <p>La gestion de la vie scolaire s'effectue dans <strong>Portail Scolaire &gt; Présences &amp; Absences</strong> :</p>
      <ul>
        <li><strong>Feuille d'appel par séance :</strong> Les enseignants effectuent l'appel depuis leur tablette/ordinateur en début de cours. Les élèves absents sont cochés.</li>
        <li><strong>Suivi administratif :</strong> Le surveillant général ou le secrétariat visualise en temps réel la liste des absents du jour par niveau.</li>
        <li><strong>Validation des justificatifs :</strong> Lorsqu'un parent soumet un justificatif médical depuis l'application mobile, une notification apparaît dans Odoo. L'administrateur peut visualiser la pièce jointe, valider ou refuser la justification en un clic.</li>
      </ul>
    `
  },

  // ==========================================
  // --- 2. FRONTEND PARENTS & ELEVES
  // ==========================================
  {
    id: 'login-parent',
    category: 'frontend',
    question: "Comment les parents se connectent-ils à l'application mobile et au portail web ?",
    answerHtml: `
      <p>Pour garantir une prise en main immédiate sans risque d'oubli d'identifiants complexes :</p>
      
      <div class="credentials-badge-box">
        <div class="cred-item">
          <span class="cred-label">📱 Identifiant de connexion :</span>
          <span class="cred-val">Le numéro de téléphone du parent renseigné à l'école (ex: <code>0612345678</code> ou <code>0712345678</code>)</span>
        </div>
        <div class="cred-item">
          <span class="cred-label">🔒 Mot de passe initial :</span>
          <span class="cred-val highlight">20262027</span>
        </div>
      </div>

      <ol class="step-list">
        <li>Ouvrez le lien de l'application sur smartphone ou ordinateur : <a href="/login">scolarite.alibdaealamia.ma</a>.</li>
        <li>Dans l'onglet <strong>Parent</strong>, saisissez votre numéro de téléphone et le mot de passe <code>20262027</code>.</li>
        <li>Cliquez sur <strong>Se Connecter</strong>.</li>
        <li><strong>Familles avec plusieurs enfants :</strong> Si vous avez 2, 3 enfants ou plus inscrits à l'école, un écran de sélection s'affiche avec la photo et la classe de chacun. Cliquez simplement sur l'enfant de votre choix !</li>
      </ol>
    `,
    tips: [
      "Vous pouvez basculer d'un enfant à l'autre à tout moment depuis le menu sans avoir besoin de vous déconnecter."
    ]
  },
  {
    id: 'view-grades-parent',
    category: 'frontend',
    question: "Où et comment consulter les notes, les moyennes et les bulletins scolaires ?",
    answerHtml: `
      <p>Le suivi pédagogique est accessible depuis le menu latéral ou l'onglet <strong>Notes &amp; Bulletins</strong> :</p>
      <ul>
        <li><strong>Tableau de synthèse :</strong> Affichage de la moyenne générale du semestre, du rang de l'élève dans sa classe et de l'appréciation globale.</li>
        <li><strong>Détail par matière :</strong> En cliquant sur une matière (ex: Mathématiques, Arabe, Français, Histoire-Géo), vous visualisez les notes obtenues à chaque contrôle continu (Contrôle 1, Contrôle 2, Activités, Examen).</li>
        <li><strong>Comparatif :</strong> Indicateur de la note la plus haute, la plus basse et de la moyenne de la classe pour situer le niveau de l'élève.</li>
        <li><strong>Téléchargement PDF :</strong> Bouton de téléchargement du bulletin scolaire officiel dès sa validation par la direction.</li>
      </ul>
    `
  },
  {
    id: 'homework-tracking',
    category: 'frontend',
    question: "Comment suivre les devoirs, leçons et exercices à faire à la maison ?",
    answerHtml: `
      <p>L'espace <strong>Devoirs</strong> permet aux parents et aux élèves de ne manquer aucune tâche :</p>
      <ol class="step-list">
        <li>Cliquez sur <strong>Devoirs</strong> dans le menu de navigation.</li>
        <li>Les devoirs sont organisés par priorité chronologique :
          <ul>
            <li>🔴 <strong>Urgents / À rendre aujourd'hui</strong></li>
            <li>🟡 <strong>À rendre demain</strong></li>
            <li>🟢 <strong>Pour les prochains jours</strong></li>
          </ul>
        </li>
        <li>Chaque carte indique : la matière, le titre, la date limite précise et les consignes détaillées de l'enseignant.</li>
        <li><strong>Bascule linguistique :</strong> Grâce au sélecteur en haut du menu (🇲🇦 AR / 🇫🇷 FR), le devoir s'affiche immédiatement en arabe ou en français selon la préférence de l'élève.</li>
        <li><strong>Case à cocher « Fait » :</strong> L'élève ou le parent peut cocher la case pour marquer le devoir comme accompli et maintenir son journal de travail à jour.</li>
      </ol>
    `
  },
  {
    id: 'absences-parent',
    category: 'frontend',
    question: "Comment consulter les absences et envoyer un justificatif médical en photo ?",
    answerHtml: `
      <p>En cas d'absence imprévue ou de rendez-vous médical :</p>
      <ol class="step-list">
        <li>Ouvrez le menu <strong>Vie Scolaire</strong> &gt; <strong>Absences &amp; Retards</strong>.</li>
        <li>Consultez l'historique complet : date, heure de la séance, matière manquée et statut (Justifiée / Non justifiée).</li>
        <li>Pour transmettre un justificatif :
          <ul>
            <li>Cliquez sur le bouton <strong>Justifier une absence</strong>.</li>
            <li>Sélectionnez la séance concernée.</li>
            <li>Indiquez le motif (maladie, urgence familiale, convocation officielle...).</li>
            <li>Cliquez sur <strong>Ajouter un document</strong> pour prendre en photo le certificat médical directement avec l'appareil photo du smartphone ou joindre un fichier PDF/Image.</li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Envoyer à l'administration</strong>.</li>
      </ol>
      <div class="result-banner">
        Dès validation par l'administration, le statut de l'absence passe en vert avec la mention <em>Justifiée</em>.
      </div>
    `
  },
  {
    id: 'payments-parent',
    category: 'frontend',
    question: "Comment suivre les paiements de scolarité, cantine et transport ?",
    answerHtml: `
      <p>La section <strong>Finances &amp; Paiements</strong> offre une transparence totale aux parents :</p>
      <ul>
        <li><strong>Échéancier annuel :</strong> Tableau récapitulatif mois par mois des frais de scolarité.</li>
        <li><strong>Statut en temps réel :</strong>
          <ul>
            <li><span class="badge-success">Payé</span> : Mensualité réglée avec date et référence de reçu.</li>
            <li><span class="badge-warning">En attente</span> : Échéance courante du mois.</li>
            <li><span class="badge-danger">Échu</span> : Mensualité en retard.</li>
          </ul>
        </li>
        <li><strong>Services optionnels :</strong> Suivi séparé des cotisations pour le transport scolaire, la restauration/cantine et les activités de club.</li>
        <li><strong>Reçus numériques :</strong> Téléchargement immédiat de l'attestation de paiement pour chaque opération validée.</li>
      </ul>
    `
  },
  {
    id: 'pwa-install',
    category: 'frontend',
    question: "Comment installer l'application sur son téléphone (iPhone ou Android) comme une vraie application ?",
    answerHtml: `
      <p>L'application est une <strong>Progressive Web App (PWA)</strong> moderne : elle s'installe directement sur votre écran d'accueil sans passer par le Play Store ou l'App Store, et sans consommer de mémoire inutile :</p>
      
      <div class="two-col-guide">
        <div class="guide-box">
          <h4>📱 Sur Android (Google Chrome) :</h4>
          <ol>
            <li>Ouvrez <code>scolarite.alibdaealamia.ma</code> dans Chrome.</li>
            <li>Appuyez sur les <strong>3 petits points</strong> en haut à droite.</li>
            <li>Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
            <li>L'icône Al Ibdae Al Alamia s'ajoute à votre écran comme n'importe quelle application !</li>
          </ol>
        </div>

        <div class="guide-box">
          <h4>🍎 Sur iPhone (Apple Safari) :</h4>
          <ol>
            <li>Ouvrez <code>scolarite.alibdaealamia.ma</code> dans Safari.</li>
            <li>Appuyez sur l'icône de <strong>Partage</strong> en bas (carré avec une flèche vers le haut 📤).</li>
            <li>Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong> ➕.</li>
            <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
          </ol>
        </div>
      </div>
    `
  },

  // ==========================================
  // --- 3. DEPANNAGE & QUESTIONS FREQUENTES
  // ==========================================
  {
    id: 'troubleshoot-teacher-empty',
    category: 'troubleshoot',
    question: "Pourquoi un enseignant ne voit aucune classe ou aucun devoir après sa connexion ?",
    answerHtml: `
      <p>Ce problème survient dans 99% des cas lorsque le compte utilisateur Odoo existe mais que la <strong>Fiche Professeur</strong> n'a pas été liée :</p>
      <ol class="step-list">
        <li>Connectez-vous en tant qu'administrateur dans Odoo.</li>
        <li>Allez dans <strong>Portail Scolaire &gt; Configuration &gt; Professeurs</strong>.</li>
        <li>Ouvrez la fiche de l'enseignant.</li>
        <li>Vérifiez impérativement 3 points :
          <ul>
            <li>Le champ <strong>Compte Utilisateur Odoo</strong> doit pointer sur son compte (ex: <code>younes.bakkali@alibdaealamia.ma</code>).</li>
            <li>Le champ <strong>Classes / Niveaux</strong> doit comporter au moins une classe (ex: <code>6APG-1</code>).</li>
            <li>Le champ <strong>Matières Enseignées</strong> doit comporter au moins une matière (ex: <code>Mathématiques</code>).</li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Sauvegarder</strong>.</li>
        <li>Demandez au professeur de se déconnecter et de se reconnecter : ses classes apparaîtront immédiatement !</li>
      </ol>
    `
  },
  {
    id: 'troubleshoot-massar-format',
    category: 'troubleshoot',
    question: "Que faire en cas d'erreur lors de l'import d'un fichier Excel MASSAR ?",
    answerHtml: `
      <p>Si l'assistant d'importation rejette votre fichier, suivez cette liste de vérification :</p>
      <ul>
        <li><strong>Format du fichier :</strong> Le fichier doit être au format <strong>.xlsx</strong> natif (évitez d'enregistrer au format .xls ancien ou .csv).</li>
        <li><strong>En-tête officiel intact :</strong> Ne supprimez ni ne modifiez les lignes d'en-tête générées par Massar (notamment les cellules contenant le nom de la matière et la classe).</li>
        <li><strong>Correspondance des noms de classes :</strong> Le nom de la classe dans Massar (ex: <code>6APG-1</code>) doit correspondre aux classes enregistrées dans Odoo.</li>
        <li><strong>Codes Massar :</strong> Vérifiez que les élèves possèdent bien leur Code Massar renseigné dans leur fiche Odoo. Si un élève a été inscrit sans code Massar, Odoo tentera de faire la correspondance par son Nom et Prénom complets.</li>
      </ul>
    `
  },
  {
    id: 'troubleshoot-parent-login-failed',
    category: 'troubleshoot',
    question: "Un parent n'arrive pas à se connecter avec son numéro de téléphone, quelle est la procédure ?",
    answerHtml: `
      <ol class="step-list">
        <li>Vérifiez le numéro enregistré dans Odoo : allez dans <strong>Portail Scolaire &gt; Configuration &gt; Parents</strong>.</li>
        <li>Assurez-vous que le numéro est bien au format standard marocain sans espaces ni caractères spéciaux (ex: <code>0612345678</code>).</li>
        <li>Vérifiez dans l'onglet <strong>Enfants / Élèves</strong> de la fiche parent qu'au moins un enfant lui est bien rattaché.</li>
        <li>Rappelez au parent que le mot de passe est <code>20262027</code>.</li>
        <li>Si le parent a changé de numéro, modifiez le champ Téléphone dans sa fiche Odoo et cliquez sur Sauvegarder : la mise à jour est instantanée !</li>
      </ol>
    `
  },
  {
    id: 'troubleshoot-reset-password',
    category: 'troubleshoot',
    question: "Comment réinitialiser le mot de passe d'un enseignant ou membre de l'administration ?",
    answerHtml: `
      <ol class="step-list">
        <li>En tant qu'administrateur, rendez-vous dans <strong>Paramètres &gt; Utilisateurs &amp; Sociétés &gt; Utilisateurs</strong>.</li>
        <li>Ouvrez la fiche de l'utilisateur concerné.</li>
        <li>Dans la barre d'action supérieure, cliquez sur l'icône de roue crantée ⚙️ &gt; <strong>Changer le mot de passe</strong>.</li>
        <li>Tapez le nouveau mot de passe souhaité et confirmez.</li>
        <li>Transmettez le nouveau mot de passe à l'enseignant.</li>
      </ol>
    `
  },
  {
    id: 'troubleshoot-network-ssl',
    category: 'troubleshoot',
    question: "Pourquoi l'alerte « Connexion non privée » apparaissait-elle sur www.alibdaealamia.ma ?",
    answerHtml: `
      <p>Cette alerte technique était due à un <strong>conflit d'anciennes adresses IP dans la zone DNS</strong> chez l'hébergeur Nindohost :</p>
      <ul>
        <li>Le domaine <code>alibdaealamia.ma</code> contenait encore une ancienne adresse IP (<code>116.203.198.159</code>) en plus de la nouvelle IP (<code>68.183.19.16</code>).</li>
        <li>Lorsque le système de sécurité Let's Encrypt tente de générer le certificat SSL, il est bloqué par la présence de cette ancienne IP.</li>
        <li><strong>Solution :</strong> Supprimer l'enregistrement A vers l'ancienne IP dans Nindohost pour n'avoir que <code>68.183.19.16</code>.</li>
        <li><strong>Accès immédiat sécurisé :</strong> L'adresse officielle <a href="https://scolarite.alibdaealamia.ma/FAQ" target="_blank">https://scolarite.alibdaealamia.ma/FAQ</a> est 100% sécurisée avec certificat SSL valide sans aucune alerte.</li>
      </ul>
    `
  }
];

const filteredItems = computed(() => {
  return faqData.filter(item => {
    // Category filter
    if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
      return false;
    }
    // Search query filter
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase().trim();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answerHtml.toLowerCase().includes(q);
      const matchTips = item.tips ? item.tips.some(t => t.toLowerCase().includes(q)) : false;
      const matchEx = item.example ? item.example.toLowerCase().includes(q) : false;
      return matchQ || matchA || matchTips || matchEx;
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
    case 'frontend': return 'Espace Parents & Élèves';
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
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
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
  font-weight: 800;
  font-size: 1.05rem;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.portal-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #eff6ff;
  color: #2563eb;
  padding: 3px 9px;
  border-radius: 9999px;
  border: 1px solid #bfdbfe;
}

.back-btn, .action-btn {
  --color: #2563eb;
  font-weight: 600;
  font-size: 0.88rem;
}

.faq-content {
  --background: #f8fafc;
}

.faq-container {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 24px 12px 32px;
}

.hero-icon-box {
  width: 68px;
  height: 68px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  box-shadow: 0 12px 28px -6px rgba(37, 99, 235, 0.4);
}

.hero-section h1 {
  font-size: 2.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  letter-spacing: -0.6px;
}

.hero-section .subtitle {
  font-size: 1.05rem;
  color: #64748b;
  max-width: 700px;
  margin: 0 auto 24px;
  line-height: 1.6;
}

/* Search Box */
.search-box {
  position: relative;
  max-width: 650px;
  margin: 0 auto 22px;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.3rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 15px 44px 15px 50px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.98rem;
  color: #1e293b;
  outline: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.clear-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.3rem;
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
  padding: 9px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.cat-chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.cat-chip.active {
  background: #1e293b;
  color: white;
  border-color: #1e293b;
  box-shadow: 0 4px 14px rgba(30, 41, 59, 0.25);
}

.cat-chip .count-badge {
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.75rem;
  padding: 2px 7px;
  border-radius: 999px;
}

.cat-chip.active .count-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Quick Summary Bar */
.quick-summary-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 10px 16px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 0.88rem;
  flex-wrap: wrap;
}

.qs-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #334155;
}

.qs-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.qs-pill {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s;
}

.qs-pill:hover {
  background: #e2e8f0;
}

/* Quick Links Card */
.quick-links-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 18px 22px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  gap: 20px;
}

@media (max-width: 680px) {
  .quick-links-card {
    flex-direction: column;
  }
  .ql-divider {
    width: 100% !important;
    height: 1px !important;
    margin: 8px 0;
  }
}

.quick-link-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.ql-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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
  font-size: 0.96rem;
  color: #0f172a;
}

.ql-text span {
  font-size: 0.82rem;
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
  padding: 9px 15px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 10px;
  font-size: 0.84rem;
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
  gap: 16px;
}

.no-results {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  border: 1.5px dashed #cbd5e1;
}

.no-results ion-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.no-results h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}

.no-results p {
  color: #64748b;
  font-size: 0.94rem;
  margin: 0 0 20px;
}

.reset-btn {
  padding: 9px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

/* FAQ Card */
.faq-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
}

.faq-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}

.faq-card.open {
  border-color: #93c5fd;
  box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.12);
}

.faq-card-header {
  padding: 18px 22px;
  cursor: pointer;
  user-select: none;
}

.header-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.badge-index {
  font-size: 0.76rem;
  font-weight: 700;
  color: #94a3b8;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 3px 9px;
  border-radius: 6px;
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
  gap: 14px;
}

.faq-question {
  font-size: 1.08rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.45;
}

.toggle-indicator {
  font-size: 1.3rem;
  color: #2563eb;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* FAQ Body */
.faq-card-body {
  padding: 0 22px 24px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
  color: #334155;
  font-size: 0.96rem;
  line-height: 1.7;
}

.faq-answer-content {
  padding-top: 16px;
}

.faq-answer-content p {
  margin: 0 0 12px;
}

.faq-answer-content ul, .faq-answer-content ol {
  padding-left: 22px;
  margin: 10px 0 16px;
}

.faq-answer-content li {
  margin-bottom: 8px;
}

.faq-answer-content code {
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 0.88em;
  font-family: monospace;
  border: 1px solid #e2e8f0;
}

/* Step list */
.step-list {
  padding-left: 20px;
}

.step-list > li {
  margin-bottom: 12px;
}

/* Table */
.table-responsive {
  overflow-x: auto;
  margin: 14px 0 18px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.faq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.faq-table th, .faq-table td {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.faq-table th {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
}

.badge-success {
  display: inline-block;
  background: #dcfce7;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.badge-warning {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.badge-danger {
  display: inline-block;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

/* Result box / banners */
.result-banner {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 14px 0;
  font-size: 0.92rem;
  color: #1e40af;
}

.result-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
  margin: 14px 0;
}

.result-box strong {
  color: #0f172a;
}

.result-box ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

/* Credentials Badge */
.credentials-badge-box {
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  padding: 16px 18px;
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cred-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.94rem;
  flex-wrap: wrap;
}

.cred-label {
  font-weight: 700;
  color: #334155;
}

.cred-val.highlight {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 800;
  font-size: 1.05rem;
  padding: 2px 10px;
  border-radius: 6px;
  letter-spacing: 0.8px;
}

/* Two-column guide */
.two-col-guide {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 14px 0;
}

@media (max-width: 640px) {
  .two-col-guide {
    grid-template-columns: 1fr;
  }
}

.guide-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
}

.guide-box h4 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
}

.guide-box ol {
  margin: 0;
  padding-left: 20px;
  font-size: 0.88rem;
}

.guide-box li {
  margin-bottom: 6px;
}

/* Tips Box */
.tips-box {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
  border-radius: 10px;
  padding: 14px 18px;
  margin-top: 16px;
  font-size: 0.9rem;
  color: #166534;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin-bottom: 8px;
}

.tips-box ul {
  margin: 0;
  padding-left: 20px;
}

/* Warning Box */
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 10px;
  padding: 14px 18px;
  margin-top: 16px;
  font-size: 0.9rem;
  color: #92400e;
}

.warning-box ion-icon {
  font-size: 22px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Example Box */
.example-box {
  background: #f8fafc;
  border-left: 4px solid #64748b;
  border-radius: 10px;
  padding: 14px 18px;
  margin-top: 16px;
  font-size: 0.9rem;
  color: #334155;
}

.example-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #1e293b;
}

/* Footer Help */
.faq-footer {
  margin-top: 48px;
  text-align: center;
}

.footer-help-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 26px;
  display: flex;
  align-items: center;
  gap: 22px;
  text-align: left;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
}

@media (max-width: 680px) {
  .footer-help-box {
    flex-direction: column;
    text-align: center;
  }
}

.help-icon {
  font-size: 52px;
  color: #2563eb;
  flex-shrink: 0;
}

.help-content h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}

.help-content p {
  color: #64748b;
  font-size: 0.92rem;
  margin: 0 0 14px;
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
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.contact-pill:hover {
  background: #e2e8f0;
}

.contact-pill.odoo {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.copyright {
  margin-top: 26px;
  font-size: 0.82rem;
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
