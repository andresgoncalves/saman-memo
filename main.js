class App {
  constructor() {
    this.showHomeView()

    document.querySelector("#player").addEventListener("input", event => {
      document.querySelector(".start-button").disabled =
        event.target.value.trim() == ""
    })
    document.querySelector("#player").addEventListener("keypress", event => {
      if (event.code === "Enter") {
        this.startGame()
      }
    })

    document.querySelector(".start-button").addEventListener("click", () => {
      this.startGame()
    })

    document.querySelectorAll(".restart-button").forEach(button =>
      button.addEventListener("click", () => {
        this.startGame()
      })
    )

    document.querySelector(".info-button").addEventListener("click", () => {
      this.showInfoView()
    })

    document.querySelectorAll(".see-leaderboard-button").forEach(button => {
      button.addEventListener("click", () => {
        this.showLeaderboard()
      })
    })

    document
      .querySelector(".clear-leaderboard-button")
      .addEventListener("click", () => {
        this.deleteLeaderboard()
        this.showLeaderboard()
      })

    document.querySelectorAll(".back-button").forEach(button => {
      button.addEventListener("click", () => {
        this.showHomeView()
      })
    })
  }

  showView(id) {
    this.game?.stopTimer()
    document.querySelectorAll(".container").forEach(container => {
      container.classList.remove("container--visible")
    })
    document.getElementById(id)?.classList.add("container--visible")
  }

  getLeaderboard() {
    return JSON.parse(localStorage.getItem("leaderboard") ?? "[]").slice(0, 10)
  }

  registerScore(player, score) {
    const scores = [...this.getLeaderboard(), { player, score }]
      .sort((a, b) => (a.score < b.score ? 1 : a.score > b.score ? -1 : 0))
      .slice(0, 10)
    localStorage.setItem("leaderboard", JSON.stringify(scores))
  }

  startGame() {
    const player = document.querySelector("#player").value.trim()
    this.game?.stopTimer()
    this.game = new Game(this, player)
    this.game.prepareBoard()
    this.showGameView()
    this.game.startTimer()
  }

  showInfoView() {
    this.showView("info-view")
  }

  showGameView() {
    this.showView("game-view")
  }

  showGameOverView() {
    this.showView("game-over-view")
  }

  showHomeView() {
    document.querySelectorAll("#home-view .card--flipped").forEach(card => {
      card.classList.remove("card--flipped")
    })
    this.showView("home-view")
    this.animateLogo()
  }

  deleteLeaderboard() {
    localStorage.removeItem("leaderboard")
  }

  showLeaderboard(currentPlayer, currentScore) {
    const leaderboard = document.querySelector("#leaderboard")
    document.querySelector("#leaderboard-view .title").innerHTML =
      !currentPlayer ? "Puntuaciones" : "¡Has Ganado!"
    leaderboard.replaceChildren()
    ;[].length
    const values = this.getLeaderboard()
    for (let i = values.length; i < 10; i++) {
      values.push({ player: "", score: 0 })
    }
    values.forEach(({ player, score }, index) => {
      const row = document.createElement("tr")
      const rankingCell = document.createElement("td")
      const playerCell = document.createElement("td")
      const scoreCell = document.createElement("td")
      row.className = "row"
      rankingCell.className = "ranking"
      playerCell.className = "player"
      scoreCell.className = "score"
      rankingCell.innerHTML = `${index + 1}.`
      playerCell.innerHTML = player
      scoreCell.innerHTML = `${score} pts`
      if (player === currentPlayer && score === currentScore) {
        row.classList.add("row--current-player")
        currentPlayer = null
      }
      row.appendChild(rankingCell)
      row.appendChild(playerCell)
      row.appendChild(scoreCell)
      leaderboard.appendChild(row)
    })
    this.showView("leaderboard-view")
  }

  animateLogo() {
    setTimeout(() => {
      document.querySelector("#logo-card-1").classList.add("card--flipped")
    }, 1000)
    setTimeout(() => {
      document.querySelector("#logo-card-2").classList.add("card--flipped")
    }, 2000)
  }
}

class Game {
  static TOTAL_TIME = 3 * 60 * 1000
  static TOTAL_PAIRS = 8
  static MAX_SCORE = 1000
  static IMAGES = [
    "assets/card-1.webp",
    "assets/card-2.webp",
    "assets/card-3.webp",
    "assets/card-4.webp",
    "assets/card-5.webp",
    "assets/card-6.webp",
    "assets/card-7.webp",
    "assets/card-8.webp",
  ]

  constructor(app, player) {
    this.app = app
    this.player = player
  }

  startTimer() {
    this.stopTimer()
    const timer = document.querySelector("#timer")
    const { format } = new Intl.DateTimeFormat([], {
      minute: "numeric",
      second: "2-digit",
    })
    function setTimer(ms) {
      timer.innerHTML = format(ms)
    }
    setTimer(Game.TOTAL_TIME)
    this.startTime = Date.now() + 100
    this.timer = setInterval(() => {
      const remaining = Game.TOTAL_TIME - Date.now() + this.startTime
      document.querySelector(
        ".status .score"
      ).innerHTML = `Score: ${this.getScore(remaining)}`
      if (remaining < 1000) {
        this.gameOver()
      }
      setTimer(remaining)
    }, 1000)
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  getScore(remaining = Game.TOTAL_TIME - Date.now() + this.startTime) {
    return Math.floor(Game.MAX_SCORE * (remaining / Game.TOTAL_TIME))
  }

  gameWon() {
    this.stopTimer()
    const score = this.getScore()
    this.app.registerScore(this.player, score)
    this.app.showLeaderboard(this.player, score)
  }

  gameOver() {
    this.stopTimer()
    this.app.showGameOverView()
  }

  flipCard(card) {
    if (
      Array.from(card.classList).includes("card--flipped") ||
      this.flipped === "miss"
    )
      return
    const current = this.flipped
    card.classList.add("card--flipped")
    if (!current) {
      this.flipped = card
    } else if (card.dataset.value === current.dataset.value) {
      setTimeout(() => {
        card.classList.add("card--matched")
        current.classList.add("card--matched")
      }, 500)
      this.matches += 1
      this.flipped = null
      document.querySelector(
        ".status .matches"
      ).innerHTML = `Aciertos: ${this.matches}`
      if (this.matches == Game.TOTAL_PAIRS) {
        this.gameWon()
      }
    } else {
      setTimeout(() => {
        card.classList.remove("card--flipped")
        current.classList.remove("card--flipped")
        this.flipped = null
      }, 1000)
      this.flipped = "miss"
      this.misses += 1
      document.querySelector(
        ".status .misses"
      ).innerHTML = `Fallos: ${this.misses}`
    }
  }

  clearStatus() {
    this.matches = this.misses = 0
    document.querySelector(
      ".status .misses"
    ).innerHTML = `Fallos: ${this.misses}`
    document.querySelector(
      ".status .matches"
    ).innerHTML = `Aciertos: ${this.matches}`
    document.querySelector(
      ".status .score"
    ).innerHTML = `Score: ${Game.MAX_SCORE}`
  }

  prepareBoard() {
    this.clearStatus()
    let values = []
    for (let i = 0; i < Game.IMAGES.length; i++) {
      values.push(i)
      values.push(i)
    }
    const board = document.querySelector("#board")
    board.replaceChildren()
    for (const value of values.sort(() => Math.random() - 0.5)) {
      const card = document.createElement("div")
      card.className = "card"
      card.dataset.value = value
      card.style.backgroundImage = `url("${Game.IMAGES[value]}")`
      card.addEventListener("click", event => {
        this.flipCard(event.target)
      })
      board.appendChild(card)
    }
  }
}

window.addEventListener("load", () => new App())
