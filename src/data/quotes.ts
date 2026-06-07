/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Quote {
  text: string;
  author: string;
}

export const ALL_QUOTES: Quote[] = [
  // ── BANNIÈRE (12 — associées aux images) ──
  { text: "La discipline est le pont entre les rêves et la réalité.", author: "Jim Rohn" },
  { text: "Ne souhaitez pas que ce soit plus facile. Souhaitez être meilleur.", author: "Jim Rohn" },
  { text: "Le succès n'est que quelques disciplines simples pratiquées chaque jour.", author: "Jim Rohn" },
  { text: "Soit vous dirigez la journée, soit la journée vous dirige.", author: "Jim Rohn" },
  { text: "Les petites habitudes composées créent des résultats extraordinaires.", author: "Darren Hardy" },
  { text: "Ce n'est pas ce que vous faites de temps en temps qui compte, c'est ce que vous faites constamment.", author: "Darren Hardy" },
  { text: "Chaque action que vous posez aujourd'hui se compose dans le temps.", author: "Darren Hardy" },
  { text: "Le monde appartient à ceux qui se lèvent tôt et ne s'arrêtent pas.", author: "Robin Sharma" },
  { text: "L'excellence n'est pas un acte, c'est une habitude.", author: "Robin Sharma" },
  { text: "Ce n'est pas votre condition, c'est votre décision qui détermine votre destin.", author: "Tony Robbins" },
  { text: "Tout ce que l'esprit peut concevoir et croire, il peut l'accomplir.", author: "Napoleon Hill" },
  { text: "Un leader est celui qui connaît le chemin, l'emprunte, et le montre.", author: "John C. Maxwell" },

  // ── JIM ROHN (suite, total 10) ──
  { text: "Travaillez plus dur sur vous-même que sur votre travail.", author: "Jim Rohn" },
  { text: "Nous devons tous souffrir d'une des deux douleurs : la discipline ou le regret.", author: "Jim Rohn" },
  { text: "Si vous n'avez pas de plan pour votre vie, vous tomberez dans le plan de quelqu'un d'autre.", author: "Jim Rohn" },
  { text: "Le succès n'est pas à poursuivre, c'est à attirer par la personne que vous devenez.", author: "Jim Rohn" },
  { text: "Votre vie ne s'améliore pas par hasard, elle s'améliore par changement.", author: "Jim Rohn" },
  { text: "Les erreurs font partie de la réussite.", author: "Jim Rohn" },

  // ── DARREN HARDY (suite, total 8) ──
  { text: "Le seul moyen de changer votre vie est de changer vos habitudes quotidiennes.", author: "Darren Hardy" },
  { text: "Vos habitudes de vie reflètent ce que vous croyez valoir.", author: "Darren Hardy" },
  { text: "L'effet composé est la stratégie des champions.", author: "Darren Hardy" },
  { text: "La chance, c'est la préparation rencontrant l'opportunité.", author: "Darren Hardy" },
  { text: "Faites toujours plus que ce pour quoi vous êtes payé.", author: "Darren Hardy" },

  // ── ROBIN SHARMA (suite, total 6) ──
  { text: "Votre vie extérieure est un reflet de votre vie intérieure.", author: "Robin Sharma" },
  { text: "Les grands leaders n'attendent pas la permission. Ils créent leur propre autorité.", author: "Robin Sharma" },
  { text: "Un esprit discipliné est votre meilleur atout.", author: "Robin Sharma" },
  { text: "Chaque jour est une nouvelle vie pour une âme sage.", author: "Robin Sharma" },

  // ── JOHN C. MAXWELL (total 5) ──
  { text: "Le changement est inévitable. La croissance est optionnelle.", author: "John C. Maxwell" },
  { text: "La loi du miroir : vous devez voir la valeur en vous-même pour y croire.", author: "John C. Maxwell" },
  { text: "Les gens réussissent mieux quand ils ont de la clarté sur leur but.", author: "John C. Maxwell" },
  { text: "Échouez tôt, échouez souvent, mais toujours en avançant.", author: "John C. Maxwell" },

  // ── TONY ROBBINS (total 5) ──
  { text: "L'action est la clé fondamentale de tout succès.", author: "Tony Robbins" },
  { text: "Là où se concentre votre attention, là croît votre énergie.", author: "Tony Robbins" },
  { text: "La qualité de votre vie est directement liée à la qualité de vos standards.", author: "Tony Robbins" },
  { text: "Votre passé ne détermine pas votre avenir, à moins que vous le laissiez faire.", author: "Tony Robbins" },

  // ── NAPOLEON HILL (total 5) ──
  { text: "La force qui vous donnera la victoire est dans votre esprit.", author: "Napoleon Hill" },
  { text: "Tout objectif clairement défini s'accompagne de sa propre énergie.", author: "Napoleon Hill" },
  { text: "Les grandes réalisations naissent d'une vision soutenue par la persévérance.", author: "Napoleon Hill" },
  { text: "Chaque adversité porte avec elle la samence d'un bénéfice équivalent.", author: "Napoleon Hill" },

  // ── JAMES CLEAR (4) ──
  { text: "Vous ne vous élevez pas au niveau de vos objectifs, vous tombez au niveau de vos systèmes.", author: "James Clear" },
  { text: "Chaque action est un vote pour le type de personne que vous voulez devenir.", author: "James Clear" },
  { text: "Les habitudes sont le composé de l'auto-amélioration.", author: "James Clear" },
  { text: "Les petits changements semblent ne rien faire jusqu'au jour où ils changent tout.", author: "James Clear" },

  // ── ZIG ZIGLAR (4) ──
  { text: "Vous n'avez pas besoin d'être parfait pour commencer, mais vous devez commencer pour être excellent.", author: "Zig Ziglar" },
  { text: "Les attitudes sont contagieuses. La vôtre en vaut-elle la peine ?", author: "Zig Ziglar" },
  { text: "Vos rêves sont valides. Ne laissez personne les éteindre.", author: "Zig Ziglar" },
  { text: "Vous pouvez avoir tout ce que vous voulez si vous aidez assez d'autres à obtenir ce qu'ils veulent.", author: "Zig Ziglar" },

  // ── PAULO COELHO (4) ──
  { text: "Quand vous voulez vraiment quelque chose, tout l'univers conspire à vous aider.", author: "Paulo Coelho" },
  { text: "Le courage commence par une seule décision de ne pas accepter moins.", author: "Paulo Coelho" },
  { text: "Aucune raison au monde ne justifie de trahir ce en quoi vous croyez.", author: "Paulo Coelho" },
  { text: "Chaque chemin est le bon chemin. Tout dépend du voyageur.", author: "Paulo Coelho" },

  // ── STEPHEN COVEY (4) ──
  { text: "Commencez avec la fin en tête.", author: "Stephen Covey" },
  { text: "La force réside dans les différences, pas dans les similitudes.", author: "Stephen Covey" },
  { text: "La productivité est d'être actif sur les bonnes choses.", author: "Stephen Covey" },
  { text: "Choisissez de ne pas être blessé, et vous ne le serez pas.", author: "Stephen Covey" },

  // ── AUTRES AUTEURS (10) ──
  { text: "Le succès est la somme de petits efforts répétés jour après jour.", author: "Robert Collier" },
  { text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "Celui qui n'avance pas recule.", author: "Goethe" },
  { text: "Il n'y a qu'une façon d'échouer, c'est d'abandonner avant d'avoir réussi.", author: "G. Clemenceau" },
  { text: "La persévérance n'est pas une longue course ; c'est beaucoup de courtes races l'une après l'autre.", author: "Walter Elliot" },
  { text: "Ne comptez jamais les jours ; faites que les jours comptent.", author: "Muhammad Ali" },
  { text: "Ce que vous faites aujourd'hui peut améliorer tous vos demains.", author: "Ralph Marston" },
  { text: "La douleur que vous ressentez aujourd'hui sera la force que vous ressentirez demain.", author: "Inconnu" },
  { text: "La vie récompense ceux qui persistent.", author: "Inconnu" },
  { text: "Chaque matin, vous avez le choix : dormir avec vos rêves ou vous lever et les vivre.", author: "Inconnu" },

  // ── 30 VERSETS BIBLIQUES ──
  { text: "Je puis tout par Celui qui me fortifie.", author: "Philippiens 4:13" },
  { text: "Car Dieu n'a pas donné un esprit de peur, mais de force, d'amour et de sagesse.", author: "2 Timothée 1:7" },
  { text: "Confie-toi en l'Éternel de tout ton cœur et ne t'appuie pas sur ta propre intelligence.", author: "Proverbes 3:5" },
  { text: "Cherchez d'abord le Royaume de Dieu et sa justice, et toutes ces choses vous seront données.", author: "Matthieu 6:33" },
  { text: "L'Éternel est ma lumière et mon salut. De qui aurais-je crainte ?", author: "Psaume 27:1" },
  { text: "Sois fort et courageux. Ne crains point et ne t'effraie point.", author: "Josué 1:9" },
  { text: "Car je connais les projets que j'ai formés sur vous, projets de paix et non de malheur.", author: "Jérémie 29:11" },
  { text: "C'est par l'humilité et la crainte de l'Éternel que viennent la richesse, la gloire et la vie.", author: "Proverbes 22:4" },
  { text: "Remets ton sort à l'Éternel, espère en lui, et il agira.", author: "Psaume 37:5" },
  { text: "L'homme qui médite la Parole est comme un arbre planté près d'un courant d'eau.", author: "Psaume 1:3" },
  { text: "Tout ce que vous ferez, faites-le de bon cœur, comme pour le Seigneur.", author: "Colossiens 3:23" },
  { text: "Soyez fermes, inébranlables, travaillant de mieux en mieux à l'œuvre du Seigneur.", author: "1 Corinthiens 15:58" },
  { text: "Ne vous lassez pas de faire le bien, car nous moissonnerons au temps convenable.", author: "Galates 6:9" },
  { text: "Tout est possible à celui qui croit.", author: "Marc 9:23" },
  { text: "Craignez Dieu et observez ses commandements, c'est là le tout de l'homme.", author: "Ecclésiaste 12:13" },
  { text: "L'Éternel fortifie son peuple. L'Éternel bénit son peuple.", author: "Psaume 29:11" },
  { text: "Heureux l'homme qui médite la loi de Dieu jour et nuit.", author: "Psaume 1:1-2" },
  { text: "Mais ceux qui espèrent en l'Éternel renouvellent leur force.", author: "Ésaïe 40:31" },
  { text: "Dieu est notre refuge et notre force, un secours qui ne manque jamais dans la détresse.", author: "Psaume 46:1" },
  { text: "En toutes choses, nous sommes plus que vainqueurs par celui qui nous a aimés.", author: "Romains 8:37" },
  { text: "Si Dieu est pour nous, qui sera contre nous ?", author: "Romains 8:31" },
  { text: "L'Éternel te conduira continuellement et te rassasiera dans les lieux arides.", author: "Ésaïe 58:11" },
  { text: "Réjouissez-vous toujours dans le Seigneur.", author: "Philippiens 4:4" },
  { text: "Demandez et vous recevrez, cherchez et vous trouverez, frappez et on vous ouvrira.", author: "Matthieu 7:7" },
  { text: "N'abandonnez donc pas votre assurance, à laquelle est attachée une grande récompense.", author: "Hébreux 10:35" },
  { text: "La foi, c'est la certitude des choses qu'on espère, la démonstration de celles qu'on ne voit pas.", author: "Hébreux 11:1" },
  { text: "La main des diligents dominera, mais la main lâche sera assujettie.", author: "Proverbes 12:24" },
  { text: "Aie confiance en moi de tout ton cœur et je dirigerai tes pas.", author: "Proverbes 3:6" },
  { text: "Celui qui garde les commandements garde son âme.", author: "Proverbes 19:16" },
  { text: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs et vos pensées.", author: "Philippiens 4:7" }
];

export const BIBLE_VERSES = ALL_QUOTES.slice(60); // 30 bible verses live here now

export const getDailyQuote = (dayNum: number): Quote => {
  return ALL_QUOTES[dayNum % ALL_QUOTES.length];
};

export const getRandomQuote = (): Quote => {
  return ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)];
};
