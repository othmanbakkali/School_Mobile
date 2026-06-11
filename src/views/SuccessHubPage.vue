<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Espace Réussite</ion-title>
      </ion-toolbar>
      <div class="segment-container">
        <ion-segment v-model="activeSegment" mode="md" class="custom-segment">
          <ion-segment-button value="badges">
            <ion-label>🏆 Mes Badges</ion-label>
          </ion-segment-button>
          <ion-segment-button value="revision">
            <ion-label>🤖 Révision IA</ion-label>
          </ion-segment-button>
          <ion-segment-button value="quests">
            <ion-label>⚡ Défis du Jour</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">

        <!-- ==================== TAB 1: MES BADGES ==================== -->
        <div v-if="activeSegment === 'badges'" class="badges-view">
          <div class="header-banner premium-card ion-padding">
            <div class="banner-flex">
              <div class="avatar-trophy">🏆</div>
              <div>
                <h2>Niveau de Réussite: 4 / 6 Badges</h2>
                <p>Prochain badge : <strong>Camarade d'Or</strong> (+20 XP requis)</p>
                <div class="level-progress-bar">
                  <div class="level-progress-fill" style="width: 66%;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="badges-grid">
            <div v-for="badge in badges" 
                 :key="badge.id" 
                 class="badge-card premium-card text-center" 
                 :class="{ locked: !badge.unlocked }"
                 @click="openBadgeDetails(badge)">
              <div class="badge-icon-wrap" :style="{ background: badge.color }">
                <span class="badge-emoji">{{ badge.emoji }}</span>
                <div v-if="!badge.unlocked" class="lock-overlay">🔒</div>
                <div v-else class="shine-glow"></div>
              </div>
              <h3>{{ badge.title }}</h3>
              <span class="badge-xp" :style="{ color: badge.unlocked ? badge.color : '#94a3b8' }">
                {{ badge.unlocked ? '+' + badge.xp + ' XP' : 'Verrouillé' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: AI REVISION FLASHCARDS ==================== -->
        <div v-else-if="activeSegment === 'revision'" class="revision-view">
          <!-- Step 1: Selection -->
          <div v-if="revisionState === 'select'" class="setup-box premium-card ion-padding text-center">
            <div class="ai-sparkle-icon">✨🤖✨</div>
            <h2>Générateur de Révisions IA</h2>
            <p>Choisis une matière pour générer tes fiches d'étude interactives personnalisées.</p>
            
            <div class="subject-select-grid">
              <button v-for="sub in subjects" 
                      :key="sub.id" 
                      class="subject-btn"
                      @click="selectSubject(sub)">
                <span class="sub-emoji">{{ sub.emoji }}</span>
                <span class="sub-name">{{ sub.name }}</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Generating Loading Screen -->
          <div v-else-if="revisionState === 'generating'" class="loading-box premium-card ion-padding text-center">
            <div class="pulse-ai-logo">🧠</div>
            <h2>Génération de fiches en cours</h2>
            <p class="loading-status">{{ currentLoadingStatus }}</p>
            <div class="loading-progress-container">
              <div class="loading-progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
          </div>

          <!-- Step 3: Flashcards display -->
          <div v-else-if="revisionState === 'cards'" class="cards-box">
            <div class="cards-header-row">
              <button class="back-btn-clear" @click="revisionState = 'select'">
                ← Autre matière
              </button>
              <span class="cards-counter">Fiche {{ currentCardIndex + 1 }} sur {{ generatedCards.length }}</span>
            </div>

            <!-- Swipe/Flip Card Container -->
            <div class="flashcard-container" @click="flipCard">
              <div class="flashcard-3d" :class="{ flipped: cardFlipped }">
                <div class="flashcard-inner">
                  <!-- Front Face: Question -->
                  <div class="flashcard-front premium-card ion-padding">
                    <span class="card-subject-tag">{{ selectedSubjectName }}</span>
                    <div class="card-question-box">
                      <h2>{{ generatedCards[currentCardIndex].question }}</h2>
                    </div>
                    <span class="tap-hint">👆 Appuie pour révéler la réponse</span>
                  </div>

                  <!-- Back Face: Explanation -->
                  <div class="flashcard-back premium-card ion-padding">
                    <span class="card-subject-tag reply">Réponse & Explication</span>
                    <div class="card-answer-box">
                      <p>{{ generatedCards[currentCardIndex].answer }}</p>
                      <div class="tip-card" v-if="generatedCards[currentCardIndex].tip">
                        💡 <strong>Astuce :</strong> {{ generatedCards[currentCardIndex].tip }}
                      </div>
                    </div>
                    <span class="tap-hint">👆 Appuie pour revenir à la question</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Navigation Controls -->
            <div class="card-navigation-controls">
              <button class="nav-control-btn" 
                      :disabled="currentCardIndex === 0" 
                      @click="prevCard">Précédent</button>
              <button class="nav-control-btn next" 
                      @click="nextCard">
                {{ currentCardIndex === generatedCards.length - 1 ? 'Terminer' : 'Suivant' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 3: DAILY QUESTS ==================== -->
        <div v-else-if="activeSegment === 'quests'" class="quests-view">
          <div class="quests-status premium-card ion-padding text-center">
            <h3>Défis du Jour</h3>
            <p>Complète les activités éducatives d'aujourd'hui pour doubler ton XP !</p>
            <div class="quests-progress-flex">
              <span>{{ completedQuestsCount }} / {{ quests.length }} Complétés</span>
              <div class="quests-bar">
                <div class="quests-fill" :style="{ width: (completedQuestsCount / quests.length * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="quests-list">
            <div v-for="quest in quests" 
                 :key="quest.id" 
                 class="quest-item premium-card ion-padding" 
                 :class="{ completed: quest.completed }">
              <div class="quest-checkbox" @click="toggleQuest(quest)">
                <div class="check-box-inner">
                  <span v-if="quest.completed">✓</span>
                </div>
              </div>
              <div class="quest-details">
                <h4>{{ quest.title }}</h4>
                <p>{{ quest.description }}</p>
                <div class="quest-xp-reward">+{{ quest.xp }} XP</div>
              </div>
              <span class="quest-icon">{{ quest.emoji }}</span>
            </div>
          </div>
        </div>

      </div>
    </ion-content>

    <!-- Badge Details Modal -->
    <div v-if="selectedBadge" class="modal-overlay" @click="selectedBadge = null">
      <div class="badge-modal premium-card ion-padding text-center" @click.stop>
        <button class="modal-close-btn" @click="selectedBadge = null">×</button>
        <div class="modal-badge-icon" :style="{ background: selectedBadge.color }">
          <span>{{ selectedBadge.emoji }}</span>
        </div>
        <h2>{{ selectedBadge.title }}</h2>
        <span class="modal-xp" :style="{ color: selectedBadge.unlocked ? selectedBadge.color : '#94a3b8' }">
          {{ selectedBadge.unlocked ? '+' + selectedBadge.xp + ' XP' : 'Badge Verrouillé' }}
        </span>
        <p class="modal-desc">{{ selectedBadge.description }}</p>
        
        <div class="modal-meta-box">
          <div v-if="selectedBadge.unlocked">
            <span class="unlock-date">Débloqué le {{ formatDate(selectedBadge.unlockedAt) }}</span>
            <div class="encouragement-box">
              💬 <strong>Félicitations de l'école :</strong> "{{ selectedBadge.teacherNote }}"
            </div>
          </div>
          <div v-else>
            <span class="lock-req">Comment le débloquer : {{ selectedBadge.unlockCriteria }}</span>
          </div>
        </div>
        <button class="modal-action-btn" @click="selectedBadge = null">Fermer</button>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonButtons, IonMenuButton
} from '@ionic/vue';
import { ref, computed } from 'vue';

const activeSegment = ref('badges');

// --- BADGES DATA ---
const selectedBadge = ref<any | null>(null);
const badges = ref([
  {
    id: 'badge-1',
    title: 'As du Calcul',
    emoji: '🧮',
    xp: 50,
    color: '#6366f1',
    unlocked: true,
    unlockedAt: '2026-06-05T10:00:00Z',
    description: "Attribué pour avoir résolu plus de 10 équations d'affilée en Calcul Mental.",
    teacherNote: "Bravo ! Ta rapidité de calcul mental est impressionnante.",
    unlockCriteria: "Atteindre une série de 10 bonnes réponses en Calcul Mental."
  },
  {
    id: 'badge-2',
    title: 'Parfaitement Assidu',
    emoji: '⏰',
    xp: 40,
    color: '#10b981',
    unlocked: true,
    unlockedAt: '2026-06-08T09:30:00Z',
    description: "Attribué pour n'avoir aucune absence ou retard non justifié ce trimestre.",
    teacherNote: "Ponctualité exemplaire ! Continue ainsi.",
    unlockCriteria: "Conserver un taux de présence de 100% sur un mois complet."
  },
  {
    id: 'badge-3',
    title: 'Super Lecteur',
    emoji: '📚',
    xp: 30,
    color: '#f59e0b',
    unlocked: true,
    unlockedAt: '2026-06-10T14:20:00Z',
    description: "Attribué pour avoir téléchargé et consulté plus de 5 fiches de cours.",
    teacherNote: "Excellent travail d'étude autonome à la maison.",
    unlockCriteria: "Télécharger plus de 5 ressources scolaires."
  },
  {
    id: 'badge-4',
    title: 'Plume d\'Or',
    emoji: '✒️',
    xp: 60,
    color: '#ec4899',
    unlocked: true,
    unlockedAt: '2026-06-11T11:00:00Z',
    description: "Attribué pour avoir obtenu une note supérieure à 16/20 en dictée française.",
    teacherNote: "Excellente maîtrise de la langue et de l'orthographe !",
    unlockCriteria: "Obtenir une note supérieure à 16 en Français."
  },
  {
    id: 'badge-5',
    title: 'Camarade d\'Or',
    emoji: '🤝',
    xp: 50,
    color: '#8b5cf6',
    unlocked: false,
    unlockedAt: null,
    description: "Attribué aux élèves qui s'entraident activement en classe ou sur les forums.",
    teacherNote: "",
    unlockCriteria: "Recommandation de l'enseignant pour acte de tutorat et d'entraide scolaire."
  },
  {
    id: 'badge-6',
    title: 'Éco-Citoyen',
    emoji: '🌱',
    xp: 40,
    color: '#06b6d4',
    unlocked: false,
    unlockedAt: null,
    description: "Attribué pour implication dans les projets écologiques ou de recyclage de l'école.",
    teacherNote: "",
    unlockCriteria: "Participer activement à la journée de nettoyage de l'école."
  }
]);

const openBadgeDetails = (badge: any) => {
  selectedBadge.value = badge;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

// --- REVISION FLASHCARDS (AI SIMULATION) ---
const revisionState = ref<'select' | 'generating' | 'cards'>('select');
const loadingProgress = ref(0);
const currentLoadingStatus = ref('');
const selectedSubjectName = ref('');
const currentCardIndex = ref(0);
const cardFlipped = ref(false);
const generatedCards = ref<any[]>([]);

const subjects = [
  { id: 'maths', name: 'Mathématiques', emoji: '📐' },
  { id: 'science', name: 'Sciences Physiques', emoji: '🔬' },
  { id: 'histoire', name: 'Histoire-Géographie', emoji: '🌍' },
  { id: 'francais', name: 'Langues & Lettres', emoji: '📖' }
];

const mockCardsData: Record<string, any[]> = {
  maths: [
    { question: "Quelle est la règle pour additionner deux fractions ?", answer: "Pour additionner deux fractions, il faut d'abord les réduire au même dénominateur, puis additionner leurs numérateurs tout en conservant le dénominateur commun.", tip: "Exemple: 1/4 + 2/4 = 3/4." },
    { question: "Qu'est-ce que le théorème de Pythagore ?", answer: "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse (le côté opposé à l'angle droit) est égal à la somme des carrés des longueurs des deux autres côtés.", tip: "Formule: AC² = AB² + BC²." },
    { question: "Comment calculer un pourcentage simple ?", answer: "Pour appliquer un pourcentage x% à une valeur V, on multiplie la valeur par x et on divise le tout par 100. Formule: V * (x / 100).", tip: "20% de 50 s'écrit 50 * 0.2 = 10." }
  ],
  science: [
    { question: "Explique le concept de la photosynthèse.", answer: "C'est la réaction chimique par laquelle les plantes vertes synthétisent des glucides à partir d'eau, de dioxyde de carbone et de lumière du soleil, tout en rejetant de l'oxygène.", tip: "La chlorophylle capte l'énergie lumineuse." },
    { question: "Quel est le cycle de l'eau ?", answer: "L'eau s'évapore des océans, forme des nuages (condensation), retombe en pluie ou neige (précipitations), s'infiltre dans le sol ou ruisselle, puis retourne aux océans.", tip: "Évaporation -> Condensation -> Précipitations." },
    { question: "Qu'est-ce que la gravité terrestre ?", answer: "C'est la force d'attraction invisible qu'exerce la Terre sur tous les objets ayant une masse, les attirant vers son centre à une accélération d'environ 9.8 m/s².", tip: "C'est grâce à elle que nous gardons les pieds sur terre !" }
  ],
  histoire: [
    { question: "Quelle est la date clé de la Révolution Française ?", answer: "La prise de la Bastille a eu lieu le 14 juillet 1789 à Paris, marquant le début de la fin de la monarchie absolue en France.", tip: "C'est notre fête nationale d'aujourd'hui !" },
    { question: "Qui a construit les Pyramides de Gizeh ?", answer: "Les pyramides d'Égypte ont été construites par les pharaons de l'Ancien Empire (notamment Khéops, Khéphren et Mykérinos) comme tombeaux funéraires.", tip: "Datent d'il y a plus de 4500 ans." },
    { question: "Quel était l'apport de l'Empire Romain ?", answer: "L'Empire Romain a structuré l'Europe grâce au développement des voies romaines (routes), du droit écrit, de l'architecture (aqueducs, arènes) et de la langue latine.", tip: "Tous les chemins mènent à Rome." }
  ],
  francais: [
    { question: "Comment accorde-t-on le participe passé avec l'auxiliaire 'être' ?", answer: "Le participe passé employé avec l'auxiliaire 'être' s'accorde toujours en genre (masculin/féminin) et en nombre (singulier/pluriel) avec le sujet de la phrase.", tip: "Exemple: 'Elle est partie', 'Ils sont partis'." },
    { question: "Quelle est la différence entre un homophone et un homographe ?", answer: "Les homophones se prononcent pareil mais s'écrivent différemment (ex: vert, verre). Les homographes s'écrivent pareil mais ont des sens différents (ex: la pêche / il pêche).", tip: "Les deux font partie des homonymes." },
    { question: "Comment identifier un complément d'objet direct (COD) ?", answer: "Pour trouver le COD, on pose la question 'qui ?' ou 'quoi ?' directement après le verbe de la phrase.", tip: "Exemple: 'Le chat mange la souris'. Mange quoi? 'La souris' (COD)." }
  ]
};

const selectSubject = (sub: any) => {
  selectedSubjectName.value = sub.name;
  revisionState.value = 'generating';
  loadingProgress.value = 0;
  
  const statusSteps = [
    'Recherche dans la base de connaissances scolaire...',
    'Extraction des fiches de cours Odoo...',
    'Synthèse des questions de révision IA...',
    'Mise en page des flashcards interactives...'
  ];

  let stepIdx = 0;
  currentLoadingStatus.value = statusSteps[0];

  const interval = setInterval(() => {
    loadingProgress.value += 5;
    
    if (loadingProgress.value === 25) {
      currentLoadingStatus.value = statusSteps[1];
    } else if (loadingProgress.value === 50) {
      currentLoadingStatus.value = statusSteps[2];
    } else if (loadingProgress.value === 75) {
      currentLoadingStatus.value = statusSteps[3];
    }

    if (loadingProgress.value >= 100) {
      clearInterval(interval);
      generatedCards.value = mockCardsData[sub.id] || [];
      currentCardIndex.value = 0;
      cardFlipped.value = false;
      revisionState.value = 'cards';
    }
  }, 100);
};

const flipCard = () => {
  cardFlipped.value = !cardFlipped.value;
};

const nextCard = () => {
  cardFlipped.value = false;
  setTimeout(() => {
    if (currentCardIndex.value < generatedCards.value.length - 1) {
      currentCardIndex.value++;
    } else {
      revisionState.value = 'select';
    }
  }, 200);
};

const prevCard = () => {
  cardFlipped.value = false;
  setTimeout(() => {
    if (currentCardIndex.value > 0) {
      currentCardIndex.value--;
    }
  }, 200);
};

// --- DAILY QUESTS DATA ---
const quests = ref([
  {
    id: 'quest-1',
    title: 'Entraînement Cérébral',
    description: 'Compléter une partie de Memory de l\'École',
    xp: 20,
    completed: true,
    emoji: '🧠'
  },
  {
    id: 'quest-2',
    title: 'Fiche IA du jour',
    description: 'Consulter une fiche de révision complète en Histoire',
    xp: 15,
    completed: false,
    emoji: '🤖'
  },
  {
    id: 'quest-3',
    title: 'Assiduité',
    description: 'Vérifier l\'agenda de devoirs et en marquer un fait',
    xp: 25,
    completed: true,
    emoji: '📚'
  }
]);

const completedQuestsCount = computed(() => {
  return quests.value.filter(q => q.completed).length;
});

const toggleQuest = (quest: any) => {
  quest.completed = !quest.completed;
};
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.segment-container {
  padding: 10px;
  background: white;
}

.custom-segment {
  --background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}

ion-segment-button {
  --indicator-color: #5c2d54;
  --color: #64748b;
  --color-checked: #ffffff;
  --border-radius: 10px;
  font-weight: 750;
  font-size: 0.82rem;
  min-height: 40px;
}

/* Header success card */
.header-banner {
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(92, 45, 84, 0.1);
  margin-bottom: 20px;
  border-radius: 20px;
}
.banner-flex {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-trophy {
  font-size: 3rem;
  animation: floatBadge 3s ease-in-out infinite alternate;
}
@keyframes floatBadge {
  0% { transform: translateY(0px) rotate(0deg); }
  100% { transform: translateY(-6px) rotate(8deg); }
}
.header-banner h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  color: #1e293b;
}
.header-banner p {
  margin: 4px 0 10px;
  font-size: 0.85rem;
  color: #64748b;
}
.level-progress-bar {
  height: 6px;
  background: #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
  max-width: 200px;
}
.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5c2d54, #6366f1);
  border-radius: 10px;
}

/* Badges Grid styling */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.badge-card {
  padding: 20px 12px !important;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
  cursor: pointer;
}
.badge-card:active {
  transform: scale(0.96);
}
.badge-card.locked {
  opacity: 0.7;
}
.badge-icon-wrap {
  width: 65px;
  height: 65px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  position: relative;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
}
.badge-emoji {
  font-size: 2.2rem;
}
.lock-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(148, 163, 184, 0.85);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.shine-glow {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%);
  border-radius: 20px;
  animation: shineAnimation 3s infinite linear;
}
@keyframes shineAnimation {
  0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50% { transform: scale(1.05) rotate(180deg); opacity: 0.4; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
}
.badge-card h3 {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 850;
  color: #1e293b;
}
.badge-xp {
  font-size: 0.8rem;
  font-weight: 750;
}

/* Revision Section */
.ai-sparkle-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}
.setup-box h2, .loading-box h2 {
  font-weight: 900;
  color: #1e293b;
}
.setup-box p, .loading-box p {
  color: #64748b;
  margin-bottom: 30px;
}
.subject-select-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.subject-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.2s;
}
.subject-btn:active {
  background: #f1f5f9;
  transform: scale(0.98);
}
.sub-emoji { font-size: 1.6rem; }
.sub-name { font-weight: 750; color: #334155; font-size: 1.05rem; }

/* Loading state */
.pulse-ai-logo {
  font-size: 3.5rem;
  animation: pulseLogo 1.5s infinite alternate;
}
@keyframes pulseLogo {
  0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(92,45,84,0)); }
  100% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(92,45,84,0.3)); }
}
.loading-progress-container {
  height: 6px;
  background: #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
  max-width: 280px;
  margin: 0 auto;
}
.loading-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5c2d54, #6366f1);
  border-radius: 10px;
  transition: width 0.1s linear;
}

/* Flashcards Page styling */
.cards-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.back-btn-clear {
  background: none; border: none;
  font-weight: 800; color: #64748b;
  cursor: pointer; font-size: 0.9rem;
}
.cards-counter {
  font-size: 0.85rem; font-weight: 700; color: #94a3b8;
}
.flashcard-container {
  perspective: 1000px;
  height: 320px;
  margin-bottom: 30px;
  cursor: pointer;
}
.flashcard-3d {
  width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.flashcard-3d.flipped {
  transform: rotateY(180deg);
}
.flashcard-inner {
  position: relative;
  width: 100%; height: 100%;
}
.flashcard-front, .flashcard-back {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #ffffff;
}
.flashcard-back {
  transform: rotateY(180deg);
  background: #fafafa;
  border: 1px solid rgba(92, 45, 84, 0.08);
}
.card-subject-tag {
  align-self: flex-start;
  font-size: 0.72rem; font-weight: 850; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px;
  background: rgba(99, 102, 241, 0.1); color: #6366f1;
}
.card-subject-tag.reply {
  background: rgba(16, 185, 129, 0.1); color: #10b981;
}
.card-question-box, .card-answer-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
}
.card-question-box h2 {
  font-weight: 900;
  color: #1e293b;
  font-size: 1.35rem;
  text-align: center;
  line-height: 1.45;
  margin: 0;
}
.card-answer-box p {
  font-size: 1.05rem;
  color: #334155;
  line-height: 1.5;
  text-align: center;
  font-weight: 600;
  margin: 0 0 15px 0;
}
.tip-card {
  background: #eff6ff;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 0.82rem;
  color: #1e40af;
  text-align: left;
}
.tap-hint {
  font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
  text-align: center; margin-bottom: 5px;
}

.card-navigation-controls {
  display: flex;
  gap: 15px;
}
.nav-control-btn {
  flex: 1;
  border: 1px solid #cbd5e1;
  background: white;
  padding: 14px;
  border-radius: 14px;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
}
.nav-control-btn.next {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
}
.nav-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Quests Section */
.quests-status {
  background: white;
  margin-bottom: 20px;
}
.quests-status h3 { margin: 0 0 5px; font-weight: 850; color: #1e293b; }
.quests-status p { margin: 0 0 15px; font-size: 0.88rem; color: #64748b; }
.quests-progress-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 750;
  color: #5c2d54;
  gap: 12px;
}
.quests-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.quests-fill {
  height: 100%;
  background: #5c2d54;
  border-radius: 10px;
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.quest-item {
  display: flex;
  align-items: center;
  background: white;
  gap: 16px;
  border-left: 5px solid #cbd5e1;
  transition: all 0.25s;
}
.quest-item.completed {
  border-left-color: #10b981;
}
.quest-checkbox {
  width: 24px; height: 24px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.quest-item.completed .quest-checkbox {
  border-color: #10b981;
  background: #10b981;
}
.check-box-inner span {
  color: white; font-weight: 900; font-size: 0.88rem;
}
.quest-details {
  flex: 1;
}
.quest-details h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: #1e293b;
  transition: color 0.2s;
}
.quest-item.completed h4 {
  color: #94a3b8;
  text-decoration: line-through;
}
.quest-details p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}
.quest-xp-reward {
  margin-top: 4px;
  display: inline-block;
  font-size: 0.68rem; font-weight: 850; text-transform: uppercase;
  padding: 2px 6px; border-radius: 6px;
  background: rgba(92, 45, 84, 0.08); color: #5c2d54;
}
.quest-item.completed .quest-xp-reward {
  background: rgba(16, 185, 129, 0.1); color: #10b981;
}
.quest-icon {
  font-size: 1.6rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.badge-modal {
  background: white;
  width: 100%;
  max-width: 380px;
  border-radius: 28px;
  position: relative;
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.modal-close-btn {
  position: absolute;
  top: 15px; right: 15px;
  background: none; border: none;
  font-size: 1.5rem; font-weight: 500;
  color: #94a3b8; cursor: pointer;
}
.modal-badge-icon {
  width: 80px; height: 80px;
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  margin: 10px auto 16px;
  font-size: 2.8rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}
.badge-modal h2 { margin: 0; font-weight: 900; color: #1e293b; font-size: 1.35rem; }
.modal-xp { font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px; }
.modal-desc { color: #64748b; font-size: 0.88rem; line-height: 1.5; margin: 15px 0; font-weight: 500; }
.modal-meta-box {
  background: #f8fafc;
  padding: 15px;
  border-radius: 18px;
  margin-bottom: 20px;
}
.unlock-date {
  font-size: 0.72rem; font-weight: 750; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 10px;
}
.encouragement-box {
  font-size: 0.8rem; color: #475569; line-height: 1.45; text-align: left;
}
.lock-req {
  font-size: 0.82rem; font-weight: 750; color: #ef4444; display: block;
}
.modal-action-btn {
  background: #5c2d54;
  color: white; border: none;
  width: 100%; padding: 14px;
  border-radius: 14px; font-weight: 800;
  cursor: pointer; font-size: 0.95rem;
}
</style>
