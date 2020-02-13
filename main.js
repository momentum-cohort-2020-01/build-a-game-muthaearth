//**new Warfare** creates game object w/game state and logic
class Warfare {
  constructor() {
    //canvas tag in index.html will be initiated
    //grabs canvas out of DOM
    let canvas = document.getElementById("pixwar");

    //get drawing context, whhich contains functs to draw to canvas
    let screen = canvas.getContext("2d");

    //get dims of canvas, used to place combatants
    let stageArea = { x: canvas.width, y: canvas.height };

    //create combatants array to hold player, foes, ammo
    this.combatants = [];

    //add foes to the combatants array
    this.combatants = this.combatants.concat(createFoes(this));

    //add player to combatants array
    this.combatants = this.combatants.concat(new Player(this, stageArea));

    //load shooting sound audio tag from index.html
    //get shooting soundf from the DOM and store it on the warfare object
    this.shootSound = document.getElementById("shoot-sound");

    //tick funct loops forever, running 60ish times/second
    let tick = () => {
      //update warfare state
      this.update();

      //draw warfare combatants
      this.draw(screen, stageArea);

      //queue up next call to tick with browser
      requestAnimationFrame(tick);
    };

    //run 1st warfare tick; future calls will occur via tick() funct
    tick();
  }

  //update runs warfare logic
  update() {
    //this returns true if passed combatant does not collide w/anything
    let noCollision = c1 => {
      return (
        this.combatants.filter(function(c2) {
          return collision(c1, c2);
        }).length === 0
      );
    };

    //permanently discard collion-prone combatants (no update, no redraw)
    this.combatants = this.combatants.filter(noCollision);

    //call update on every combatant
    for (let i = 0; i < this.combatants.length; i++) {
      this.combatants[i].update();
    }
  }

  //draw warfare
  draw(screen, stageArea) {
    //clear drawing from previous tick
    screen.clearRect(0, 0, stageArea.x, stageArea.y);

    //draw each combatant as rectangle
    for (let i = 0; i < this.combatants.length; i++)
      drawRect(screen, this.combatants[i]);
  }

  //foesBelow returns true if "foe" is directly above
  //at least one other foe

  foesBelow(foe) {
    //if filtered array is not empty, foes are below
    return (
      this.combatants.filter(function(c) {
        //keep 'c' if foe exists, is in same column as foe and
        //and 'foe' is somewhere below foe
        return (
          c instanceof Foe &&
          Math.abs(foe.center.x - c.center.x) < c.size.x &&
          c.center.y > foe.center.y
        );
      }).length > 0
    );
  }

  //add combatant to array of combatants array
  addCombatant(combatant) {
    this.combatants.push(combatant);
  }
}

//new Foe creates a foe
class Foe {
  constructor(warfare, center) {
    this.warfare = warfare;
    this.center = center;
    this.size = { x: 15, y: 15 };

    //foes patrol stage area from left to right and return line
    //patrolX records current (relative) position of foe during patrol
    //starts at 0 and increases to 40, then creases to 0, and back again
    this.patrolX = 0;

    //the x speed of foe; positive value moves foe R; negative, L
    this.speedX = 0.3;
  }

  //updates state of foe per tick
  update() {
    //if foe is outside bounds of patrol...
    if (this.patrolX < 0 || this.patrolX > 30) {
      //reverse movement direction
      this.speedX = -this.speedX;
    }

    //if ammo is released and no compatriots below in this foe's column
    if (Math.random() > 0.995 && !this.warfare.foesBelow(this)) {
      //create ammo just below foe to move downward
      let ammo = new Ammo(
        { x: this.center.x, y: this.center.y + this.size.y / 2 },
        { x: Math.random() - 0.5, y: 2 }
      );

      //and add ammo to cache
      this.warfare.addCombatant(ammo);
    }

    //move according to current x speed
    this.center.x += this.speedX;

    //update letiable that keeps track of current patrol position
    this.patrolX += this.speedX;
  }
}

//this function returns an array of 24 foes
function createFoes(warfare) {
  let foes = [];
  for (let i = 0; i < 24; i++) {
    //place foes in 8 columns
    let x = 30 + (i % 8) * 30;
    //place foes in three rows
    let y = 30 + (i % 3) * 30;

    //create foe
    foes.push(new Foe(warfare, { x: x, y: y }));
  }
  return foes;
}

//create new player

class Player {
  constructor(warfare, warStage) {
    this.warfare = warfare;
    this.size = { x: 15, y: 15 };
    this.center = { x: warStage.x / 2, y: warStage.y - this.size.y * 2 };

    //create keyboard object to track button presses
    this.keyboarder = new Keyboarder();
  }

  //update state of player per tick
  update() {
    //if left cursor key is down
    if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
      //move left
      this.center.x -= 2;
    } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
      this.center.x += 2;
    }

    //if S key is down
    if (this.keyboarder.isDown(this.keyboarder.KEYS.S)) {
      //create an ammo just above player to move upwards
      let ammo = new Ammo(
        { x: this.center.x, y: this.center.y - this.size.y - 10 },
        { x: 0, y: -7 }
      );
      //add ammo
      this.warfare.addCombatant(ammo);

      //rewind shoot sound
      this.warfare.shootSound.load();

      //play shooting sound
      this.warfare.shootSound.play();
    }
  }
}

//new ammo
class Ammo {
  constructor(center, velocity) {
    this.center = center;
    this.size = { x: 3, y: 3 };
    this.velocity = velocity;
  }

  //update state of ammo per tick
  update() {
    //add velocity to center and move ammo
    this.center.x += this.velocity.x;
    this.center.y += this.velocity.y;
  }
}

//keyboard input tracking
class Keyboarder {
  constructor() {
    //records up/down state of each pressed key
    let keyState = {};

    //record when key pressed down
    window.addEventListener("keydown", function(e) {
      keyState[e.keyCode] = true;
    });

    //record when key pressed up
    window.addEventListener("keyup", function(e) {
      keyState[e.keyCode] = false;
    });

    //returns true if passed key is currently down
    //'keyCode' is a unique number that represents a
    //particular key on keyboard
    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
    };

    //handy constants that give keyCodes human-readible names
    this.KEYS = { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, S: 83 };
  }
}

//this draws passed combatant as rectangle to 'screen'
function drawRect(screen, combatant) {
  screen.fillStyle = "white";
  screen.fillRect(
    combatant.center.x - combatant.size.x / 2,
    combatant.center.y - combatant.size.y / 2,
    combatant.size.x,
    combatant.size.y
  );
}

//collision returns true if 2 passed combatants collide
//5 scenario test; if any true, combatants do NOT collide
//if none true, combatants collide

//1. c1 is same combatant as c2
//2. Right of c1 is to L of L of c2
//3. Bottom of c1 is above top of c2
//4. Left of c1 is to R of R of c2
//5. Top of c1 is below bottom of c2

//if any of these conditions are true, return opposite of expression
function collision(c1, c2) {
  return !(
    c1 === c2 ||
    c1.center.x + c1.size.x / 2 < c2.center.x - c2.size.x / 2 ||
    c1.center.y + c1.size.y / 2 < c2.center.y - c2.size.y / 2 ||
    c1.center.x - c1.size.x / 2 > c2.center.x + c2.size.x / 2 ||
    c1.center.y - c1.size.y / 2 > c2.center.y + c2.size.y / 2
  );
}

//Start WarFare
//when DOM is ready, create (and start) warfare
window.addEventListener("load", function() {
  new Warfare();
});
