// =====================================================
// DRAWING / RENDERING FUNCTIONS
// =====================================================

// Draw a generic HP-style bar.
// We can reuse this for boss HP and party HP.
function drawBar(x, y, width, height, value, maxValue, color = "#44ff88") {
  // Draw the dark background of the bar.
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, width, height);

  // Calculate how full the bar should be.
  const fillAmount = Math.max(0, Math.min(1, value / maxValue));

  // Draw the filled portion.
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * fillAmount, height);

  // Draw a white border around the bar.
  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, width, height);
}

// -----------------------------------------------------
// DRAW PARTY PANEL
// -----------------------------------------------------
function drawParty() {
  // Starting position for the party UI.
  const panelX = 20;
  const panelY = 120;

  // Set font for party text.
  ctx.font = "16px Arial";

  // Loop through each character in the party.
  for (let i = 0; i < playerParty.length; i++) {
    // Get the current character.
    const character = playerParty[i];

    // Calculate this row's vertical position.
    const y = panelY + i * 85;

    // Check if this character is currently highlighted.
    const isSelected = i === activeCharacterIndex;

    // Check if this character is the one whose turn it is.
    const isTurn = i === currentTurnIndex && gameState !== GAME_STATES.GAME_OVER;

    // Background color changes if selected.
    ctx.fillStyle = isSelected ? "#2d2d00" : "#181818";
    ctx.fillRect(panelX, y, 260, 70);

    // Border changes if it's this character's turn.
    ctx.strokeStyle = isTurn ? "yellow" : "white";
    ctx.strokeRect(panelX, y, 260, 70);

    // Dim dead characters.
    ctx.fillStyle = character.hp > 0 ? "white" : "#777";

    // Draw character name.
    ctx.fillText(`${i + 1}. ${character.name}`, panelX + 10, y + 20);

    // Draw stats line.
    ctx.fillText(`ATK ${character.attack}  SPD ${character.speed}`, panelX + 10, y + 40);

    // Draw skill name.
    ctx.fillText(`${character.skill}`, panelX + 120, y + 40);

    // Draw HP bar.
    drawBar(
      panelX + 10,
      y + 48,
      220,
      12,
      character.hp,
      character.maxHp,
      character.hp > 0 ? "#44ff88" : "#666"
    );

    // Draw numeric HP text.
    ctx.fillStyle = "white";
    ctx.fillText(`${character.hp}/${character.maxHp}`, panelX + 170, y + 61);
  }
}

// -----------------------------------------------------
// DRAW BOSS PANEL
// -----------------------------------------------------
function drawBoss() {
  // Draw boss area background box.
  ctx.fillStyle = "#111";
  ctx.fillRect(320, 90, 430, 150);

  // Draw white border around boss panel.
  ctx.strokeStyle = "white";
  ctx.strokeRect(320, 90, 430, 150);

  // Draw boss name.
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(boss.name, 340, 125);

  // Draw boss HP bar.
  drawBar(340, 145, 380, 22, boss.hp, boss.maxHp, "#ff5555");

  // Draw boss numeric HP.
  ctx.font = "16px Arial";
  ctx.fillText(`HP ${boss.hp}/${boss.maxHp}`, 340, 185);

  // If the enemy is telegraphing an attack, show move info.
  if (gameState === GAME_STATES.ENEMY_TELEGRAPH) {
    // Get the targeted character.
    const target = playerParty[enemyAttack.targetIndex];

    // Draw telegraph text in gold-ish color.
    ctx.fillStyle = "#ffcc66";
    ctx.fillText(`Boss uses: ${enemyAttack.name}`, 340, 215);
    ctx.fillText(`Target: ${target ? target.name : "?"}`, 340, 235);
  }
}

// -----------------------------------------------------
// DRAW PLAYER ATTACK TIMING UI
// -----------------------------------------------------
function drawAttackTimingUI() {
  // Instruction text.
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Press SPACE when the marker is centered in the target!", 120, 330);

  // Draw the dark attack bar background.
  ctx.fillStyle = "#222";
  ctx.fillRect(attackBar.x, attackBar.y, attackBar.w, attackBar.h);

  // Draw the bar border.
  ctx.strokeStyle = "white";
  ctx.strokeRect(attackBar.x, attackBar.y, attackBar.w, attackBar.h);

  // Draw the green target zone.
  ctx.fillStyle = "#1aff66";
  ctx.fillRect(attackBar.targetX, attackBar.y, attackBar.targetW, attackBar.h);

  // Draw the moving white marker.
  ctx.fillStyle = "white";
  ctx.fillRect(attackBar.markerX, attackBar.y - 4, attackBar.markerW, attackBar.h + 8);
}

// -----------------------------------------------------
// DRAW ENEMY TELEGRAPH / PARRY UI
// -----------------------------------------------------
function drawEnemyTelegraphUI() {
  // Draw instruction text.
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Enemy attack incoming! Press Z to parry at the right moment.", 105, 330);

  // Read timer progress.
  const t = enemyAttack.telegraphTimer;
  const total = enemyAttack.telegraphDuration;
  const progress = t / total;

  // Set the visual bar dimensions.
  const x = 100;
  const y = 360;
  const width = 500;
  const height = 24;

  // Draw telegraph bar background.
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, width, height);

  // Draw border.
  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, width, height);

  // Convert parry window from time units to pixels.
  const windowX = x + (enemyAttack.parryWindowStart / total) * width;
  const windowWidth = ((enemyAttack.parryWindowEnd - enemyAttack.parryWindowStart) / total) * width;

  // Draw the orange parry window.
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(windowX, y, windowWidth, height);

  // Draw the moving white indicator that sweeps across the bar.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + progress * width - 4, y - 4, 8, height + 8);
}

// -----------------------------------------------------
// DRAW TOP HUD
// -----------------------------------------------------
function drawHUD() {
  // Draw general score / run info.
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Turn: ${score.turnCount + 1}`, 20, 30);
  ctx.fillText(`Damage: ${score.damageDealt}`, 20, 55);
  ctx.fillText(`Perfects: ${score.perfectHits}`, 20, 80);
  ctx.fillText(`Parries: ${score.parries}`, 170, 80);

  // Draw floating center text if there is any.
  if (floatingText) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px Arial";
    ctx.fillText(floatingText, 300, 40);
  }

  // Draw control hints based on the current state.
  ctx.font = "15px Arial";
  ctx.fillStyle = "#bbbbbb";

  if (gameState === GAME_STATES.PLAYER_CHOOSE) {
    ctx.fillText("1-4 select character | A attack", 420, 30);
  } else if (gameState === GAME_STATES.PLAYER_ATTACK_TIMING) {
    ctx.fillText("SPACE = stop the attack marker", 420, 30);
  } else if (gameState === GAME_STATES.ENEMY_TELEGRAPH) {
    ctx.fillText("Z = parry", 420, 30);
  } else if (gameState === GAME_STATES.GAME_OVER) {
    ctx.fillText("Press R to restart", 420, 30);
  }
}

// -----------------------------------------------------
// DRAW GAME OVER SCREEN
// -----------------------------------------------------
function drawGameOver() {
  // Draw a dark transparent overlay over the whole screen.
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decide whether it is a win or loss.
  const win = boss.hp <= 0;

  // Draw result title.
  ctx.fillStyle = "white";
  ctx.font = "36px Arial";
  ctx.fillText(win ? "VICTORY" : "DEFEAT", 300, 170);

  // Draw final score.
  ctx.font = "24px Arial";
  ctx.fillText(`Final Score: ${calculateFinalScore()}`, 270, 220);

  // Draw breakdown stats.
  ctx.font = "18px Arial";
  ctx.fillText(`Damage Dealt: ${score.damageDealt}`, 290, 270);
  ctx.fillText(`Perfect Hits: ${score.perfectHits}`, 290, 300);
  ctx.fillText(`Good Hits: ${score.goodHits}`, 290, 330);
  ctx.fillText(`Parries: ${score.parries}`, 290, 360);
  ctx.fillText(`Turns Taken: ${score.turnCount}`, 290, 390);
  ctx.fillText("Press R to restart", 300, 440);
}

// -----------------------------------------------------
// MASTER DRAW FUNCTION
// -----------------------------------------------------
function draw() {
  // Clear the whole canvas before redrawing the next frame.
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw black background.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw the main screen sections.
  drawHUD();
  drawBoss();
  drawParty();

  // Draw attack timing UI only when player is attacking.
  if (gameState === GAME_STATES.PLAYER_ATTACK_TIMING) {
    drawAttackTimingUI();
  }

  // Draw parry telegraph UI only during enemy telegraph.
  if (gameState === GAME_STATES.ENEMY_TELEGRAPH) {
    drawEnemyTelegraphUI();
  }

  // Draw game over overlay at the end.
  if (gameState === GAME_STATES.GAME_OVER) {
    drawGameOver();
  }
}