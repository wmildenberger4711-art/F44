// =====================================================
// INPUT HANDLING
// =====================================================

// Listen for keyboard presses on the whole document.
document.addEventListener("keydown", function (event) {
  // ---------------------------------------------------
  // GAME OVER INPUT
  // ---------------------------------------------------
  // If the game is over, only allow restart.
  if (gameState === GAME_STATES.GAME_OVER) {
    // Press R to reset the game.
    if (event.code === "KeyR") {
      resetGame();
    }

    // Stop here so no other input logic runs.
    return;
  }

  // ---------------------------------------------------
  // CHARACTER SELECTION INPUT
  // ---------------------------------------------------
  // Number keys let the player manually highlight living characters.
  if (event.code === "Digit1" && playerParty[0].hp > 0) {
    activeCharacterIndex = 0;
  }

  if (event.code === "Digit2" && playerParty[1].hp > 0) {
    activeCharacterIndex = 1;
  }

  if (event.code === "Digit3" && playerParty[2].hp > 0) {
    activeCharacterIndex = 2;
  }

  if (event.code === "Digit4" && playerParty[3].hp > 0) {
    activeCharacterIndex = 3;
  }

  // ---------------------------------------------------
  // INPUT DURING PLAYER CHOOSE STATE
  // ---------------------------------------------------
  if (gameState === GAME_STATES.PLAYER_CHOOSE) {
    // Press A to begin an attack.
    if (event.code === "KeyA") {
      // Force the player to use the character whose turn it is.
      if (activeCharacterIndex !== currentTurnIndex) {
        setFloatingText("Use the current turn character!");
        return;
      }

      // Get the current acting character.
      const actor = getCurrentCharacter();

      // If for some reason actor doesn't exist or is dead, do nothing.
      if (!actor || actor.hp <= 0) {
        return;
      }

      // Start the timing attack.
      startAttackTiming();
    }
  }

  // ---------------------------------------------------
  // INPUT DURING PLAYER ATTACK TIMING
  // ---------------------------------------------------
  else if (gameState === GAME_STATES.PLAYER_ATTACK_TIMING) {
    // Press Space to stop the attack timing bar.
    if (event.code === "Space") {
      resolveAttackTiming();
    }
  }

  // ---------------------------------------------------
  // INPUT DURING ENEMY TELEGRAPH
  // ---------------------------------------------------
  else if (gameState === GAME_STATES.ENEMY_TELEGRAPH) {
    // Press Z to try to parry.
    if (event.code === "KeyZ") {
      attemptParry();
    }
  }
});