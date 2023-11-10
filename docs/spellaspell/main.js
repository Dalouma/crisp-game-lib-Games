title = "SPELL\'A\'SPELL";

description = `
Match the monsters

Short Press
and
Long Press
`;

characters = [
`
  b
bbbbb
  l
 lll
  l
 l l
`,`
lrrrrl
rlrrlr
rlrrlr
rrrrrr
rllllr
lrrrrl
`,`


lll


`,`
    ll
  ll
ll
  ll
    ll
`
];

const G = {
	WIDTH: 110,
	HEIGHT: 150,

	INPUT_MEMORY_LENGTH: 3,
	INPUT_LONG_LENGTH: 15,
	INPUT_DISPLAY_OFFSET: 10,
	INPUT_SPACING: 10,

	ENEMY_SPAWN_TIME: 120,
	ENEMY_MIN_BASE_SPEED: 0.1,
    ENEMY_MAX_BASE_SPEED: 0.2,
	ENEMY_REQ_OFFSET: 5,

	ARROW_BLINK_TIME: 30,
};

options = {
	viewSize: {x: G.WIDTH, y: G.HEIGHT},
	seed: 938475982357,
	isPlayingBgm: true,
	theme: "shape",
};

/**
 * @typedef {{
* pos: Vector,
* }} Player
*/

/**
* @type { Player }
*/
let player;

// SINGLE PRESS = 0
// LONG PRESS = 1
/**
* @type { number [] }
*/
let inputMemory;

/**
* @type { number }
*/
let nTicks;

/**
 * @typedef {{
* pos: Vector,
* speed: number,
* angle: number,
* killReq: number []
* }} Enemy
*/

/**
* @type { Enemy [] }
*/
let enemies;

/**
* @type { number }
*/
let spawnCooldown;

/**
* @type { number }
*/
let arrowTimer;

/**
* @type { boolean }
*/
let arrowBlink;

function update() {
	// This is the Start() function
	if (!ticks) {
		player = {
			pos: vec(G.WIDTH * 0.5, G.HEIGHT - 20)
		};

		inputMemory = []
		nTicks = 0
		arrowTimer = 0
		arrowBlink = true

		enemies = []
		spawnCooldown = 0
	}


	// Everything else is normal Update()
	// draw player
	char("a", player.pos);

	// keep track of input lengths
	countPress()

	// spawn enemies
	spawnEnemies()
	// move and check collisions
	handleEnemies()

	// draw Inputs
	drawInputs()

}

function drawInputs() {
	for (let i = 0; i < inputMemory.length ; i++) {
		let xOffset = i * G.INPUT_SPACING - G.INPUT_SPACING
		let imgPosition = vec(player.pos.x + xOffset, player.pos.y + G.INPUT_DISPLAY_OFFSET)
		if (inputMemory[i] == 0) {
			box(imgPosition, 3)
		}
		else {
			char("c", imgPosition)
		}
	}
	arrowTimer--
	if (arrowTimer <= 0) {
		arrowBlink = !arrowBlink
		arrowTimer = G.ARROW_BLINK_TIME
	}
	if (arrowBlink) {
		// HARD CODED BC IM LAZY
		char("d", vec(player.pos.x + 20, player.pos.y + G.INPUT_DISPLAY_OFFSET))
	}
}

function spawnEnemies() {
	spawnCooldown--
	if (spawnCooldown <= 0) {
		let numEnemies = rndi(1,2)
        for (let i = 0; i < numEnemies; i++) {
			// random location
            const posX = rnd(-15, G.WIDTH + 15);
            const posY = -rnd(i * G.HEIGHT * 0.1);
			// random inputlist
			let inputList = [rndi(0,2),rndi(0,2),rndi(0,2)]
            enemies.push({ 
				pos: vec(posX, posY),
				speed: rnd(G.ENEMY_MIN_BASE_SPEED, G.ENEMY_MAX_BASE_SPEED) * difficulty,
				angle: vec(posX, posY).angleTo(player.pos),
				killReq: inputList
			})
        }
		spawnCooldown = G.ENEMY_SPAWN_TIME
    }
}

function handleEnemies() {
	remove(enemies, (e) => {
		e.pos.x += e.speed * Math.cos(e.angle)
		e.pos.y += e.speed * Math.sin(e.angle)

		const isCollidingWithPlayer = char("b", e.pos).isColliding.char.a;
		if (isCollidingWithPlayer) {
			end();
            play("hit");
		}
		// draw reqs
		for (let i = 0; i < G.INPUT_MEMORY_LENGTH ; i++) {
			let xOffset = i * 5 - 5
			let reqPosition = vec(e.pos.x + xOffset, e.pos.y - G.ENEMY_REQ_OFFSET)
			if (e.killReq[i] == 0) {
				box(reqPosition, 1)
			}
			else {
				char("c", reqPosition)
			}
		}


		// check input
		for (let i = 0; i < G.INPUT_MEMORY_LENGTH; i++) {
			if (e.killReq[i] != inputMemory[i]) {
				return false
			}
		}

		play("explosion")
		addScore(10, e.pos);
		return true
	})

	
}

function countPress() {
	if (input.isPressed) {
		nTicks++
	}
	if (input.isJustReleased) {
		if (nTicks >= G.INPUT_LONG_LENGTH){
			//console.log("long")
			inputMemory.push(1)
		}
		else {
			//console.log("short")
			inputMemory.push(0)
		}
		nTicks = 0
		if (inputMemory.length > 3){
			inputMemory.shift()
		}
		//console.log(inputMemory.join())
	}
}
