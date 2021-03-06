import Boundary from './boundary.js'
import Paddle from './paddle.js'
import Stopper from './stopper.js'
import Config from './config.js'
import Launcher from './launcher.js';


var keys = {};
function keyHandle(event) {
  const keyName = event.type;
  
  keys[event.key] = event.type === 'keydown';
  if(keys['1'] && keys['2']){
  var url = "http://"+window.location.hostname+":"+window.location.port+'/index.html';
  	window.location = url;
  }
};

document.addEventListener('keydown',keyHandle);
document.addEventListener('keyup',keyHandle);

// plugins
Matter.use(MatterAttractors);

// constants

// score elements
let $currentScore = $('.current-score span');
let $highScore = $('.high-score span');

const CONFIG = new Config()
if (document.location.hash==='#keyboard') {
    CONFIG.useKeyboard()

}
if (document.location.hash==='#demo') {
    CONFIG.enableDemoMode()
}

function load() {
    new PinballGame(CONFIG);
}

class PinballGame {
    constructor(config) {
        this.config = config
        // engine (shared)
        this.engine = Matter.Engine.create();
        this.waitingForShooter = true;
        // world (shared)
        this.world = this.engine.world;
        this.world.bounds = this.config.bounds
        this.world.gravity.y = this.config.GRAVITY

        // render (shared)
        this.render = Matter.Render.create({
            element: document.querySelector('.container'),
            engine: this.engine,
            sprite: {
                texture: './img/background.svg'
            },
            options: {
                width: this.world.bounds.max.x,
                height: this.world.bounds.max.y,
                wireframes: this.config.WIREFRAMES,
                background: this.config.COLORS.BACKGROUND
            }
        });
        Matter.Render.run(this.render);

        Matter.Runner.run(Matter.Runner.create(), this.engine);
        this.stopperGroup = Matter.Body.nextGroup(true);
        this.currentScore = 0;
        try {
            this.highScore = parseInt(localStorage.getItem('highScore'));
            if (this.highScore == NaN)  {
                console.log('highScore reset', this.highScore)
                this.highScore = 0
            }
        } catch (SecurityError) {
            this.highScore = 0;
        }

        this.ballsLeft = config.ballsLeft;
        this.maxVelocity = 0;
        this.createStaticBodies();
        this.createPaddles();
        this.createPinball();
        this.createEvents();
        if (this.config.demoMode) {
            this.launchPinball();
        }
    
    }

    createStaticBodies() {
        Matter.World.add(this.world, new Boundary(this.world, 'top', this.config.COLORS.OUTER).boundary)
        Matter.World.add(this.world, new Boundary(this.world, 'bottom', this.config.COLORS.OUTER).boundary)
        Matter.World.add(this.world, new Boundary(this.world, 'left', this.config.COLORS.OUTER).boundary)
        Matter.World.add(this.world, new Boundary(this.world, 'right', this.config.COLORS.OUTER).boundary)

        this.config.staticBodies.forEach((item) => Matter.World.add(this.world, item))       
        Matter.World.add(this.world, [
            this.reset(225, 50),
        ]);
    }

    createPaddles() {

        // these bodies keep paddle swings contained, but allow the ball to pass through
        let leftUpStopper = new Stopper(160, this.world.bounds.max.y-209, 'up', 'paddle-left-comp', this.stopperGroup);
        let leftDownStopper = new Stopper(140, this.world.bounds.max.y-57, 'down', 'paddle-left-comp', this.stopperGroup);
        let rightUpStopper = new Stopper(290, this.world.bounds.max.y-209, 'up', 'paddle-right-comp', this.stopperGroup);
        let rightDownStopper = new Stopper(310, this.world.bounds.max.y-57, 'down', 'paddle-right-comp', this.stopperGroup);
        Matter.World.add(this.world, [leftUpStopper.stopper, leftDownStopper.stopper, rightUpStopper.stopper, rightDownStopper.stopper]);

        // this group lets paddle pieces overlap each other
        let paddleGroup = Matter.Body.nextGroup(true);
        this.paddleLeft = new Paddle(this.world, paddleGroup, 'left', 170)
        this.paddleRight = new Paddle(this.world, paddleGroup, 'right', 280)
        leftUpStopper.paddle = this.paddleLeft
        leftDownStopper.paddle = this.paddleLeft
        rightUpStopper.paddle = this.paddleRight
        rightDownStopper.paddle = this.paddleRight
    }

    createPinball() {
        this.pinball = Matter.Bodies.circle(0, 0, 14, {
            label: 'pinball',
            collisionFilter: {
                group: this.stopperGroup
            },
            render: {
                fillStyle: this.config.COLORS.PINBALL
            }
        });
        Matter.World.add(this.world, this.pinball);
        this.launcher = new Launcher(this.pinball)

        this.resetPinball();

    }

    ballLost() {
        this.ballsLeft--
        console.log("That ball is lost. You have only ", this.ballsLeft, " balls remaining")
        if (this.ballsLeft === 0) {
            this.gameOver()
        }
    }

    createEvents() {
        // events for when the pinball hits stuff
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                if (pair.bodyB.label === 'pinball') {
                    switch (pair.bodyA.label) {
                        case 'reset':
                            this.ballLost()
                            this.resetPinball();
                            break;
                        case 'bumper':
                            this.pingBumper(pair.bodyA);
                            break;
                    }
                    if (this.config.demoMode) {
                        switch (pair.bodyA.label) {
                            case 'paddle-left-tip':
                                this.paddleLeft.up()
                                setTimeout(() => { this.paddleLeft.down()}, 250);
                                break;
                            case 'paddle-right-tip':
                                this.paddleRight.up();
                                setTimeout(() => { this.paddleRight.down()}, 250);
                                break;
                            case 'reset':
                                this.ballLost()
                                this.launchPinball()
                                break;
                        }
                    }
                }
            });
        });

        // regulate pinball
        Matter.Events.on(this.engine, 'beforeUpdate', (event) => {
            // bumpers can quickly multiply velocity, so keep that in check
            Matter.Body.setVelocity(this.pinball, {
                x: Math.max(Math.min(this.pinball.velocity.x, this.config.MAX_VELOCITY), -this.config.MAX_VELOCITY),
                y: Math.max(Math.min(this.pinball.velocity.y, this.config.MAX_VELOCITY), -this.config.MAX_VELOCITY),
            });

            // cheap way to keep ball from going back down the shooter lane
            if (!this.waitingForShooter && this.pinball.position.x > 450 && this.pinball.velocity.y > 0) {
                Matter.Body.setVelocity(this.pinball, { x: 0, y: -10 });
            }
        });

        // mouse drag (god mode for grabbing pinball)
        Matter.World.add(this.world, Matter.MouseConstraint.create(this.engine, {
            mouse: Matter.Mouse.create(this.render.canvas),
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        }));

        // keyboard paddle events
        $('body').on('keydown', (e) => {
            if (e.key === this.config.keys.leftPaddle) { // left arrow key
                this.paddleLeft.up()
                e.stopPropagation()
            } else if (e.key === this.config.keys.rightPaddle) { // right arrow key
                this.paddleRight.up()
                e.stopPropagation()
            } else if (this.waitingForShooter) {
                if (e.key === this.config.keys.shooter) {
                    this.launcher.startPulling()                    
                    e.stopPropagation()
                }
            }
        });
        $('body').on('keyup', (e) => {
            if (e.key === this.config.keys.leftPaddle) { // left arrow key
                this.paddleLeft.down()
                e.stopPropagation()
            } else if (e.key === this.config.keys.rightPaddle) { // right arrow key
                this.paddleRight.down()
                e.stopPropagation()
            } else if (e.key === this.config.keys.back) {
                document.location.href = 'index.html'
                e.stopPropagation()
            } else if (this.waitingForShooter) {
                if  (e.key ===this.config.keys.shooter) {
                    this.launchPinball()
                    e.stopPropagation()
                }
            }
        });
    }

    resetPinball() {
        this.waitingForShooter = true
        Matter.Body.setPosition(this.pinball, { x: 465, y: 957 });
    }

    launchPinball() {
        if (this.waitingForShooter) {
            this.launcher.launch()
            this.waitingForShooter = false;
        }
    }

    gameOver() {
        window.location.href = 'index.html'
    }

    pingBumper(bumper) {
        this.updateScore(this.currentScore + 10);

        // flash color
        bumper.render.strokeStyle = this.config.COLORS.BUMPER_LIT;
        bumper.render.lineWidth = 12;
        setTimeout(() => {
            bumper.render.strokeStyle = this.config.COLORS.BUMPER;
            bumper.render.lineWidth = 0;
        }, 100);
    }

    get highScore() {
        return this._highScore
    }

    set highScore(newHighScore) {
        this._highScore = newHighScore
        localStorage.setItem('highScore', this._highScore)
        $highScore.text(this._highScore)
    }

    updateScore(newCurrentScore) {
        this.currentScore = newCurrentScore;
        $currentScore.text(this.currentScore);
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
        }
    }

    // matter.js has a built in random range function, but it is deterministic
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }


    // contact with these bodies causes pinball to be relaunched
    reset(x, width) {
        return Matter.Bodies.rectangle(x, this.world.bounds.max.y - 19, width, 2, {
            label: 'reset',
            isStatic: true,
            render: {
                fillStyle: '#fff'
            }
        });
    }    
}

window.addEventListener('load', load, false);