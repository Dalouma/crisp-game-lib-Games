title = "CHARGE RUSH";

description = `
Destroy enemies.
`;

characters = [
`
  ll
  ll
 cllc
ccllcc
cc  cc
c    c
`,`
rr  rr
rrrrrr
rrpprr
rrrrrr
  rr
  rr
`,`
y  y
yyyyyy
 y  y
yyyyyy
 y  y
`
];

// GAME CONSTANTS
const G = {
	WIDTH: 100,
	HEIGHT: 150,

	STAR_SPEED_MIN: 0.5,
	STAR_SPEED_MAX: 1.0,

	PLAYER_FIRE_RATE: 4,
    PLAYER_GUN_OFFSET: 3,

    FBULLET_SPEED: 5,

	ENEMY_MIN_BASE_SPEED: 1.0,
    ENEMY_MAX_BASE_SPEED: 2.0,
	ENEMY_FIRE_RATE: 45,

    EBULLET_SPEED: 2.0,
    EBULLET_ROTATION_SPD: 0.1
};

// GAME OPTIONS
options = {
	viewSize: {x: G.WIDTH, y: G.HEIGHT},
	seed: 1,
	isPlayingBgm: true
};

// define a star
/**
* @typedef {{
* pos: Vector,
* speed: number
* }} Star
*/

/**
* @type  { Star [] }
*/
let stars;

// define a player
/**
 * @typedef {{
* pos: Vector,
* firingCooldown: number,
* isFiringLeft: boolean
* }} Player
*/

/**
* @type { Player }
*/
let player;

// define a bullet
/**
 * @typedef {{
* pos: Vector
* }} FBullet
*/

/**
* @type { FBullet [] }
*/
let fBullets;

// define an enemy
/**
 * @typedef {{
* pos: Vector,
* firingCooldown: number
* }} Enemy
*/

/**
* @type { Enemy [] }
*/
let enemies;

// define an enemy bullet
/**
 * @typedef {{
* pos: Vector,
* angle: number,
* rotation: number
* }} EBullet
*/

/**
* @type { EBullet [] }
*/
let eBullets;

/**
* @type { number }
*/
let currentEnemySpeed;

/**
* @type { number }
*/
let waveCount;

function update() {
	if (!ticks) {
		// FOR LOOPS ARE WRITTEN THIS WAY
		stars = times(20, () => {
            const posX = rnd(0, G.WIDTH);
            const posY = rnd(0, G.HEIGHT);
            return {
                pos: vec(posX, posY),
                speed: rnd(0.5, 1.0)
            };
        });
		// Initialize player
		player = {
			pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
			firingCooldown: G.PLAYER_FIRE_RATE,
            isFiringLeft: true
		};

		fBullets = [];
		enemies = [];
		eBullets = [];

    	waveCount = 0;
    	currentEnemySpeed = 0;
	}

	// THERE IS A BUILT IN DIFFICULTY VARIABLE THAT INCREASES
	// BY 1 EVERY MINUTE
	if (enemies.length === 0) {
        currentEnemySpeed =
            rnd(G.ENEMY_MIN_BASE_SPEED, G.ENEMY_MAX_BASE_SPEED) * difficulty;
        for (let i = 0; i < 9; i++) {
            const posX = rnd(0, G.WIDTH);
            const posY = -rnd(i * G.HEIGHT * 0.1);
            enemies.push({ 
				pos: vec(posX, posY),
				firingCooldown: G.ENEMY_FIRE_RATE
			})
        }

		waveCount++;
    }

	// shapes need to be drawn every frame or else they disappear
	player.pos = vec(input.pos.x, input.pos.y);
	player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);
	player.firingCooldown--;

	if (player.firingCooldown <= 0) {
		const offset = (player.isFiringLeft)
            ? -G.PLAYER_GUN_OFFSET
            : G.PLAYER_GUN_OFFSET;
        // Create the bullet
        fBullets.push({
            pos: vec(player.pos.x + offset, player.pos.y)
        });
        // Reset the firing cooldown
        player.firingCooldown = G.PLAYER_FIRE_RATE;
		// Switch the side of the firing gun by flipping the boolean value
        player.isFiringLeft = !player.isFiringLeft;

		color("yellow");
        // PARTICLE EXAMPLE
        particle(
            player.pos.x + offset, // x coordinate
            player.pos.y, // y coordinate
            4, // The number of particles
            1, // The speed of the particles
            -PI/2, // The emitting angle
            PI/4  // The emitting width
        );
    }
	color ("black");
	char("a", player.pos);

	// FOR EACH LOOP EXAMPLE
    fBullets.forEach((fb) => {
        // Move the bullets upwards
        fb.pos.y -= G.FBULLET_SPEED;
        
        // Drawing
        color("yellow");
        box(fb.pos, 2);
    });
	// FILTER VERSION for FOR EACH LOOPS
	// REMOVES UPON CONDITION
	remove(fBullets, (fb) => {
        return fb.pos.y < 0;
    });
	//text(fBullets.length.toString(), 3, 10);

	// FOR EACH LOOP EXAMPLE
	stars.forEach((s) => {
		
		s.pos.y += s.speed;
		s.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);

		// Choose a color to draw
		color("light_black");
		// Draw the star as a square of size 1
		box(s.pos, 1);
	});

	remove(enemies, (e) => {
        e.pos.y += currentEnemySpeed;
		e.firingCooldown--;
        if (e.firingCooldown <= 0) {
            eBullets.push({
                pos: vec(e.pos.x, e.pos.y),
                angle: e.pos.angleTo(player.pos),
                rotation: rnd()
            });
            e.firingCooldown = G.ENEMY_FIRE_RATE;
            play("select"); // Be creative, you don't always have to follow the label
        }
        
		color("black");
        const isCollidingWithFBullets = char("b", e.pos).isColliding.rect.yellow;
		if (isCollidingWithFBullets) {
            color("yellow");
            particle(e.pos);
			play("explosion");
			addScore(10 * waveCount, e.pos);
        }
		const isCollidingWithPlayer = char("b", e.pos).isColliding.char.a;
        if (isCollidingWithPlayer) {
            end();
            play("powerUp");
        }

        return (isCollidingWithFBullets || e.pos.y > G.HEIGHT);
    });

	remove(fBullets, (fb) => {
        // Interaction from fBullets to enemies, after enemies have been drawn
        color("yellow");
        const isCollidingWithEnemies = box(fb.pos, 2).isColliding.char.b;
        return (isCollidingWithEnemies || fb.pos.y < 0);
    });

	remove(eBullets, (eb) => {
        // Old-fashioned trigonometry to find out the velocity on each axis
        eb.pos.x += G.EBULLET_SPEED * Math.cos(eb.angle);
        eb.pos.y += G.EBULLET_SPEED * Math.sin(eb.angle);
        // The bullet also rotates around itself
        eb.rotation += G.EBULLET_ROTATION_SPD;

        color("red");
        const isCollidingWithPlayer
            = char("c", eb.pos, {rotation: eb.rotation}).isColliding.char.a;

        if (isCollidingWithPlayer) {
            // End the game
            end();
            // Sarcasm; also, unintedned audio that sounds good in actual gameplay
            play("powerUp"); 
        }
		const isCollidingWithFBullets
            = char("c", eb.pos, {rotation: eb.rotation}).isColliding.rect.yellow;
        if (isCollidingWithFBullets) addScore(1, eb.pos);
        
        // If eBullet is not onscreen, remove it
        return (!eb.pos.isInRect(0, 0, G.WIDTH, G.HEIGHT));
    });


}
