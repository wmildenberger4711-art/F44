const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Bar timing system
let barX = 0;
let barSpeed = 3;
let targetX = 250;
let targetWidth = 60;
let barWidth = 20;

let resultText = "";
let resultTimer = 0;

// Game state
let enemyHP = 100;
let gameState = "playerTurn";
let enemyHasActed = false;

// Character selection
let activeCharacterIndex = 0;

// Character roster
let characters = [
    { name: "Warrior", hp: 100, attack: 20 },
    { name: "Rogue", hp: 80, attack: 25 },
    { name: "Mage", hp: 70, attack: 30 },
    { name: "Tank", hp: 150, attack: 10 },
    { name: "Archer", hp: 90, attack: 18 },
    { name: "Knight", hp: 130, attack: 15 },
    { name: "Assassin", hp: 75, attack: 28 },
    { name: "Cleric", hp: 85, attack: 12 },
    { name: "Paladin", hp: 120, attack: 16 },
    { name: "Berserker", hp: 110, attack: 22 }
];

// Player party (first 4 characters)
let playerParty = [
    characters[0],
    characters[1],
    characters[2],
    characters[3]
];


// ---------------- INPUT ----------------
document.addEventListener("keydown", function(event){
    if(gameState !== "playerTurn") return;

    if(event.code === "Digit1" && playerParty[0].hp > 0) activeCharacterIndex = 0;
    if(event.code === "Digit2" && playerParty[1].hp > 0) activeCharacterIndex = 1;
    if(event.code === "Digit3" && playerParty[2].hp > 0) activeCharacterIndex = 2;
    if(event.code === "Digit4" && playerParty[3].hp > 0) activeCharacterIndex = 3;

    if(event.code === "Space"){
        checkHit();
        gameState = "enemyTurn";
    }
});


// ---------------- GAME LOOP ----------------
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update(){
    // Move timing bar
    barX += barSpeed;

    if (barX > canvas.width - barWidth || barX < 0){
        barSpeed *= -1;
    }

    // Result text timer
    if(resultTimer > 0){
        resultTimer--;
    } else {
        resultText = "";
    }

    // Win condition
    if(enemyHP <= 0){
        resultText = "YOU WIN";
        barSpeed = 0;
        gameState = "gameOver";
    }

    // Lose condition
    let allDead = playerParty.every(c => c.hp <= 0);
    if(allDead){
        resultText = "YOU LOSE";
        barSpeed = 0;
        gameState = "gameOver";
    }

    // Enemy turn
    if(gameState === "enemyTurn" && !enemyHasActed){
        enemyHasActed = true;

        enemyAttack();

        setTimeout(() => {
            gameState = "playerTurn";
            enemyHasActed = false;
        }, 500);
    }
}


// ---------------- DRAW ----------------
function draw(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Target zone
    ctx.fillStyle = "green";
    ctx.fillRect(targetX, 80, targetWidth, 40);

    // Moving bar
    ctx.fillStyle = "white";
    ctx.fillRect(barX, 80, barWidth, 40);

    // Result text
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(resultText, 250, 30);

    // Enemy HP
    ctx.font = "16px Arial";
    ctx.fillText("Enemy HP: " + enemyHP, 20, 20);

    // Party UI
    let startX = 20;
    let startY = 80;

    for(let i = 0; i < playerParty.length; i++){
        let c = playerParty[i];

        ctx.fillStyle = (i === activeCharacterIndex) ? "yellow" : "white";

        ctx.fillText(
            `${i+1}: ${c.name} HP:${c.hp}`,
            startX,
            startY + i * 20
        );
    }
}


// ---------------- COMBAT ----------------
function checkHit(){
    let barCenter = barX + barWidth / 2;
    let targetCenter = targetX + targetWidth / 2;

    let attacker = playerParty[activeCharacterIndex];

    let distance = Math.abs(barCenter - targetCenter);

    let damage = 0;

    if(distance < 10){
        resultText = "PERFECT!!";
        damage = attacker.attack * 2;
    } else if(distance < 30){
        resultText = "Good";
        damage = attacker.attack;
    } else {
        resultText = "Miss";
        damage = 0;
    }

    enemyHP -= damage;
    resultTimer = 60;

    console.log("EnemyHP:", enemyHP);
}


// ---------------- ENEMY ----------------
function enemyAttack(){
    let aliveTargets = playerParty.filter(c => c.hp > 0);

    if(aliveTargets.length === 0) return;

    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

    let damage = Math.floor(Math.random() * 15) + 5;

    target.hp -= damage;

    if(target.hp <= 0){
        target.hp = 0;
        resultText = target.name + " has fallen!";
    } else {
        resultText = target.name + " took -" + damage;
    }

    resultTimer = 60;

    console.log(target.name, "HP:", target.hp);
}


// Start game
gameLoop();