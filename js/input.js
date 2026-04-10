// =====================================================
// INPUT HANDLING
// =====================================================

// Listen for keyboard presses on the whole document.
document.addEventListener("keydown", function (event) {
  // ---------------------------------------------------
  // GAME OVER INPUT
  // ---------------------------------------------------
  if (gameState === GAME_STATES.TARGET_SELECT){
    if(event.code === "Digit1") applyGuardBuffToTarget(0);
    if(event.code === "Digit2") applyGuardBuffToTarget(1);
    if(event.code === "Digit3") applyGuardBuffToTarget(2);
    if(event.code === "Digit4") applyGuardBuffToTarget(3);
    return;
  }
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
  // INPUT DURING PLAYER CHOOSE STATE
  // ---------------------------------------------------
  if (gameState === GAME_STATES.PLAYER_CHOOSE) {
    // Press A to begin an attack.
    if (event.code === "KeyA") {

      // Get the current acting character.
      const actor = getCurrentCharacter();

      // If for some reason actor doesn't exist or is dead, do nothing.
      if (!actor || actor.hp <= 0) {
        return;
      }

      // Start the timing attack.
      startAttackTiming("attack");
    }
    if(event.code === "KeyS"){
        const actor = getCurrentCharacter();

        if(!actor || actor.hp <= 0){
            return;
        }

        startAttackTiming("skill");
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