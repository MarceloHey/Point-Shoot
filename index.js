/** @type {HTMLCanvasElement} */
const canvasCollision = document.getElementById("canvasCollision")
const ctxCollision = canvasCollision.getContext('2d')
const CANVAS_COLLISION_WIDTH = canvasCollision.width = window.innerWidth
const CANVAS_COLLISION_HEIGHT = canvasCollision.height = window.innerHeight

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1")
const ctx = canvas.getContext('2d')
const CANVAS_WIDTH = canvas.width = window.innerWidth
const CANVAS_HEIGHT = canvas.height = window.innerHeight

const shipOptions = ['./assets/Bomber/Move.png', './assets/Corvette/Move.png', './assets/Fighter/Move.png']
const backgroundOptions = [
  './assets/background/background1.webp',
  './assets/background/background2.webp',
  './assets/background/background3.webp',
  './assets/background/background4.webp',
  './assets/background/background5.webp',
  './assets/background/background6.webp',
  './assets/background/background7.webp'
]
const randomBackgroundIndex = Math.floor(Math.random() * 6)


let timeToNextShip = 0
let shipInterval = 1000
let lastTime = 0
let ships = []
let explosions = []
let particles = []
let score = 0
let gameOver = false
let gameStarted = false
ctx.font = '32px Arial'

class Particle {
  constructor(x, y, size, color) {
    this.x = x + size / 2 + Math.random() * 50
    this.y = y + size / 3 + Math.random() * 50 - 5
    this.size = size
    this.color = color
    this.radius = Math.random() * this.size / 20
    this.maxRadius = Math.random() * 20 + 35
    this.canDelete = false
    this.speedX = Math.random() * 1 + 0.5
    this.color = color
    // this.color = 'grey'
  }
  update() {
    this.x += this.speedX
    this.radius += 0.5
    if (this.radius > this.maxRadius - 5) this.canDelete = true
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = 1 - (this.radius / this.maxRadius)
    ctx.beginPath()
    ctx.fillStyle = this.color
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
class Explosion {
  constructor(x, y, size) {
    this.image = new Image()
    this.image.src = './assets/boom.png'
    this.spriteWidth = 200
    this.spriteHeight = 179
    this.size = size
    this.x = x
    this.y = y
    this.frame = 0
    this.sound = new Audio()
    this.sound.src = './assets/sound/explosion.wav'
    this.sound.volume = .4
    this.timeSinceLastFrame = 0
    this.frameInterval = 100
    this.canDelete = false

  }
  update(deltaTime) {
    if (this.frame === 0) this.sound.play()
    this.timeSinceLastFrame += deltaTime
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++
      this.timeSinceLastFrame = 0
      if (this.frame > 5) this.canDelete = true
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y - this.size / 4,
      this.size,
      this.size
    )
  }
}

class Ship {
  constructor() {
    this.speedX = Math.random() * 6 + 4
    this.speedY = Math.random() * 5 - 2.5
    this.sizeModifier = Math.random() * 0.3 + 0.4
    this.spriteWidth = 192
    this.spriteHeight = 192
    this.width = this.spriteWidth * this.sizeModifier
    this.height = this.spriteHeight * this.sizeModifier
    this.x = CANVAS_WIDTH
    this.y = Math.random() * (CANVAS_HEIGHT - this.height)
    this.canDelete = false
    this.maxFrame = 4
    this.frame = 0
    this.timeSinceAnimationStep = 0
    this.animationStepInterval = Math.random() * 50 + 50
    this.image = new Image()
    this.image.src = shipOptions[this.shipRandomizer()]
    this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
    this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`
    this.hasParticles = Math.random() > 0.8
  }

  shipRandomizer() {
    return Math.floor(Math.random() * 3)
  }

  update(deltaTime) {
    this.x -= this.speedX
    this.y += this.speedY

    if (this.x < (0 - this.width)) this.canDelete = true
    if (this.y >= CANVAS_HEIGHT - this.height || this.y < 0) this.speedY = (this.speedY * -1)
    this.timeSinceAnimationStep += deltaTime

    //quando chegar no valor estipulado de animationStepInterval, rodar a animação. O valor timeSinceAnimationStep é somado com o delta do loop de animação
    if (this.timeSinceAnimationStep > this.animationStepInterval) {
      this.frame > this.maxFrame ? this.frame = 0 : this.frame++
      this.timeSinceAnimationStep = 0
      if (this.hasParticles) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(this.x, this.y, this.width, this.color))
        }
      }
    }

    if (this.x < 0 - this.width) gameOver = true
  }

  draw() {
    ctxCollision.fillStyle = this.color
    ctxCollision.fillRect(this.x, this.y, this.width, this.height)

    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    )
  }
}

function resetGame() {
  ships = []
  explosions = []
  particles = []
  score = 0
}

function drawScore() {
  ctx.fillStyle = 'white'
  ctx.fillText(`Score: ${score}`, 100, 75)
}
function drawGameOver() {
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.fillText(`GAME OVER, your score is: ${score}`, canvas.width / 2, canvas.height / 2)
  ctx.fillText(`CLICK to try again`, canvas.width / 2, canvas.height / 1.8)
  window.addEventListener("click", handleClickGameStart)
}
function drawGameStart() {
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.fillText(`CLICK to start`, canvas.width / 2, canvas.height / 2)
  window.addEventListener("click", handleClickGameStart)
}
function detectMouseCollision(e) {
  const detectPixelColor = ctxCollision.getImageData(e.x, e.y, 1, 1)
  const [r, g, b] = detectPixelColor.data

  ships.forEach(ship => {
    if (ship.randomColors[0] === r && ship.randomColors[1] === g && ship.randomColors[2] === b) {
      ship.canDelete = true
      ship.hasParticles ? score += 2 : score++
      explosions.push(new Explosion(ship.x, ship.y, ship.width))
    }
  })
}
function drawRandomBackground() {
  const backgroundImage = new Image()
  backgroundImage.src = backgroundOptions[randomBackgroundIndex]
  ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}
function playMusic() {
  const music = new Audio()
  music.src = './assets/sound/music.mp3'
  music.volume = .5
  music.play()
}
function handleClickGameStart() {
  resetGame()
  gameStarted = true
  gameOver = false
}
function renderEnemies(timestamp) {
  // controla de quanto em quanto tempo vai ser renderizado um 'ship'
  // quanto tempo para ser executado o loop 'animate', pode mudar de acordo com a máquina do usuario
  let deltaTime = timestamp - lastTime
  lastTime = timestamp

  // valor incrementa baseado nos frames que a maquina conseguir rodar, entao se a performance for baixa, a variavel vai receber valores maiores, alcançando mais rapido a condição do if para renderiar um 'ship', fazendo com que seja otimizado para todos os PCs e seja rodado a cada 500ms
  timeToNextShip += deltaTime
  if (timeToNextShip > shipInterval) {
    ships.push(new Ship())
    timeToNextShip = 0
    ships = ships.sort((a, b) => a.width - b.width) // ordena para q o maior fique na frente
  }

  [...particles, ...ships, ...explosions].forEach(obj => obj.update(deltaTime));
  [...particles, ...ships, ...explosions].forEach(obj => obj.draw());

  ships = ships.filter(ship => !ship.canDelete)
  explosions = explosions.filter(explosion => !explosion.canDelete)
  particles = particles.filter(particle => !particle.canDelete)
}

// timestamp: valor automatico do js, tempo de runtime em ms, precisa do valor inicial pq começa com 'undefined'
function animate(timestamp = 0) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctxCollision.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawRandomBackground()

  if (!gameStarted && !gameOver) {
    drawGameStart()
  }

  if (gameStarted && !gameOver) {
    window.removeEventListener("click", handleClickGameStart)
    window.removeEventListener("pointerdown", handleClickGameStart)
    window.addEventListener('click', detectMouseCollision)
    window.addEventListener('pointerdown', detectMouseCollision)
    drawScore();
    renderEnemies(timestamp)
    // playMusic()
  }

  if (gameStarted && gameOver) {
    window.removeEventListener("click", handleClickGameStart)
    window.removeEventListener('click', detectMouseCollision)
    window.removeEventListener('pointerdown', detectMouseCollision)
    drawGameOver();
  }

  requestAnimationFrame(animate)
}
animate()
