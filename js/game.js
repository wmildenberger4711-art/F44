// =====================================================
// GAME DATA + GAME STATE + GAME LOGIC
// =====================================================

// Create an object that stores the possible game states.
// This helps us control what the player is allowed to do at each moment.
const GAME_STATES = {
  PLAYER_CHOOSE: "player_choose",            // Player is choosing/readying their action
  PLAYER_ATTACK_TIMING: "player_attack_timing", // Player is doing timing attack
  ENEMY_TELEGRAPH: "enemy_telegraph",        // Enemy attack is winding up
  GAME_OVER: "game_over",   
  TARGET_SELECT: "target_select"                  // Fight has ended
};

// -----------------------------------------------------
// CHARACTER TEMPLATES
// -----------------------------------------------------
// These are "base" character definitions.
// We clone them later so the originals stay unchanged.
const baseCharacters = [
  { name: "Gustave", maxHp: 110, hp: 110, attack: 18, speed: 10, skill: "Power Strike", guardBuff:false},
  { name: "Lune",    maxHp: 80,  hp: 80,  attack: 26, speed: 14, skill: "Curse", guardBuff:false },
  { name: "Maelle",  maxHp: 95,  hp: 95,  attack: 22, speed: 16, skill: "Swift Cut", guardBuff:false },
  { name: "Sciel",   maxHp: 100, hp: 100, attack: 20, speed: 12, skill: "Marking Shot", guardBuff:false },
  { name: "Renoir",  maxHp: 130, hp: 130, attack: 14, speed: 8,  skill: "Guard Break", guardBuff:false },
  { name: "Verso",   maxHp: 90,  hp: 90,  attack: 24, speed: 15, skill: "Chain Slash", guardBuff:false }
];

// -----------------------------------------------------
// HELPER FUNCTION: CLONE A CHARACTER
// -----------------------------------------------------
// We use this so each party member gets their own separate object.
// Otherwise, changing hp on one could accidentally change the template.
function cloneCharacter(character) {
  return { ...character };
}

// -----------------------------------------------------
// CANVAS REFERENCES
// -----------------------------------------------------
// Grab the canvas element from the HTML page.
const canvas = document.getElementById("gameCanvas");

// Get the 2D drawing context so we can draw rectangles, text, etc.
const ctx = canvas.getContext("2d");

// Save width and height into variables for convenience.
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// -----------------------------------------------------
// MAIN GAME VARIABLES
// -----------------------------------------------------

// The player's active party.
// For now, we simply take the first 4 characters.
let playerParty = [];

// The boss object.
let boss = null;


// Which character's turn it currently is.
let currentTurnIndex = 0;

// Which state the game is currently in.
let gameState = GAME_STATES.PLAYER_CHOOSE;

//action
let currentAction = "attack";

let pendingSkillUserIndex = -1;

let multiHitActive = false;
let multiHitCurrent = 0;
let multiHitTotal = 0;
let multiHitUserIndex = -1;


// -----------------------------------------------------
// ATTACK TIMING BAR
// -----------------------------------------------------
// This object controls the player's timing attack minigame.
let attackBar = {
  x: 100,          // left side of the attack bar
  y: 360,          // vertical position
  w: 500,          // total width
  h: 24,           // total height
  markerX: 100,    // current x of moving marker
  markerW: 14,     // width of moving marker
  speed: 5,        // movement speed
  dir: 1,          // direction: 1 = right, -1 = left
  targetX: 250,    // x position of green hit zone
  targetW: 90      // width of green hit zone
};

// -----------------------------------------------------
// ENEMY TELEGRAPH / PARRY DATA
// -----------------------------------------------------
// This object controls enemy attacks and the parry window.
let enemyAttack = {
  name: "Crushing Blow", // name of current boss move
  damage: 20,            // how much damage it deals if not parried
  telegraphTimer: 0,     // current timer position
  telegraphDuration: 90, // full duration before the attack resolves
  parryWindowStart: 56,  // frame where parry window opens
  parryWindowEnd: 66,    // frame where parry window closes
  resolved: false,       // whether the attack has already been handled
  parried: false,        // whether the player successfully parried
  targetIndex: 0         // which party member is being targeted
};

// -----------------------------------------------------
// SCORE DATA
// -----------------------------------------------------
// This stores values used for the final score.
let score = {
  damageDealt: 0, // total damage done to boss
  perfectHits: 0, // number of perfect attack timings
  goodHits: 0,    // number of good attack timings
  parries: 0,     // number of successful parries
  turnCount: 0    // how many player attacks have been used
};

// -----------------------------------------------------
// FLOATING MESSAGE TEXT
// -----------------------------------------------------
// This shows short messages like "PERFECT!" or "PARRY!"
let floatingText = "";
let floatingTextTimer = 0;

// =====================================================
// RESET / START GAME
// =====================================================

// This function resets the whole fight back to the start.
function resetGame() {
  // Build the player's 4-person party from character templates.
  playerParty = [
    cloneCharacter(baseCharacters[5]),
    cloneCharacter(baseCharacters[1]),
    cloneCharacter(baseCharacters[2]),
    cloneCharacter(baseCharacters[3])
  ];

  // Create the boss object.
  boss = {
    name: "The Painted Colossus",
    maxHp: 350,
    hp: 350,
    phase: 1,
    marked: false,
    cursed: false,
    curseTurns: 0,
    curseDamage: 0,
    curseCasterIndex: -1
  };

  // Start with the first character's turn.
  currentTurnIndex = 0;

  // Begin in the player choose state.
  gameState = GAME_STATES.PLAYER_CHOOSE;

  currentAction = "attack";

  pendingSkillUserIndex = -1;

  multiHitActive = false;
  multiHitCurrent = 0;
  multiHitTotal = 0;
  multiHitUserIndex = -1;

  // Reset attack bar values.
  attackBar.markerX = attackBar.x;
  attackBar.dir = 1;
  attackBar.targetX = attackBar.x + 205;

  // Reset enemy attack data.
  enemyAttack = {
    name: "Crushing Blow",
    damage: 20,
    telegraphTimer: 0,
    telegraphDuration: 90,
    parryWindowStart: 56,
    parryWindowEnd: 66,
    resolved: false,
    parried: false,
    targetIndex: 0
  };

  // Reset score.
  score = {
    damageDealt: 0,
    perfectHits: 0,
    goodHits: 0,
    parries: 0,
    turnCount: 0
  };

  // Clear any floating message.
  floatingText = "";
  floatingTextTimer = 0;
}

// =====================================================
// SMALL HELPER FUNCTIONS
// =====================================================

// Show a temporary message on the screen.
function setFloatingText(text, duration = 60) {
  floatingText = text;
  floatingTextTimer = duration;
}

// Return only living characters from the party.
function getAliveParty() {
  return playerParty.filter(character => character.hp > 0);
}

// Return the character whose turn it is.
function getCurrentCharacter() {
  return playerParty[currentTurnIndex];
}

function applyGuardBuffToTarget(targetIndex){
  const target = playerParty[targetIndex];

  if(!target || target.hp <=0){
    setFloatingText("Invalid target", 60);
    return;
  }

  target.guardBuff = true;
  setFloatingText(`${target.name} is Guarded!`, 60);

  pendingSkillUserIndex = -1;

  startEnemyTelegraph();
}

// Check if all party members are dead.
function allPlayersDead() {
  return playerParty.every(character => character.hp <= 0);
}

// Move to the next living character in the party.
function nextLivingCharacterTurn() {
  let tries = 0;

  do {
    // Move to the next slot in the party.
    currentTurnIndex = (currentTurnIndex + 1) % playerParty.length;

    // Count tries so we don't accidentally loop forever.
    tries++;
  } while (playerParty[currentTurnIndex].hp <= 0 && tries < 10);

}

// Calculate the final score at the end of the fight.
function calculateFinalScore() {
  // Add up all remaining HP in the team.
  const remainingHp = playerParty.reduce((sum, character) => sum + Math.max(0, character.hp), 0);

  // If nobody died, award a bonus.
  const noDeathsBonus = playerParty.every(character => character.hp > 0) ? 200 : 0;

  // Reward faster wins.
  const turnBonus = Math.max(0, 200 - score.turnCount * 10);

  // Return the combined score value.
  return (
    score.damageDealt * 5 +
    score.perfectHits * 50 +
    score.goodHits * 20 +
    score.parries * 40 +
    remainingHp * 2 +
    noDeathsBonus +
    turnBonus
  );
}

// =====================================================
// PLAYER ATTACK FLOW
// =====================================================

// Start the player's timing attack.
function startAttackTiming(actionType = "attack") {
  currentAction = actionType;
  // Change the game state so the timing bar becomes active.
  gameState = GAME_STATES.PLAYER_ATTACK_TIMING;

  // Reset marker to the left side.
  attackBar.markerX = attackBar.x;

  // Make sure it starts moving right.
  attackBar.dir = 1;

  // Randomize the hit zone a little to make each attack feel less identical.
  attackBar.targetX = attackBar.x + 150 + Math.random() * 220;
}

// Update the timing bar each frame while it is active.
function updateAttackTiming() {
  // Move the marker according to speed and direction.
  attackBar.markerX += attackBar.speed * attackBar.dir;

  // If marker hits the left boundary, clamp it and reverse direction.
  if (attackBar.markerX <= attackBar.x) {
    attackBar.markerX = attackBar.x;
    attackBar.dir = 1;
  }

  // If marker hits the right boundary, clamp it and reverse direction.
  if (attackBar.markerX + attackBar.markerW >= attackBar.x + attackBar.w) {
    attackBar.markerX = attackBar.x + attackBar.w - attackBar.markerW;
    attackBar.dir = -1;
  }
}

// Resolve the player's timing attack when Space is pressed.
function resolveAttackTiming() {
  // Get the current acting character.
  const actor = getCurrentCharacter();

  // If no actor exists, stop.
  if (!actor) return;

  // Find the center point of the moving marker.
  const markerCenter = attackBar.markerX + attackBar.markerW / 2;

  // Find the center point of the green hit zone.
  const targetCenter = attackBar.targetX + attackBar.targetW / 2;

  // Measure how far apart the centers are.
  const distance = Math.abs(markerCenter - targetCenter);

  // We'll store the final damage here.
  let damage = 0;
  let consumeMarkThisHit = false;
  let wasPerfect = false;


  // If very close to center, it's a perfect hit.
  if (distance <= 10) {
    damage = Math.floor(actor.attack * 2.2);
    setFloatingText("PERFECT HIT!", 70);
    score.perfectHits++;
    wasPerfect = true;
  }
  // If somewhat close, it's a good hit.
  else if (distance <= 28) {
    damage = actor.attack;
    setFloatingText("Good Hit", 60);
    score.goodHits++;
  }
  // If a bit farther away, do weak damage.
  else if (distance <= 50) {
    damage = Math.floor(actor.attack * 0.6);
    setFloatingText("Glancing Hit", 60);
  }
  // Otherwise it misses.
  else {
    damage = 0;
    setFloatingText("Miss", 60);
  }

  if(boss.marked && !(currentAction === "skill" && actor.name === "Sciel")){
    consumeMarkThisHit = true;
  }

  if(currentAction === "skill"){
    if(actor.name ==="Gustave"){
      damage = Math.floor(damage * 1.6);

    }else if(actor.name === "Lune"){
      boss.cursed = true;
      boss.curseTurns = 3;
      boss.curseDamage = 12;
      boss.curseCasterIndex = currentTurnIndex;

      setFloatingText("Boss Cursed!", 60);

      damage = Math.floor(damage * 0.7);
      
    }else if(actor.name === "Maelle"){
      damage = Math.floor(damage * 1.3);
      
    }else if(actor.name === "Sciel"){
      boss.marked = true;
      setFloatingText("Boss Marked", 60);
      damage = Math.floor(damage * 0.6);//weaker hit, its a sep up move

    }else if(actor.name === "Renoir"){
      damage = 0;
      pendingSkillUserIndex = currentTurnIndex;
      gameState = GAME_STATES.TARGET_SELECT;
      setFloatingText("Choose ally: 1-4", 120);
      return;

    }else if(actor.name === "Verso"){
      damage = Math.floor(damage * 0.9);

      if(!multiHitActive){
        multiHitActive = true;
        multiHitCurrent = 1;
        multiHitTotal = 2;
        multiHitUserIndex = currentTurnIndex;
      }
    }    

  }

  
  if (consumeMarkThisHit){
    damage = Math.floor(damage * 1.6);
    boss.marked = false;
    setFloatingText("Mark Bonus!", 60);
  }

  if (boss.cursed){
    damage = Math.floor(damage * 1.2);
  }

  // Apply damage to the boss.
  boss.hp -= damage;

  // Prevent HP from going below zero.
  if (boss.hp < 0) boss.hp = 0;

  // Add damage to score tracking.
  score.damageDealt += damage;

  // Count this attack as a turn used.
  score.turnCount++;

  // If boss died, end the game now.
  if (boss.hp <= 0) {
    multiHitActive = false;
    multiHitCurrent = 0;
    multiHitTotal = 0;
    multiHitUserIndex = -1;
    
    gameState = GAME_STATES.GAME_OVER;
    setFloatingText("BOSS DEFEATED!", 9999);
    return;
  }

  if(currentAction ==="skill" && actor.name === "Maelle" && wasPerfect){
    gameState = GAME_STATES.PLAYER_CHOOSE;
    setFloatingText("Extra Trun",70);
    return;
  }

  if(multiHitActive && actor.name === "Verso" && currentAction === "skill" && multiHitUserIndex === currentTurnIndex && multiHitCurrent <multiHitTotal){
    multiHitCurrent++;
    setFloatingText(`Chain Slash ${multiHitCurrent}!`,  60);
    startAttackTiming("skill");
    return;
  }

  if (
    multiHitActive &&
    actor.name === "Verso" &&
    currentAction === "skill" &&
    multiHitCurrent >= multiHitTotal
  ) {
    multiHitActive = false;
    multiHitCurrent = 0;
    multiHitTotal = 0;
    multiHitUserIndex = -1;
  }

  // Otherwise hand control to the boss attack sequence.
  startEnemyTelegraph();
}

// =====================================================
// ENEMY ATTACK FLOW
// =====================================================
function processBossStatuses(){
  if (boss.cursed && boss.curseTurns > 0){
    const curseDamage = boss.curseDamage;

    //deal curse damage to boss
    boss.hp -= curseDamage;
    if (boss.hp < 0) boss.hp = 0;

    //heal caster 1/2 curse damage
    const caster = playerParty[boss.curseCasterIndex];
    if(caster && caster.hp > 0) {
      const healAmount = Math.floor(curseDamage / 2);
      caster.hp += healAmount;

      if(caster.hp > caster.maxHp){
        caster.hp = caster.maxHp;
      }
    }
    //reduce curse damaga duration by 1 turn
    boss.curseTurns--;

    if(boss.curseTurns <=0){
      boss.cursed = false;
      boss.curseCasterIndex = -1;
      boss.curseDamage = 0;
      setFloatingText("Curse Faded", 60);
    }else{
      setFloatingText("Curse Ticks!");
    }
  }
}

// Start the enemy telegraph state after the player attacks.
function startEnemyTelegraph() {
  // Switch into enemy telegraph mode.
  gameState = GAME_STATES.ENEMY_TELEGRAPH;

  processBossStatuses();

  if(boss.hp<=0){
    gameState = GAME_STATES.GAME_OVER;
    setFloatingText("Boss Defeated!!", 9999);
    return;
  }

  // Build a list of indexes for alive party members.
  const aliveIndexes = playerParty
    .map((character, index) => ({ character, index }))
    .filter(entry => entry.character.hp > 0)
    .map(entry => entry.index);

  // Pick a random alive target.
  enemyAttack.targetIndex = aliveIndexes[Math.floor(Math.random() * aliveIndexes.length)];

  // Reset timing info for the new enemy move.
  enemyAttack.telegraphTimer = 0;
  enemyAttack.resolved = false;
  enemyAttack.parried = false;

  // Randomly choose one of a few boss attacks.
  const roll = Math.random();

  if (roll < 0.33) {
    enemyAttack.name = "Crushing Blow";
    enemyAttack.damage = 20;
    enemyAttack.parryWindowStart = 56;
    enemyAttack.parryWindowEnd = 66;
    enemyAttack.telegraphDuration = 90;
  } else if (roll < 0.66) {
    enemyAttack.name = "Swift Fang";
    enemyAttack.damage = 14;
    enemyAttack.parryWindowStart = 40;
    enemyAttack.parryWindowEnd = 48;
    enemyAttack.telegraphDuration = 70;
  } else {
    enemyAttack.name = "Delayed Slam";
    enemyAttack.damage = 28;
    enemyAttack.parryWindowStart = 72;
    enemyAttack.parryWindowEnd = 82;
    enemyAttack.telegraphDuration = 105;
  }
}

// Update the enemy telegraph each frame.
function updateEnemyTelegraph() {
  // Advance the telegraph timer by 1 frame.
  enemyAttack.telegraphTimer++;

  // If the telegraph reached the end and hasn't resolved yet, resolve it now.
  if (enemyAttack.telegraphTimer >= enemyAttack.telegraphDuration && !enemyAttack.resolved) {
    resolveEnemyAttack();
  }
}

// Called when the player presses Z during the enemy telegraph.
function attemptParry() {
  // Read the current timer value.
  const t = enemyAttack.telegraphTimer;

  // Check whether the key press happened inside the parry window.
  if (t >= enemyAttack.parryWindowStart && t <= enemyAttack.parryWindowEnd) {
    // Mark the attack as parried and resolved.
    enemyAttack.parried = true;
    enemyAttack.resolved = true;

    // Count a successful parry in the score.
    score.parries++;

    // Show text feedback.
    setFloatingText("PARRY!", 60);

    // Successful parries do some counter damage back to the boss.
    const counterDamage = 12;

    // Apply counter damage.
    boss.hp -= counterDamage;

    // Clamp boss HP at zero.
    if (boss.hp < 0) boss.hp = 0;

    // Add to damage score.
    score.damageDealt += counterDamage;

    // If the boss died from the parry, end the game.
    if (boss.hp <= 0) {
      gameState = GAME_STATES.GAME_OVER;
      setFloatingText("PARRY KILL!", 9999);
      return;
    }

    // If boss survived, give control back to the next player turn.
    endRoundBackToPlayer();
  } else {
    // If the player pressed at the wrong time, show feedback.
    setFloatingText("Too Early / Late", 30);
  }
}

// Resolve the enemy attack if it was not parried in time.
function resolveEnemyAttack() {
  // Mark the attack as resolved.
  enemyAttack.resolved = true;

  // Find the targeted party member.
  const target = playerParty[enemyAttack.targetIndex];

  // If target does not exist or is already dead, skip damage and continue.
  if (!target || target.hp <= 0) {
    endRoundBackToPlayer();
    return;
  }

  // Read the damage value for this enemy move.
  let damage = enemyAttack.damage;

  if(target.guardBuff){
    damage = Math.floor(damage * 0.6);
    target.guardBuff = false;

    const counterDamage = Math.floor(target.attack * 1.1);

    boss.hp -= counterDamage;
    if (boss.hp <0) boss.hp = 0;

    score.damageDealt += counterDamage;

    setFloatingText(`${target.name} Countered!`, 60);
  }

  if(boss.hp <=0){
    gameState = GAME_STATES.GAME_OVER;
    setFloatingText("Counter Kill!", 9999);
    return;
  }

  // Apply damage to the target.
  target.hp -= damage;

  // Clamp HP at zero.
  if (target.hp < 0) target.hp = 0;

  // Show message depending on whether the target died.
  if (target.hp <= 0) {
    setFloatingText(`${target.name} fell!`, 70);
  } else {
    setFloatingText(`${target.name} took ${damage}`, 60);
  }

  // If everybody is dead, end the game.
  if (allPlayersDead()) {
    gameState = GAME_STATES.GAME_OVER;
    return;
  }

  // Otherwise continue to the next player turn.
  endRoundBackToPlayer();
}

// End the enemy action and return to the player.
function endRoundBackToPlayer() {
  // Move turn to the next living character.
  nextLivingCharacterTurn();

  // Set state back to player choice mode.
  gameState = GAME_STATES.PLAYER_CHOOSE;
}

// =====================================================
// GAME UPDATE
// =====================================================

// This function runs every frame and updates the game.
function update() {
  // Update floating message timer if active.
  if (floatingTextTimer > 0) {
    floatingTextTimer--;

    // When the timer reaches zero, clear the text.
    if (floatingTextTimer <= 0) {
      floatingText = "";
    }
  }

  // Run the attack timing update only in attack timing state.
  if (gameState === GAME_STATES.PLAYER_ATTACK_TIMING) {
    updateAttackTiming();
  }

  // Run enemy telegraph timing only in telegraph state.
  if (gameState === GAME_STATES.ENEMY_TELEGRAPH) {
    updateEnemyTelegraph();
  }

  // Safety check: if boss reaches 0 HP for any reason, game over.
  if (boss.hp <= 0 && gameState !== GAME_STATES.GAME_OVER) {
    gameState = GAME_STATES.GAME_OVER;
    setFloatingText("YOU WIN!", 9999);
  }

  // Safety check: if all players die, game over.
  if (allPlayersDead() && gameState !== GAME_STATES.GAME_OVER) {
    gameState = GAME_STATES.GAME_OVER;
    setFloatingText("YOU LOSE!", 9999);
  }
}