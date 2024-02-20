/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1")
const ctx = canvas.getContext('2d')
const CANVAS_WIDTH = canvas.width = window.innerWidth
const CANVAS_HEIGHT = canvas.height = window.innerHeight

/** @type {HTMLCanvasElement} */
const canvasCollision = document.getElementById("canvasCollision")
const ctxCollision = canvasCollision.getContext('2d')
const CANVAS_COLLISION_WIDTH = canvasCollision.width = window.innerWidth
const CANVAS_COLLISION_HEIGHT = canvasCollision.height = window.innerHeight

let timeToNextRaven = 0
let ravenInterval = 500
let lastTime = 0
let ravens = []
let explosions = []
let particles = []
let score = 0
let gameOver = false
ctx.font = '50px Arial'

class Particle {
  constructor(x, y, size, color) {
    this.x = x + size / 2 + Math.random() * 50 - 25
    this.y = y + size / 3 + Math.random() * 50 - 25
    this.size = size
    this.color = color
    this.radius = Math.random() * this.size / 10
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
    this.image.src = './boom.png'
    this.spriteWidth = 200
    this.spriteHeight = 179
    this.size = size
    this.x = x
    this.y = y
    this.frame = 0
    this.sound = new Audio()
    this.sound.src = './explosion.wav'
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


class Raven {
  constructor() {
    this.speedX = Math.random() * 5 + 3
    this.speedY = Math.random() * 5 - 2.5
    this.sizeModifier = Math.random() * 0.6 + 0.4
    this.spriteWidth = 271
    this.spriteHeight = 194
    this.width = this.spriteWidth * this.sizeModifier
    this.height = this.spriteHeight * this.sizeModifier
    this.x = CANVAS_WIDTH
    this.y = Math.random() * (CANVAS_HEIGHT - this.height)
    this.canDelete = false
    this.maxFrame = 4
    this.frame = 0
    this.timeSinceFlap = 0
    this.flapInterval = Math.random() * 50 + 50
    this.image = new Image()
    this.image.src = './raven.png'
    this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
    this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`
    this.hasParticles = Math.random() > 0.5
  }

  update(deltaTime) {
    this.x -= this.speedX
    this.y += this.speedY

    if (this.x < (0 - this.width)) this.canDelete = true
    if (this.y >= CANVAS_HEIGHT - this.height || this.y < 0) this.speedY = (this.speedY * -1)
    this.timeSinceFlap += deltaTime

    //quando chegar no valor estipulado de flapInterval, rodar a animação. O valor é somado com o delta do loop de animação
    if (this.timeSinceFlap > this.flapInterval) {
      this.frame > this.maxFrame ? this.frame = 0 : this.frame++
      this.timeSinceFlap = 0
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

function drawScore() {
  ctx.fillStyle = 'black'
  ctx.fillText(`Score: ${score}`, 50, 75)
  ctx.fillStyle = 'tomato'
  ctx.fillText(`Score: ${score}`, 53, 77)
}

function drawGameOver() {
  ctx.textAlign = 'center'
  ctx.fillStyle = 'black'
  ctx.fillText(`GAME OVER, your score is: ${score}`, canvas.width / 2, canvas.height / 2)
  ctx.fillText(`Refresh to try again`, canvas.width / 2, canvas.height / 1.7)
  ctx.fillStyle = 'tomato'
  ctx.fillText(`GAME OVER, your score is: ${score}`, canvas.width / 2 - 3, canvas.height / 2 - 2)
  ctx.fillText(`Refresh to try again`, canvas.width / 2 - 3, canvas.height / 1.7 - 2)

}

function detectMouseCollision(e) {
  const detectPixelColor = ctxCollision.getImageData(e.x, e.y, 1, 1)
  const [r, g, b] = detectPixelColor.data

  ravens.forEach(raven => {
    if (raven.randomColors[0] === r && raven.randomColors[1] === g && raven.randomColors[2] === b) {
      raven.canDelete = true
      score++
      explosions.push(new Explosion(raven.x, raven.y, raven.width))
    }
  })
}

window.addEventListener('click', detectMouseCollision)

// timestamp: valor automatico do js, tempo de runtime em ms, precisa do valor inicial pq começa com 'undefined'
function animate(timestamp = 0) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctxCollision.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // controla de quanto em quanto tempo vai ser renderizado um 'raven'
  let deltaTime = timestamp - lastTime // quanto tempo para ser executado o loop 'animate', pode mudar de acordo com a máquina do usuario
  lastTime = timestamp
  timeToNextRaven += deltaTime // valor incrementa baseado nos frames que a maquina conseguir rodar, entao se a performance for baixa, a variavel vai receber valores maiores, alcançando mais rapido a condição do if para renderiar um 'raven', fazendo com que seja otimizado para todos os PCs e seja rodado a cada 500ms
  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven())
    timeToNextRaven = 0
    ravens = ravens.sort((a, b) => a.width - b.width) // ordena para q o maior fique na frente
  }

  [...particles, ...ravens, ...explosions].forEach(raven => raven.update(deltaTime));
  [...particles, ...ravens, ...explosions].forEach(raven => raven.draw());

  ravens = ravens.filter(raven => !raven.canDelete)
  explosions = explosions.filter(explosion => !explosion.canDelete)
  particles = particles.filter(particle => !particle.canDelete)

  drawScore();


  if (!gameOver) {
    requestAnimationFrame(animate)
  } else {
    drawGameOver();
  }
}

animate()
