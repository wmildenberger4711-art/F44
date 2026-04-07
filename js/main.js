// =====================================================
// MAIN ENTRY POINT
// =====================================================

// This is the main game loop.
// It runs over and over every animation frame.
function gameLoop() {
  // First update the game state.
  update();

  // Then draw the current frame.
  draw();

  // Ask the browser to call gameLoop again on the next frame.
  requestAnimationFrame(gameLoop);
}

// Reset the game once at startup so everything has starting values.
resetGame();

// Start the main loop.
gameLoop();