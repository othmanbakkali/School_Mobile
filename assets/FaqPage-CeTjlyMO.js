import{$n as e,A as t,Bn as n,Ct as r,F as i,Fn as a,Gn as o,Gt as s,Hn as c,Ht as l,I as u,In as ee,J as d,Jn as f,Kn as p,Kt as m,Lt as h,N as g,O as _,Qn as v,Qt as y,Rt as b,S as te,Un as ne,Vn as x,Wn as S,ar as C,bt as re,c as ie,er as ae,et as oe,gt as w,h as se,ln as ce,lr as T,m as E,n as D,nr as O,o as k,or as A,p as j,pt as M,qn as N,rr as P,s as F,sr as I,st as L,u as R,un as z,z as B}from"./index-3GucvOy3.js";var V={class:`btn-text`},H={class:`faq-container`},U={class:`hero-section`},W={class:`hero-icon-box`},G={class:`search-box`},le={class:`category-tabs`},ue=[`onClick`],de={class:`count-badge`},fe={class:`quick-links-card`},pe={class:`quick-link-item`},me={class:`ql-icon backend-icon`},he={href:`https://adminschool.alibdaealamia.ma`,target:`_blank`,rel:`noopener`,class:`ql-btn`},ge={class:`quick-link-item`},_e={class:`ql-icon frontend-icon`},ve={class:`quick-summary-bar`},ye={class:`qs-title`},be={class:`qs-chips`},xe={class:`faq-list`},Se={key:0,class:`no-results`},K=[`onClick`],Ce={class:`header-meta`},we={class:`badge-index`},Te={class:`title-row`},Ee={class:`faq-question`},De={class:`toggle-indicator`},Oe={key:0,class:`faq-card-body`},ke=[`innerHTML`],Ae={key:0,class:`tips-box`},je={class:`tips-title`},Me=[`innerHTML`],Ne={key:1,class:`warning-box`},Pe=[`innerHTML`],Fe={key:2,class:`example-box`},Ie={class:`example-title`},Le=[`innerHTML`],Re={class:`faq-footer`},ze={class:`footer-help-box`},Be={class:`help-content`},Ve={class:`contact-links`},He={href:`mailto:contact@alibdaealamia.ma`,class:`contact-pill`},Ue={class:`contact-pill`},We={href:`https://adminschool.alibdaealamia.ma`,target:`_blank`,rel:`noopener`,class:`contact-pill odoo`},q=D(f({__name:`FaqPage`,setup(f){let D=C(``),q=C(`all`),J=C(new Set([`roles-odoo`,`create-user-odoo`,`config-teacher-scope`,`massar-import`,`login-parent`,`homework-tracking`])),Ge=[{id:`all`,label:`Toutes les rubriques`,icon:d},{id:`backend`,label:`Backend Odoo`,icon:B},{id:`frontend`,label:`Espace Parents & Élèves`,icon:w},{id:`troubleshoot`,label:`Dépannage & FAQ`,icon:E}],Y=[{id:`roles-odoo`,category:`backend`,question:`Quels sont les rôles d'accès dans Odoo et leurs autorisations détaillées ?`,answerHtml:`
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
    `,tips:[`Dans Odoo 19, ce rôle est contrôlé par le champ <strong>Gestion Scolaire</strong> dans l'onglet <strong>Droits d'accès</strong> de chaque utilisateur.`]},{id:`create-user-odoo`,category:`backend`,question:`Comment créer un nouvel utilisateur (Professeur ou Staff) et lui attribuer son rôle ?`,answerHtml:`
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
    `,warning:`Pour un professeur, vous <strong>devez obligatoirement</strong> passer à l'étape suivante (configuration de la fiche professeur), sans quoi il ne verra aucune classe après sa connexion.`,example:`Pour Mme Fatima en charge des Maths en 6APG : Créez l'utilisateur avec le rôle <code>Enseignant</code>, puis associez-le à la fiche professeur en sélectionnant la classe <code>6APG-1</code> et la matière <code>Mathématiques</code>.`},{id:`config-teacher-scope`,category:`backend`,question:`Comment configurer le périmètre pédagogique d'un professeur (Classes & Matières) ?`,answerHtml:`
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
    `},{id:`hr-employee-sync`,category:`backend`,question:`Comment fonctionne la synchronisation avec le module Employés RH (hr.employee) ?`,answerHtml:`
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
    `},{id:`massar-import`,category:`backend`,question:`Comment importer les notes depuis un fichier Excel officiel MASSAR (.xlsx) ?`,answerHtml:`
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
    `,tips:[`Pour éviter toute erreur, veillez à ne pas supprimer les 5 premières lignes d'en-tête du fichier Excel téléchargé depuis Massar.`]},{id:`homework-translation`,category:`backend`,question:`Comment s'affichent les devoirs selon la langue saisie (Arabe ou Français) ?`,answerHtml:`
      <p>Afin de préserver l'exactitude pédagogique et éviter les traductions automatiques approximatives, les devoirs s'affichent fidèlement dans la <strong>langue d'origine</strong> saisie par l'enseignant ou l'administration :</p>
      
      <ol class="step-list">
        <li>Allez dans <strong>Portail Scolaire</strong> &gt; <strong>Devoirs</strong> &gt; <strong>Nouveau</strong>.</li>
        <li>Sélectionnez la classe (<code>Niveau / Classe</code>), la matière et la date d'échéance.</li>
        <li>Rédigez directement le titre et les consignes :
          <ul>
            <li><strong>Devoir rédigé en Arabe 🇲🇦 :</strong>
              <br>Saisissez le devoir en arabe (ex: matière Arabe, Éducation Islamique).
              <br>👉 Il s'affiche en <strong>arabe avec lecture de droite à gauche (RTL)</strong> dans le backend Odoo et sur l'application mobile.
            </li>
            <li><strong>Devoir rédigé en Français 🇫🇷 :</strong>
              <br>Saisissez le devoir en français (ex: matière Français, Mathématiques).
              <br>👉 Il s'affiche en <strong>français</strong> dans le backend Odoo et sur l'application mobile.
            </li>
          </ul>
        </li>
        <li>Cliquez sur <strong>Sauvegarder</strong>. Aucune traduction automatique erronée ne vient altérer le devoir.</li>
      </ol>
      <p>L'élève et les parents lisent exactement le texte rédigé par le professeur pour son cours.</p>
    `,example:`Un devoir en arabe comme <code>إنجاز تمارين الصفحة 25 من كتاب في رحاب اللغة العربية</code> reste intact en arabe sur mobile et backend, sans traduction robotique.`},{id:`attendance-backend`,category:`backend`,question:`Comment enregistrer les absences et retards côté administration ?`,answerHtml:`
      <p>La gestion de la vie scolaire s'effectue dans <strong>Portail Scolaire &gt; Présences &amp; Absences</strong> :</p>
      <ul>
        <li><strong>Feuille d'appel par séance :</strong> Les enseignants effectuent l'appel depuis leur tablette/ordinateur en début de cours. Les élèves absents sont cochés.</li>
        <li><strong>Suivi administratif :</strong> Le surveillant général ou le secrétariat visualise en temps réel la liste des absents du jour par niveau.</li>
        <li><strong>Validation des justificatifs :</strong> Lorsqu'un parent soumet un justificatif médical depuis l'application mobile, une notification apparaît dans Odoo. L'administrateur peut visualiser la pièce jointe, valider ou refuser la justification en un clic.</li>
      </ul>
    `},{id:`login-parent`,category:`frontend`,question:`Comment les parents se connectent-ils à l'application mobile et au portail web ?`,answerHtml:`
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
    `,tips:[`Vous pouvez basculer d'un enfant à l'autre à tout moment depuis le menu sans avoir besoin de vous déconnecter.`]},{id:`view-grades-parent`,category:`frontend`,question:`Où et comment consulter les notes, les moyennes et les bulletins scolaires ?`,answerHtml:`
      <p>Le suivi pédagogique est accessible depuis le menu latéral ou l'onglet <strong>Notes &amp; Bulletins</strong> :</p>
      <ul>
        <li><strong>Tableau de synthèse :</strong> Affichage de la moyenne générale du semestre, du rang de l'élève dans sa classe et de l'appréciation globale.</li>
        <li><strong>Détail par matière :</strong> En cliquant sur une matière (ex: Mathématiques, Arabe, Français, Histoire-Géo), vous visualisez les notes obtenues à chaque contrôle continu (Contrôle 1, Contrôle 2, Activités, Examen).</li>
        <li><strong>Comparatif :</strong> Indicateur de la note la plus haute, la plus basse et de la moyenne de la classe pour situer le niveau de l'élève.</li>
        <li><strong>Téléchargement PDF :</strong> Bouton de téléchargement du bulletin scolaire officiel dès sa validation par la direction.</li>
      </ul>
    `},{id:`homework-tracking`,category:`frontend`,question:`Comment suivre les devoirs, leçons et exercices à faire à la maison ?`,answerHtml:`
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
    `},{id:`absences-parent`,category:`frontend`,question:`Comment consulter les absences et envoyer un justificatif médical en photo ?`,answerHtml:`
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
    `},{id:`payments-parent`,category:`frontend`,question:`Comment suivre les paiements de scolarité, cantine et transport ?`,answerHtml:`
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
    `},{id:`pwa-install`,category:`frontend`,question:`Comment installer l'application sur son téléphone (iPhone ou Android) comme une vraie application ?`,answerHtml:`
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
    `},{id:`troubleshoot-teacher-empty`,category:`troubleshoot`,question:`Pourquoi un enseignant ne voit aucune classe ou aucun devoir après sa connexion ?`,answerHtml:`
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
    `},{id:`troubleshoot-massar-format`,category:`troubleshoot`,question:`Que faire en cas d'erreur lors de l'import d'un fichier Excel MASSAR ?`,answerHtml:`
      <p>Si l'assistant d'importation rejette votre fichier, suivez cette liste de vérification :</p>
      <ul>
        <li><strong>Format du fichier :</strong> Le fichier doit être au format <strong>.xlsx</strong> natif (évitez d'enregistrer au format .xls ancien ou .csv).</li>
        <li><strong>En-tête officiel intact :</strong> Ne supprimez ni ne modifiez les lignes d'en-tête générées par Massar (notamment les cellules contenant le nom de la matière et la classe).</li>
        <li><strong>Correspondance des noms de classes :</strong> Le nom de la classe dans Massar (ex: <code>6APG-1</code>) doit correspondre aux classes enregistrées dans Odoo.</li>
        <li><strong>Codes Massar :</strong> Vérifiez que les élèves possèdent bien leur Code Massar renseigné dans leur fiche Odoo. Si un élève a été inscrit sans code Massar, Odoo tentera de faire la correspondance par son Nom et Prénom complets.</li>
      </ul>
    `},{id:`troubleshoot-parent-login-failed`,category:`troubleshoot`,question:`Un parent n'arrive pas à se connecter avec son numéro de téléphone, quelle est la procédure ?`,answerHtml:`
      <ol class="step-list">
        <li>Vérifiez le numéro enregistré dans Odoo : allez dans <strong>Portail Scolaire &gt; Configuration &gt; Parents</strong>.</li>
        <li>Assurez-vous que le numéro est bien au format standard marocain sans espaces ni caractères spéciaux (ex: <code>0612345678</code>).</li>
        <li>Vérifiez dans l'onglet <strong>Enfants / Élèves</strong> de la fiche parent qu'au moins un enfant lui est bien rattaché.</li>
        <li>Rappelez au parent que le mot de passe est <code>20262027</code>.</li>
        <li>Si le parent a changé de numéro, modifiez le champ Téléphone dans sa fiche Odoo et cliquez sur Sauvegarder : la mise à jour est instantanée !</li>
      </ol>
    `},{id:`troubleshoot-reset-password`,category:`troubleshoot`,question:`Comment réinitialiser le mot de passe d'un enseignant ou membre de l'administration ?`,answerHtml:`
      <ol class="step-list">
        <li>En tant qu'administrateur, rendez-vous dans <strong>Paramètres &gt; Utilisateurs &amp; Sociétés &gt; Utilisateurs</strong>.</li>
        <li>Ouvrez la fiche de l'utilisateur concerné.</li>
        <li>Dans la barre d'action supérieure, cliquez sur l'icône de roue crantée ⚙️ &gt; <strong>Changer le mot de passe</strong>.</li>
        <li>Tapez le nouveau mot de passe souhaité et confirmez.</li>
        <li>Transmettez le nouveau mot de passe à l'enseignant.</li>
      </ol>
    `},{id:`troubleshoot-network-ssl`,category:`troubleshoot`,question:`Pourquoi l'alerte « Connexion non privée » apparaissait-elle sur www.alibdaealamia.ma ?`,answerHtml:`
      <p>Cette alerte technique était due à un <strong>conflit d'anciennes adresses IP dans la zone DNS</strong> chez l'hébergeur Nindohost :</p>
      <ul>
        <li>Le domaine <code>alibdaealamia.ma</code> contenait encore une ancienne adresse IP (<code>116.203.198.159</code>) en plus de la nouvelle IP (<code>68.183.19.16</code>).</li>
        <li>Lorsque le système de sécurité Let's Encrypt tente de générer le certificat SSL, il est bloqué par la présence de cette ancienne IP.</li>
        <li><strong>Solution :</strong> Supprimer l'enregistrement A vers l'ancienne IP dans Nindohost pour n'avoir que <code>68.183.19.16</code>.</li>
        <li><strong>Accès immédiat sécurisé :</strong> L'adresse officielle <a href="https://scolarite.alibdaealamia.ma/FAQ" target="_blank">https://scolarite.alibdaealamia.ma/FAQ</a> est 100% sécurisée avec certificat SSL valide sans aucune alerte.</li>
      </ul>
    `}],X=x(()=>Y.filter(e=>{if(q.value!==`all`&&e.category!==q.value)return!1;if(D.value.trim()!==``){let t=D.value.toLowerCase().trim(),n=e.question.toLowerCase().includes(t),r=e.answerHtml.toLowerCase().includes(t),i=e.tips?e.tips.some(e=>e.toLowerCase().includes(t)):!1,a=e.example?e.example.toLowerCase().includes(t):!1;return n||r||i||a}return!0})),Z=x(()=>X.value.length>0&&X.value.every(e=>J.value.has(e.id))),Q=e=>J.value.has(e),Ke=e=>{J.value.has(e)?J.value.delete(e):J.value.add(e)},qe=()=>{Z.value?J.value.clear():X.value.forEach(e=>J.value.add(e.id))},$=e=>e===`all`?Y.length:Y.filter(t=>t.category===e).length,Je=e=>{switch(e){case`backend`:return`Backend Odoo`;case`frontend`:return`Espace Parents & Élèves`;case`troubleshoot`:return`Dépannage & FAQ`;default:return`Général`}},Ye=e=>{switch(e){case`backend`:return B;case`frontend`:return w;case`troubleshoot`:return E;default:return d}},Xe=()=>{D.value=``,q.value=`all`};return(d,f)=>{let x=ae(`router-link`);return v(),ne(A(y),null,{default:O(()=>[N(A(s),{translucent:!0,class:`faq-header`},{default:O(()=>[N(A(z),{class:`header-toolbar`},{default:O(()=>[N(A(b),{slot:`start`},{default:O(()=>[N(A(h),{"router-link":`/login`,fill:`clear`,class:`back-btn`},{default:O(()=>[N(A(m),{icon:A(ie),slot:`start`},null,8,[`icon`]),f[5]||=c(`span`,{class:`btn-text`},`Connexion`,-1)]),_:1})]),_:1}),N(A(ce),{class:`main-title`},{default:O(()=>[...f[6]||=[c(`div`,{class:`brand-title`},[c(`span`,{class:`school-name`},`Al Ibdae Al Alamia`),c(`span`,{class:`portal-badge`},`Base de Connaissance & FAQ`)],-1)]]),_:1}),N(A(b),{slot:`end`},{default:O(()=>[N(A(h),{fill:`clear`,onClick:qe,class:`action-btn`},{default:O(()=>[N(A(m),{icon:Z.value?A(re):A(k),slot:`start`},null,8,[`icon`]),c(`span`,V,T(Z.value?`Tout fermer`:`Tout ouvrir`),1)]),_:1})]),_:1})]),_:1})]),_:1}),N(A(l),{fullscreen:!0,class:`faq-content`},{default:O(()=>[c(`div`,H,[c(`div`,U,[c(`div`,W,[N(A(m),{icon:A(j)},null,8,[`icon`])]),f[7]||=c(`h1`,null,`Guide Complet & Foire Aux Questions`,-1),f[8]||=c(`p`,{class:`subtitle`},[p(` Documentation détaillée, illustrée et pas à pas pour l'utilisation du `),c(`strong`,null,`Backend Odoo`),p(` (Direction, Staff & Enseignants) et du `),c(`strong`,null,`Portail Scolaire`),p(` (Parents & Élèves). `)],-1),c(`div`,G,[N(A(m),{icon:A(r),class:`search-icon`},null,8,[`icon`]),P(c(`input`,{"onUpdate:modelValue":f[0]||=e=>D.value=e,type:`text`,placeholder:`Rechercher par mot-clé (ex: Massar, notes, devoirs, mot de passe, profs, absences, RH, PWA...)`,class:`search-input`},null,512),[[ee,D.value]]),D.value?(v(),o(`button`,{key:0,onClick:f[1]||=e=>D.value=``,class:`clear-btn`},[N(A(m),{icon:A(u)},null,8,[`icon`])])):S(``,!0)]),c(`div`,le,[(v(),o(n,null,e(Ge,e=>c(`button`,{key:e.id,class:I([`cat-chip`,{active:q.value===e.id}]),onClick:t=>q.value=e.id},[N(A(m),{icon:e.icon},null,8,[`icon`]),c(`span`,null,T(e.label),1),c(`span`,de,T($(e.id)),1)],10,ue)),64))])]),c(`div`,fe,[c(`div`,pe,[c(`div`,me,[N(A(m),{icon:A(B)},null,8,[`icon`])]),f[10]||=c(`div`,{class:`ql-text`},[c(`strong`,null,`Portail Administratif Odoo`),c(`span`,null,`Gestion globale, notes Massar, profs, scolarité`)],-1),c(`a`,he,[f[9]||=p(` Accès Odoo `,-1),N(A(m),{icon:A(M)},null,8,[`icon`])])]),f[13]||=c(`div`,{class:`ql-divider`},null,-1),c(`div`,ge,[c(`div`,_e,[N(A(m),{icon:A(w)},null,8,[`icon`])]),f[12]||=c(`div`,{class:`ql-text`},[c(`strong`,null,`Espace Mobile Parents & Élèves`),c(`span`,null,`Bulletins, devoirs bilingues, justificatifs d'absence`)],-1),N(x,{to:`/login`,class:`ql-btn primary`},{default:O(()=>[f[11]||=p(` Espace Scolarité `,-1),N(A(m),{icon:A(R)},null,8,[`icon`])]),_:1})])]),c(`div`,ve,[c(`span`,ye,[N(A(m),{icon:A(oe)},null,8,[`icon`]),f[14]||=p(` Rubriques disponibles :`,-1)]),c(`div`,be,[c(`span`,{class:`qs-pill`,onClick:f[2]||=e=>q.value=`backend`},`🖥️ Backend Odoo (`+T($(`backend`))+`)`,1),c(`span`,{class:`qs-pill`,onClick:f[3]||=e=>q.value=`frontend`},`📱 Espace Parents (`+T($(`frontend`))+`)`,1),c(`span`,{class:`qs-pill`,onClick:f[4]||=e=>q.value=`troubleshoot`},`🛠️ Dépannage & FAQ (`+T($(`troubleshoot`))+`)`,1)])]),c(`div`,xe,[X.value.length===0?(v(),o(`div`,Se,[N(A(m),{icon:A(r)},null,8,[`icon`]),c(`h3`,null,`Aucun résultat trouvé pour « `+T(D.value)+` »`,1),f[15]||=c(`p`,null,[p(`Essayez avec d'autres termes (ex: `),c(`em`,null,`notes, mot de passe, téléphone, Massar, classe`),p(`) ou réinitialisez les filtres.`)],-1),c(`button`,{class:`reset-btn`,onClick:Xe},`Réinitialiser tous les filtres`)])):S(``,!0),(v(!0),o(n,null,e(X.value,(r,s)=>(v(),o(`div`,{key:r.id,class:I([`faq-card`,{open:Q(r.id)}])},[c(`div`,{class:`faq-card-header`,onClick:e=>Ke(r.id)},[c(`div`,Ce,[c(`div`,{class:I([`category-tag`,r.category])},[N(A(m),{icon:Ye(r.category)},null,8,[`icon`]),c(`span`,null,T(Je(r.category)),1)],2),c(`span`,we,`#`+T(s+1),1)]),c(`div`,Te,[c(`span`,Ee,T(r.question),1),c(`span`,De,[N(A(m),{icon:Q(r.id)?A(i):A(g)},null,8,[`icon`])])])],8,K),N(a,{name:`expand`},{default:O(()=>[Q(r.id)?(v(),o(`div`,Oe,[c(`div`,{class:`faq-answer-content`,innerHTML:r.answerHtml},null,8,ke),r.tips&&r.tips.length?(v(),o(`div`,Ae,[c(`div`,je,[N(A(m),{icon:A(se)},null,8,[`icon`]),f[16]||=c(`span`,null,`Conseils & Astuces Pratiques :`,-1)]),c(`ul`,null,[(v(!0),o(n,null,e(r.tips,(e,t)=>(v(),o(`li`,{key:t,innerHTML:e},null,8,Me))),128))])])):S(``,!0),r.warning?(v(),o(`div`,Ne,[N(A(m),{icon:A(F)},null,8,[`icon`]),c(`div`,{class:`warning-text`,innerHTML:r.warning},null,8,Pe)])):S(``,!0),r.example?(v(),o(`div`,Fe,[c(`div`,Ie,[N(A(m),{icon:A(t)},null,8,[`icon`]),f[17]||=c(`span`,null,`Exemple Concret :`,-1)]),c(`div`,{class:`example-text`,innerHTML:r.example},null,8,Le)])):S(``,!0)])):S(``,!0)]),_:2},1024)],2))),128))]),c(`div`,Re,[c(`div`,ze,[N(A(m),{icon:A(_),class:`help-icon`},null,8,[`icon`]),c(`div`,Be,[f[21]||=c(`h3`,null,`Vous n'avez pas trouvé votre réponse ?`,-1),f[22]||=c(`p`,null,`L'équipe d'administration et de support technique de l'école est à votre service pour vous guider.`,-1),c(`div`,Ve,[c(`a`,He,[N(A(m),{icon:A(L)},null,8,[`icon`]),f[18]||=p(` contact@alibdaealamia.ma `,-1)]),c(`span`,Ue,[N(A(m),{icon:A(te)},null,8,[`icon`]),f[19]||=p(` +212 5 39 99 99 99 `,-1)]),c(`a`,We,[N(A(m),{icon:A(B)},null,8,[`icon`]),f[20]||=p(` Portail Odoo `,-1)])])])]),f[23]||=c(`p`,{class:`copyright`},` © 2026 Groupe Scolaire Al Ibdae Al Alamia • Système de Gestion Scolaire Intégré `,-1)])])]),_:1})]),_:1})}}}),[[`__scopeId`,`data-v-de577bec`]]);export{q as default};