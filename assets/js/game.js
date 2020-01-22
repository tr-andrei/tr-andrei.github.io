"use strict";

let ActorID = 0;
const GRID_SIZE = 5;



const GRID_CELL_SIZE = 100;

/*****
	*	Default attributes for actors.
******/
const StartSkills = {
    'bee': {
        hp: 100,
        defense: 50,
        attack: 50,
        label: 'B',
        className: 'bee'
    },

    'queenBee': {
        hp: 100,
        defense: 50,
        attack: 50,
        label: 'QB',
        className: 'queen-bee'
    },


    'wasp': {
        hp: 100,
        defense: 30,
        attack: 30,
        label: 'W',
        className: 'wasp'
    },

    'queenWasp': {
        hp: 100,
        defense: 50,
        attack: 50,
        label: 'QW',
        className: 'queen-wasp'
    }
}


class Game {

    constructor() {
        this.actors = {};
        this.gridActors = Array(GRID_SIZE).fill(null).map(_ => Array(GRID_SIZE).fill(null));
        this.waspsAttacked = false;
    }

    /*****
	    *	Create the grid base on 
    ******/
    createGrid(cellSize) {
    
        let grid = document.getElementById("grid");

        for (var i = 0; i < GRID_SIZE; i++) {
            for (var j = 0; j < GRID_SIZE; j++) {
                let cell = grid.appendChild(document.createElement('div'));
                cell.className = "cell";
                cell.style.left = j * cellSize + 'px';
                cell.style.top = i * cellSize + 'px';

                let coords = { x: j, y: i };

                cell.addEventListener('click',
                    evt => this.handleEmptyCellClick(evt, coords));
            }
        }
        this.gridDOMElement = grid;
        this.actorsDOMElement = document.getElementById('actors');
    }

    get actorsList() {
        return Object.values(this.actors);
    }

    get selectedActor() {
        return this.actorsList.filter(act => act.isSelected)[0] || null;
    }

    get bees() {
        return this.actorsList.filter(act => act.type === 'bee' || act.type === 'queenBee');
    }

    get wasps() {
        return this.actorsList.filter(act => act.type === 'wasp' || act.type === 'queenWasp');
    }

    log(msg) {

        let logs = document.getElementById('logs');
        let log = document.createElement('li');
        log.innerHTML = msg;

        logs.appendChild(log);
        console.log(msg);
    }

    logAttack(att, def, damage) {
        let msg = `<span class="highlight">${att.toString()}</span> attacked <span class="highlight">${def.toString()}</span> with damage ${damage}. Remaining HP = ${def.hp}, Attack = ${def.attack}`;
        this.log(msg);
    }
    logMove(act, coords) {
        let msg = `${act.toString()} moved to (${coords.x}, ${coords.y})`;
        this.log(msg);
    }
    logRemove(act) {
        let msg = `${act.toString()} R.I.P.`
        this.log(msg);
    }

    /*****
		 *	Return coords array with all neighbours based on the given coords.
		 *
		 *	@param object coords Coords of the actor. 
	******/
    neighboursOf(coords) {
        const { x, y } = coords;
        const adj = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let cx = x + dx;
                let cy = y + dy;
                if (cx >= 0 && cx < GRID_SIZE &&
                    cy >= 0 && cy < GRID_SIZE)
                    adj.push({ x: cx, y: cy });
            }
        }

        return adj;
    }

    /*****
		 *	Return all empty cells near the given coords.
		 *
		 *	@param object coords 
	******/
    adjacentEmptyCells(coords) {

        let adjCoordsArr = this.neighboursOf(coords);
        let adjCells = [];

        adjCoordsArr.forEach(adjCoords => {
            let adjActor = this.gridActors[adjCoords.y][adjCoords.x];
            if (!adjActor)
                adjCells.push(adjCoords);
        });

        return adjCells;
    }


    /*****
		 *	Return all actors next to you (based on the given coords)
		 *
		 *	@param object coords 
	******/
    adjacentActors(coords) {
        let adjCoordsArr = this.neighboursOf(coords);
        let adjActors = [];

        adjCoordsArr.forEach(adjCoords => {
            let adjActor = this.gridActors[adjCoords.y][adjCoords.x];
            if (adjActor)
                adjActors.push(adjActor);
        });

        return adjActors;
    }

    adjacentBees(coords) {
        return this.adjacentActors(coords).filter(act => act.type === 'bee');
    }

    adjacentWasps(coords) {
        return this.adjacentActors(coords).filter(act => act.type === 'wasp');
    }


    /*****
		 *	Return all empty cells near the bees. 
         *	Used just for fun, to make sure that a wasp will move only to an availbale space near the bee
         *	Can be optimize
		 *
		 *	@param object coords 
	******/
    adjacentEmptyCellsToBees() {
        let adjCells = [];
        this.bees.forEach(bee => {
            let beeCoords = bee.coords;
            let beeAdjCells = this.adjacentEmptyCells(beeCoords);
            adjCells = adjCells.concat(beeAdjCells);
        });

        // will contain duplicates, but it doesn't matter because the only use case
        // is to select a random value from this array when selecting the next position for the AI wasps 
        return adjCells;
    }

     /*****
		 *	Check if 2 actors are nieghbours.
         *	Return boolean.
		 *
		 *	@param object actor 1 
         *	@param object actor 2
	******/
    actorsAreAdjacent(act1, act2) {
        return this.adjacentActors(act1.coords).includes(act2);
    }

    moveActor(actor, newCoords) {

        let oldCoords = actor.coords;
        this.gridActors[oldCoords.y][oldCoords.x] = null;

        actor.move(newCoords);
        this.gridActors[newCoords.y][newCoords.x] = actor;

        this.logMove(actor, newCoords);
    }

    addActor(type, coords) {
        let act = new Actor(type, coords);
        this.actorsDOMElement.appendChild(act.domElement);
        this.actors[act.id] = act;

        this.moveActor(act, coords);

        act.onClick(evt => this.handleActorClick(evt, act));
        return act;
    }

    aiWaspAction() {

        let wasp = randomArrayElement(this.wasps);
        let adjBees = this.adjacentBees(wasp.coords);

        if (adjBees.length > 0 && this.waspsAttacked) {
            let targetBee = randomArrayElement(adjBees);
            this.attackBee(wasp, targetBee);
        } else {

            let candidates = this.adjacentEmptyCellsToBees();
            let coords = randomArrayElement(candidates);

            this.moveActor(wasp, coords);
        }
    }

    removeActor(act) {
        // this.actors.splice(this.actors.indexOf(wasp), 1);
        if (act.type === 'queenWasp' || act.type === 'queenBee')
            this.gameOver();

        delete this.actors[act.id];
        act.removeDOMElement();
        this.logRemove(act);

    }

    die(act) {
        removeActor(act);
    }

    gameOver() {

        let gameFinishedOverlay = document.getElementById('gameFinished');
        gameFinishedOverlay.style.display = "flex";
    }

    /*****
		 *	Execute the attack.
		 *
		 *	@param object att -	The attacker object.
		 *	@param object def -	The defender object.
		 *	@param function callback Callback to be called after attack has finished. 
	******/

    attack(att, def, callback) {
        let l1 = att.prayForLuck();
        let l2 = def.prayForLuck();
       
        let damage = Math.max(0, att.attack * att.prayForLuck() - def.defense * def.prayForLuck());
        def.hp -= damage;
        def.attack -= damage * 0.25;
        def.updateDOMElement();

        this.logAttack(att, def, damage);

        if (def.hp <= 0)
            this.removeActor(def);

        if (callback)
            callback();
    }

    attackWasp(bee, wasp) {

        this.waspsAttacked = true;

        this.attack(bee, wasp);
        this.attack(wasp, bee);

        //this.aiWaspAction();
    }

    attackQueenWasp(bee, wasp) {

        // do attack to the queen
        this.attack(bee, wasp);

        // queen attack back
        this.attack(wasp, bee);

        // every neighbour wasp will attack the aggresor
        this.adjacentWasps(bee.coords).forEach(wasp => {
            this.attack(wasp, bee);
        });
    }

    attackBee(wasp, bee) {
        this.attack(wasp, bee);
    }

    moveBee(bee, coords) {
        this.moveActor(bee, coords);
        this.aiWaspAction();
    }

    handleActorClick(evt, actor) {

        const selAct = this.selectedActor;

        switch (actor.type) {

            case 'bee':

                if (this.selectedActor)
                    this.selectedActor.unselect();
                if (!actor.isSelected)
                    actor.select();
                break;

            case 'wasp':
                if (selAct && this.actorsAreAdjacent(selAct, actor))
                    this.attackWasp(selAct, actor);

                break;

            case 'queenWasp':

                if (selAct && this.actorsAreAdjacent(selAct, actor))
                    this.attackQueenWasp(selAct, actor);

            case 'queenBee':
                break;
        }
    }

    handleEmptyCellClick(evt, coords) {
        let selAct = this.selectedActor;
        if (selAct) {
            this.moveBee(selAct, coords);
        }
    }
}




function round(x, p) {
    let s = Math.pow(10, p);
    return Math.round(x * s) / s;
}

function randomArrayElement(arr) {
    let len = arr.length;
    let ix = Math.floor(Math.random() * len);
    return arr[ix];
}

function vec2(x, y) {
    return { x, y };
}