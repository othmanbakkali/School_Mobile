<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Jeux Éducatifs</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        
        <!-- ==================== GAME CHOICE MENU ==================== -->
        <div v-if="activeGame === 'none'" class="menu-choice-view">
          <div class="page-hero">
            <div class="hero-icon-3d">🎮</div>
            <h1>Serious Games</h1>
            <p>Apprends en t'amusant et défie ton esprit !</p>
          </div>

          <div class="games-grid">
            <!-- Math Challenge Card -->
            <div class="game-card premium-card math-game-bg" @click="startMathGame">
              <div class="game-icon">🧮</div>
              <div class="game-details">
                <h2>Calcul Mental Speedrun</h2>
                <p>Résous le plus d'équations possible avant la fin du chronomètre !</p>
                <div class="game-meta">
                  <span class="badge maths">Mathématiques</span>
                  <span class="badge diff">Chrono 15s</span>
                </div>
              </div>
            </div>

            <!-- Memory Card Game -->
            <div class="game-card premium-card memory-game-bg" @click="startMemoryGame">
              <div class="game-icon">🧠</div>
              <div class="game-details">
                <h2>Memory de l'École</h2>
                <p>Retrouve toutes les paires d'objets scolaires cachés le plus vite possible.</p>
                <div class="game-meta">
                  <span class="badge memory">Mémoire & Focus</span>
                  <span class="badge cards">12 Cartes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== GAME 1: CALCUL MENTAL SPEEDRUN ==================== -->
        <div v-else-if="activeGame === 'math'" class="game-play-view">
          <!-- Back button -->
          <ion-button fill="clear" size="small" class="back-btn" @click="quitGame">
            ← Quitter le jeu
          </ion-button>

          <!-- Difficulty Selection -->
          <div v-if="gameState === 'lobby'" class="lobby-box premium-card ion-padding text-center">
            <h2>Prêt pour le défi ?</h2>
            <p>Choisis le niveau de difficulté pour commencer :</p>
            <div class="difficulty-options">
              <button class="diff-btn facile" @click="launchMath('easy')">👶 Facile (Additions)</button>
              <button class="diff-btn moyen" @click="launchMath('medium')">⚡ Moyen (+, -, *)</button>
              <button class="diff-btn difficile" @click="launchMath('hard')">🔥 Difficile (Mélange & Divisions)</button>
            </div>
          </div>

          <!-- Active Math Game -->
          <div v-else-if="gameState === 'playing'" class="playing-box">
            <div class="game-header-row">
              <div class="score-pill">Score: <span>{{ mathScore }}</span></div>
              <div class="timer-box" :class="{ 'timer-low': timer <= 5 }">
                ⏰ <span>{{ timer }}s</span>
              </div>
              <div class="streak-pill" v-if="mathStreak > 1">🔥 {{ mathStreak }} !</div>
            </div>

            <div class="progress-bar-container">
              <div class="progress-bar-fill" :style="{ width: (timer / 15 * 100) + '%' }"></div>
            </div>

            <div class="equation-card premium-card ion-padding">
              <span class="question-number">Question {{ mathQuestionIndex }}</span>
              <h2 class="equation-text">{{ currentEquation.question }} = ?</h2>
            </div>

            <div class="answers-grid">
              <button v-for="(ans, idx) in currentEquation.options" 
                      :key="idx" 
                      class="answer-btn" 
                      :class="getAnswerBtnClass(ans)"
                      @click="checkAnswer(ans)"
                      :disabled="selectedAnswer !== null">
                {{ ans }}
              </button>
            </div>
          </div>

          <!-- Math Game Over -->
          <div v-else-if="gameState === 'gameover'" class="gameover-box premium-card ion-padding text-center">
            <div class="trophy-box">🏆</div>
            <h2>Défi Terminé !</h2>
            <p class="final-score-text">Tu as obtenu un score de <strong>{{ mathScore }}</strong> points !</p>
            <p class="streak-record" v-if="mathMaxStreak > 1">Meilleure série : 🔥 {{ mathMaxStreak }} d'affilée</p>
            
            <div class="parent-review-card">
              <h3>⭐ Évaluation</h3>
              <p>{{ getMathReviewText(mathScore) }}</p>
            </div>

            <div class="gameover-actions">
              <button class="action-btn replay" @click="gameState = 'lobby'">Rejouer</button>
              <button class="action-btn quit" @click="quitGame">Menu Principal</button>
            </div>
          </div>
        </div>

        <!-- ==================== GAME 2: MEMORY GAME ==================== -->
        <div v-else-if="activeGame === 'memory'" class="game-play-view">
          <!-- Back button -->
          <ion-button fill="clear" size="small" class="back-btn" @click="quitGame">
            ← Quitter le jeu
          </ion-button>

          <!-- Memory Active Game -->
          <div v-if="gameState === 'playing'" class="playing-box">
            <div class="game-header-row">
              <div class="score-pill">Essais: <span>{{ memoryTurns }}</span></div>
              <div class="timer-box">⏱ <span>{{ formatTime(memorySeconds) }}</span></div>
              <div class="matches-pill">Paires: <span>{{ memoryMatchedPairs }}/6</span></div>
            </div>

            <!-- Card Memory Grid -->
            <div class="memory-grid">
              <div v-for="card in memoryCards" 
                   :key="card.id" 
                   class="memory-card-3d"
                   :class="{ flipped: card.isFlipped || card.isMatched, matched: card.isMatched }"
                   @click="flipCard(card)">
                <div class="memory-card-inner">
                  <!-- Front Face (Hidden/Question mark) -->
                  <div class="memory-card-front">
                    <span>❓</span>
                  </div>
                  <!-- Back Face (Revealed Icon) -->
                  <div class="memory-card-back" :style="{ background: card.color }">
                    <span class="card-emoji">{{ card.emoji }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Memory Victory -->
          <div v-else-if="gameState === 'victory'" class="gameover-box premium-card ion-padding text-center">
            <div class="trophy-box">🎉</div>
            <h2>Victoire Royale !</h2>
            <p class="final-score-text">Tu as trouvé toutes les paires en <strong>{{ memoryTurns }}</strong> essais !</p>
            <p class="time-taken">Temps écoulé : ⏱ <strong>{{ formatTime(memorySeconds) }}</strong></p>
            
            <div class="stars-row">
              <span v-for="s in getMemoryStars(memoryTurns)" :key="s">⭐</span>
            </div>

            <div class="parent-review-card">
              <h3>🧠 Brain Power</h3>
              <p>{{ getMemoryReviewText(memoryTurns) }}</p>
            </div>

            <div class="gameover-actions">
              <button class="action-btn replay" @click="setupMemoryGame">Recommencer</button>
              <button class="action-btn quit" @click="quitGame">Menu Principal</button>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonMenuButton, IonIcon, IonButton
} from '@ionic/vue';
import { ref, onUnmounted } from 'vue';

const activeGame = ref<'none' | 'math' | 'memory'>('none');
const gameState = ref<'lobby' | 'playing' | 'gameover' | 'victory'>('lobby');

// --- MATH SPEEDRUN STATE ---
const mathScore = ref(0);
const mathStreak = ref(0);
const mathMaxStreak = ref(0);
const mathQuestionIndex = ref(1);
const timer = ref(15);
const selectedAnswer = ref<number | null>(null);
const currentEquation = ref<any>({ question: '', answer: 0, options: [] });
let mathInterval: any = null;
let difficulty = 'easy';

// --- MEMORY CARD STATE ---
const memoryCards = ref<any[]>([]);
const memoryTurns = ref(0);
const memoryMatchedPairs = ref(0);
const memorySeconds = ref(0);
let memoryTimerInterval: any = null;
let flippedCards: any[] = [];

// ==================== MATH GAME MOTEUR ====================
const startMathGame = () => {
  activeGame.value = 'math';
  gameState.value = 'lobby';
};

const launchMath = (diff: string) => {
  difficulty = diff;
  mathScore.value = 0;
  mathStreak.value = 0;
  mathMaxStreak.value = 0;
  mathQuestionIndex.value = 1;
  gameState.value = 'playing';
  generateEquation();
  startMathTimer();
};

const generateEquation = () => {
  selectedAnswer.value = null;
  let num1 = 0;
  let num2 = 0;
  let operator = '+';
  let answer = 0;

  if (difficulty === 'easy') {
    num1 = Math.floor(Math.random() * 10) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    operator = '+';
    answer = num1 + num2;
  } else if (difficulty === 'medium') {
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 20) + 5;
    const ops = ['+', '-', '*'];
    operator = ops[Math.floor(Math.random() * ops.length)];
    if (operator === '+') answer = num1 + num2;
    else if (operator === '-') {
      if (num1 < num2) { const tmp = num1; num1 = num2; num2 = tmp; }
      answer = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 9) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = num1 * num2;
    }
  } else {
    // Hard
    const ops = ['+', '-', '*', '/'];
    operator = ops[Math.floor(Math.random() * ops.length)];
    if (operator === '+') {
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 50) + 10;
      answer = num1 + num2;
    } else if (operator === '-') {
      num1 = Math.floor(Math.random() * 80) + 20;
      num2 = Math.floor(Math.random() * 50) + 5;
      if (num1 < num2) { const tmp = num1; num1 = num2; num2 = tmp; }
      answer = num1 - num2;
    } else if (operator === '*') {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      answer = num1 * num2;
    } else {
      // Division
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      num1 = num2 * answer;
    }
  }

  // Options generator
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const variance = Math.floor(Math.random() * 10) - 5;
    const wrongOpt = answer + (variance === 0 ? 3 : variance);
    if (wrongOpt >= 0) options.add(wrongOpt);
  }

  currentEquation.value = {
    question: `${num1} ${operator === '*' ? '×' : (operator === '/' ? '÷' : operator)} ${num2}`,
    answer: answer,
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
};

const startMathTimer = () => {
  timer.value = 15;
  if (mathInterval) clearInterval(mathInterval);
  mathInterval = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      clearInterval(mathInterval);
      handleTimeOut();
    }
  }, 1000);
};

const checkAnswer = (ans: number) => {
  if (selectedAnswer.value !== null) return;
  selectedAnswer.value = ans;
  if (mathInterval) clearInterval(mathInterval);

  if (ans === currentEquation.value.answer) {
    mathScore.value += 10 + Math.floor(timer.value / 2);
    mathStreak.value++;
    if (mathStreak.value > mathMaxStreak.value) mathMaxStreak.value = mathStreak.value;
  } else {
    mathStreak.value = 0;
  }

  setTimeout(() => {
    mathQuestionIndex.value++;
    generateEquation();
    startMathTimer();
  }, 1200);
};

const handleTimeOut = () => {
  selectedAnswer.value = -999; // Represents timeout state
  mathStreak.value = 0;
  setTimeout(() => {
    mathQuestionIndex.value++;
    generateEquation();
    startMathTimer();
  }, 1200);
};

const getAnswerBtnClass = (ans: number) => {
  if (selectedAnswer.value === null) return '';
  if (ans === currentEquation.value.answer) return 'correct-pulse';
  if (ans === selectedAnswer.value) return 'wrong-shake';
  return 'disabled-fade';
};

const getMathReviewText = (score: number) => {
  if (score >= 150) return "🌟 Exceptionnel ! Tu as le cerveau super rapide ! L'établissement est fier de ton esprit logique.";
  if (score >= 80) return "👍 Très bien joué ! Tes compétences en calcul mental s'améliorent chaque jour.";
  return "💪 Pas mal du tout ! Continue de t'entraîner régulièrement pour dépasser ton record.";
};

// ==================== MEMORY GAME MOTEUR ====================
const startMemoryGame = () => {
  activeGame.value = 'memory';
  gameState.value = 'playing';
  setupMemoryGame();
};

const setupMemoryGame = () => {
  const schoolItems = [
    { emoji: '🎒', color: '#ffedd5', label: 'Sac' },
    { emoji: '📐', color: '#ecfeff', label: 'Règle' },
    { emoji: '🍎', color: '#fef2f2', label: 'Pomme' },
    { emoji: '🎨', color: '#f5f3ff', label: 'Palette' },
    { emoji: '🚌', color: '#fef3c7', label: 'Bus' },
    { emoji: '📚', color: '#f0fdf4', label: 'Livre' }
  ];

  // Duplicate pairs
  const cardList: any[] = [];
  schoolItems.forEach((item, index) => {
    cardList.push({ id: index * 2, ...item, isFlipped: false, isMatched: false });
    cardList.push({ id: index * 2 + 1, ...item, isFlipped: false, isMatched: false });
  });

  // Shuffle
  memoryCards.value = cardList.sort(() => Math.random() - 0.5);
  memoryTurns.value = 0;
  memoryMatchedPairs.value = 0;
  memorySeconds.value = 0;
  flippedCards = [];

  if (memoryTimerInterval) clearInterval(memoryTimerInterval);
  memoryTimerInterval = setInterval(() => {
    memorySeconds.value++;
  }, 1000);
};

const flipCard = (card: any) => {
  if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

  card.isFlipped = true;
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    memoryTurns.value++;
    const [c1, c2] = flippedCards;

    if (c1.emoji === c2.emoji) {
      // Matched!
      setTimeout(() => {
        c1.isMatched = true;
        c2.isMatched = true;
        memoryMatchedPairs.value++;
        flippedCards = [];

        if (memoryMatchedPairs.value === 6) {
          clearInterval(memoryTimerInterval);
          gameState.value = 'victory';
        }
      }, 600);
    } else {
      // Unmatch -> Flip back
      setTimeout(() => {
        c1.isFlipped = false;
        c2.isFlipped = false;
        flippedCards = [];
      }, 1000);
    }
  }
};

const formatTime = (totalSecs: number) => {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getMemoryStars = (turns: number) => {
  if (turns <= 9) return 3;
  if (turns <= 14) return 2;
  return 1;
};

const getMemoryReviewText = (turns: number) => {
  if (turns <= 9) return "🏆 Parfait ! Tu as une mémoire photographique digne d'un grand maître !";
  if (turns <= 14) return "✨ Impressionnant ! Bon niveau de concentration et de repérage spatial.";
  return "🎯 Réussi ! Exerce ta concentration pour réduire le nombre d'essais au prochain tour.";
};

// ==================== GLOBAL GAME CONTROLS ====================
const quitGame = () => {
  if (mathInterval) clearInterval(mathInterval);
  if (memoryTimerInterval) clearInterval(memoryTimerInterval);
  activeGame.value = 'none';
  gameState.value = 'lobby';
};

onUnmounted(() => {
  if (mathInterval) clearInterval(mathInterval);
  if (memoryTimerInterval) clearInterval(memoryTimerInterval);
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

/* Page Hero layout */
.page-hero {
  text-align: center;
  padding: 15px 0 25px;
}
.hero-icon-3d {
  font-size: 3.2rem;
  margin-bottom: 8px;
  animation: floatIcon 3.5s ease-in-out infinite alternate;
}
@keyframes floatIcon {
  0% { transform: translateY(0px) rotate(0deg); }
  100% { transform: translateY(-8px) rotate(10deg); }
}
.page-hero h1 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 850;
  color: #1e293b;
  letter-spacing: -0.5px;
}
.page-hero p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 550;
}

/* Game Choice Cards */
.games-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.game-card:active {
  transform: scale(0.96) translateY(2px);
  box-shadow: 0 5px 10px rgba(0,0,0,0.06);
}

.math-game-bg {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.06) 100%);
  border-left: 5px solid #6366f1;
}
.memory-game-bg {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(14, 165, 233, 0.06) 100%);
  border-left: 5px solid #10b981;
}

.game-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.game-details h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.game-details p {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.45;
}

.game-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
  text-transform: uppercase;
}
.badge.maths { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.badge.diff { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.badge.memory { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge.cards { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }

/* In Game general styles */
.game-play-view {
  display: flex;
  flex-direction: column;
}

.back-btn {
  --color: #64748b;
  font-weight: 700;
  align-self: flex-start;
  margin-bottom: 15px;
}

/* Lobby style */
.lobby-box h2 {
  font-weight: 850;
  color: #1e293b;
  margin-bottom: 8px;
}
.lobby-box p {
  color: #64748b;
  margin-bottom: 25px;
}
.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.diff-btn {
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-weight: 750;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.1s;
}
.diff-btn:active {
  transform: scale(0.97);
}
.diff-btn.facile { background: #f0fdf4; color: #15803d; }
.diff-btn.moyen { background: #eff6ff; color: #1d4ed8; }
.diff-btn.difficile { background: #fff1f2; color: #be123c; }

/* Playing Screen styles */
.game-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.score-pill, .timer-box, .matches-pill, .streak-pill {
  font-weight: 800;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 50px;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.04);
}
.score-pill span, .timer-box span, .matches-pill span {
  color: #5c2d54;
  font-size: 1rem;
}
.timer-box.timer-low {
  background: #fef2f2;
  color: #ef4444;
  animation: pulseRed 1s infinite alternate;
}
@keyframes pulseRed {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}
.streak-pill {
  background: #fffbeb;
  color: #d97706;
}

.progress-bar-container {
  height: 6px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 25px;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 10px;
  transition: width 1s linear;
}

.equation-card {
  text-align: center;
  position: relative;
  background: white;
  margin-bottom: 30px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}
.question-number {
  font-size: 0.72rem;
  font-weight: 850;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.equation-text {
  font-size: 2.6rem;
  font-weight: 900;
  color: #0f172a;
  margin: 10px 0 0 0;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}
.answer-btn {
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: white;
  padding: 18px;
  border-radius: 16px;
  font-size: 1.4rem;
  font-weight: 850;
  color: #334155;
  box-shadow: 0 6px 12px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.2s ease;
}
.answer-btn:active {
  transform: scale(0.96);
}

/* Feedback answer states */
.correct-pulse {
  background: #10b981 !important;
  color: white !important;
  border-color: #10b981 !important;
  animation: pulseGreen 0.4s ease;
}
@keyframes pulseGreen {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.wrong-shake {
  background: #ef4444 !important;
  color: white !important;
  border-color: #ef4444 !important;
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.disabled-fade {
  opacity: 0.6;
}

/* Gameover Screen */
.gameover-box {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.trophy-box {
  font-size: 3.5rem;
  margin-bottom: 10px;
}
.gameover-box h2 {
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 5px;
}
.final-score-text {
  font-size: 1.1rem;
  color: #64748b;
  margin: 5px 0;
}
.final-score-text strong {
  color: #5c2d54;
  font-size: 1.45rem;
}
.streak-record, .time-taken {
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 650;
  margin-top: 5px;
}
.stars-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 2rem;
  margin: 15px 0;
  animation: popStars 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popStars {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.parent-review-card {
  background: #faf5f9;
  border: 1px dashed #ebd9e7;
  padding: 16px;
  border-radius: 16px;
  margin: 25px 0;
}
.parent-review-card h3 {
  margin: 0 0 6px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #5c2d54;
  text-transform: uppercase;
}
.parent-review-card p {
  margin: 0;
  font-size: 0.85rem;
  color: #4a4a4a;
  line-height: 1.45;
  font-weight: 600;
}

.gameover-actions {
  display: flex;
  gap: 15px;
}
.action-btn {
  flex: 1;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 750;
  font-size: 0.92rem;
  cursor: pointer;
}
.action-btn.replay {
  background: #5c2d54;
  color: white;
}
.action-btn.quit {
  background: #f1f5f9;
  color: #475569;
}

/* ==================== MEMORY BOARD STYLES ==================== */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 15px 0 30px;
}

.memory-card-3d {
  aspect-ratio: 3 / 4;
  perspective: 600px;
  cursor: pointer;
}

.memory-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.memory-card-3d.flipped .memory-card-inner {
  transform: rotateY(180deg);
}

.memory-card-front, .memory-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0,0,0,0.03);
}

.memory-card-front {
  background: white;
  font-size: 1.8rem;
}

.memory-card-back {
  transform: rotateY(180deg);
}

.card-emoji {
  font-size: 2.2rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

.memory-card-3d.matched {
  animation: matchGlow 0.4s ease forwards;
}

@keyframes matchGlow {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); filter: brightness(1.1); }
  100% { transform: scale(1); opacity: 0.85; }
}
</style>
