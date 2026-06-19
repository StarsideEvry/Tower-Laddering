Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

let phase = "waiting";
let lastTimestamp;
let playerX;
let playerY;
let sceneOffset;
let platforms = [];
let ladders = [];
let score = 0;

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const playerDistanceFromEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const extendingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const switchingTowerSpeed = 2;
const fallingSpeed = 2;
const playerWidth = 17;
const playerHeight = 30;
const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");
const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

resetGame();

function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;
  platforms = [{ x: 50 , w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();
  ladders = [{ x: platforms[0].x + platforms[0].w , length: 0 , rotation: 0 }];
  playerX = platforms[0].x + platforms[0].w - playerDistanceFromEdge;
  playerY = 0;
  draw();
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  platforms.push({ x , w });
}

resetGame();

window.addEventListener("keydown" , function (event) {
  if (event.key == " ") {
    event.preventDefault();
    resetGame();
    return;
  }
});

window.addEventListener("mousedown" , function (event) {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "extending";
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup" , function (event) {
  if (phase == "extending") {
    phase = "turning";
  }
});

window.addEventListener("resize" , function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return;

    case "extending": {
      ladders.last().length += (timestamp - lastTimestamp) / extendingSpeed;
      break;
    }

    case "turning": {
      ladders.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      if (ladders.last().rotation > 90) {
        ladders.last().rotation = 90;
        const [nextPlatform , perfectHit] = thePlatformTheLadderHits();
        if (nextPlatform) {
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;
          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0) , 1000);
          }
          generatePlatform();
        }
        phase = "walking";
      }
      break;
    }

    case "walking": {
      playerX += (timestamp - lastTimestamp) / walkingSpeed;
      const [nextPlatform] = thePlatformTheLadderHits();
      if (nextPlatform) {
        const maxPlayerX = nextPlatform.x + nextPlatform.w - playerDistanceFromEdge;
        if (playerX > maxPlayerX) {
          playerX = maxPlayerX;
          phase = "switchingTower";
        }
      } else {
        const maxPlayerX = ladders.last().x + ladders.last().length + playerWidth;
        if (playerX > maxPlayerX) {
          playerX = maxPlayerX;
          phase = "falling";
        }
      }
      break;
    }

    case "switchingTower": {
      sceneOffset += (timestamp - lastTimestamp) / switchingTowerSpeed;
      const [nextPlatform] = thePlatformTheLadderHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        ladders.push({
          x: nextPlatform.x + nextPlatform.w ,
          length: 0 ,
          rotation: 0
        });
        phase = "waiting";
      }
      break;
    }

    case "falling": {
      if (ladders.last().rotation < 180)
        ladders.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      playerY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxPlayerY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (playerY > maxPlayerY) {
        restartButton.style.display = "block";
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

function thePlatformTheLadderHits() {
  if (ladders.last().rotation != 90)
    throw Error(`Ladder is ${ladders.last().rotation}°`);
  const ladderFurthestX = ladders.last().x + ladders.last().length;
  const platformTheLadderHits = platforms.find(
    (platform) => platform.x < ladderFurthestX && ladderFurthestX < platform.x + platform.w
  );
  if (
    platformTheLadderHits &&
    platformTheLadderHits.x + platformTheLadderHits.w / 2 - perfectAreaSize / 2 <
      ladderFurthestX && ladderFurthestX <
      platformTheLadderHits.x + platformTheLadderHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheLadderHits , true];
    return [platformTheLadderHits , false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0 , 0 , window.innerWidth , window.innerHeight);
  drawBackground();
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset ,
    (window.innerHeight - canvasHeight) / 2
  );
  drawPlatforms();
  drawPlayer();
  drawLadders();
  ctx.restore();
}

restartButton.addEventListener("click" , function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x , w }) => {
    ctx.fillStyle = "green";
    ctx.fillRect(x , canvasHeight - platformHeight , w , platformHeight + (window.innerHeight - canvasHeight) / 2);
    if (ladders.last().x < x) {
      ctx.fillStyle = "yellow";
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2 ,
        canvasHeight - platformHeight ,
        perfectAreaSize ,
        perfectAreaSize
      );
    }
  });
}

function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "lightgreen";
  ctx.translate(
    playerX - playerWidth / 2 ,
    playerY + canvasHeight - platformHeight - playerHeight / 2
  );
  drawRoundedRect(-playerWidth / 2 , -playerHeight / 2 , playerWidth , playerHeight - 4 , 5);
  const legsMovement = 5;
  ctx.beginPath();
  ctx.arc(legsMovement , 11.5 , 3 , 0 , Math.PI * 2 , false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legsMovement , 11.5 , 3 , 0 , Math.PI * 2 , false);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "blue";
  ctx.arc(5 , -7 , 3 , 0 , Math.PI * 2 , false);
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(x , y , width , height , radius) {
  ctx.beginPath();
  ctx.moveTo(x , y + radius);
  ctx.lineTo(x , y + height - radius);
  ctx.arcTo(x , y + height , x + radius , y + height , radius);
  ctx.lineTo(x + width - radius , y + height);
  ctx.arcTo(x + width , y + height , x + width , y + height - radius , radius);
  ctx.lineTo(x + width , y + radius);
  ctx.arcTo(x + width , y , x + width - radius , y , radius);
  ctx.lineTo(x + radius , y);
  ctx.arcTo(x , y , x , y + radius , radius);
  ctx.fill();
}

function drawLadders() {
  ladders.forEach((ladder) => {
    ctx.save();
    ctx.translate(ladder.x , canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * ladder.rotation);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(0 , 0);
    ctx.lineTo(0 , -ladder.length);
    ctx.stroke();
    ctx.restore();
  });
}

function drawBackground() {
  ctx.fillStyle = "lightblue"
  ctx.fillRect(0 , 0 , window.innerWidth , window.innerHeight);
}

function getHillY(windowX , baseHeight , amplitude , stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}