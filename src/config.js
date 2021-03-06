import Path from './path.js'
import Wall from './wall.js'
import Bumper from './bumper.js'

export default class Config {
    constructor() {
        this.bounds = {
            min: { x: 0, y: 0},
            max: { x: 500, y: 992 }
        }
        this.PATHS = {
            DOME: '0 0 0 250 19 250 20 231.9 25.7 196.1 36.9 161.7 53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 231.9 20 268.1 20 303.9 25.7 338.3 36.9 370.5 53.3 399.8 74.6 425.4 100.2 446.7 129.5 463.1 161.7 474.3 196.1 480 231.9 480 250 500 250 500 0 0 0',
            DROP_LEFT: '0 0 20 0 70 100 20 150 0 150 0 0',
            DROP_RIGHT: '50 0 68 0 68 150 50 150 0 100 50 0',
            APRON_TOP_LEFT: '0 0 180 0 0 120 0 0',
            APRON_LEFT: '0 0 180 120 0 120 0 0',
            APRON_RIGHT: '180 0 180 120 0 120 180 0'
        }
        this.COLORS = {
            BACKGROUND: '#0070ad',
            OUTER: '#495057',
            INNER: '#12abdb',
            BUMPER: '#fab005',
            BUMPER_LIT: '#fff3bf',
            PADDLE: '#e64980',
            PINBALL: '#dee2e6'
        }
        this.GRAVITY = 0.6
        this.WIREFRAMES = false
        this.MAX_VELOCITY = 32
        this.staticBodies = [ 
            new Path(440, 96,this.PATHS.DOME, this.COLORS.OUTER).path,
            new Path(30, 30, this.PATHS.APRON_TOP_LEFT, this.COLORS.OUTER).path,
            new Wall(120, 140, 20, 40, 0, this.COLORS.INNER).wall,
            new Wall(190, 140, 20, 40, 0, this.COLORS.INNER).wall,
            new Wall(260, 140, 20, 40, 0,  this.COLORS.INNER).wall,
            new Wall(330, 140, 20, 40, 0, this.COLORS.INNER).wall,
            new Bumper(105, 250, this.COLORS.BUMBER_COLOR).bumper,
            new Bumper(225, 250, this.COLORS.BUMBER_COLOR).bumper,
            new Bumper(345, 250, this.COLORS.BUMBER_COLOR).bumper,
            new Bumper(165, 340, this.COLORS.BUMBER_COLOR).bumper,
            new Bumper(285, 340, this.COLORS.BUMBER_COLOR).bumper,
            new Wall(440, 620, 20, 722, 0, this.COLORS.OUTER, this.COLORS.OUTER).wall,
            new Path(25, 360, this.PATHS.DROP_LEFT, this.COLORS.OUTER).path,
            new Path(425, 360, this.PATHS.DROP_RIGHT, this.COLORS.OUTER).path,
            new Path(25, 520, this.PATHS.DROP_LEFT, this.COLORS.OUTER).path,
            new Path(425, 520, this.PATHS.DROP_RIGHT,this.COLORS.OUTER).path,
            new Wall(120, 702, 20, 120, 0, this.COLORS.INNER).wall,
            new Wall(330, 702, 20, 120, 0, this.COLORS.INNER).wall,
            new Wall(60, 721, 20, 160, 0, this.COLORS.INNER).wall,
            new Wall(390, 721, 20, 160, 0, this.COLORS.INNER).wall,
            new Wall(93, 816, 20, 98, -0.96, this.COLORS.INNER).wall,
            new Wall(357, 816, 20, 98, 0.96, this.COLORS.INNER).wall,
            new Path(79, 932, this.PATHS.APRON_LEFT, this.COLORS.OUTER).path,
            new Path(371, 932, this.PATHS.APRON_RIGHT, this.COLORS.OUTER).path
        ]
        this.keys = {
            leftPaddle: 'v', 
            rightPaddle: 'l', 
            shooter: 'f',
            back: '1'
        }
        this.demoMode = false;
        this.urls = {
            backgroundImage : 'img/background.svg'
        }

        this.ballsLeft = 3;
    }
    enableDemoMode() {
        this.demoMode = true;
    }

    useKeyboard() {
        this.keys = {
            leftPaddle: 'ArrowLeft', 
            rightPaddle: 'ArrowRight',
            shooter: ' ', 
            back: 'Backspace'
        }
    }

}