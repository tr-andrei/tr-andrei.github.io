    /*****
		 *	Class actor
		 *
		 *	@param string type Type of the acctor (wasp / bee .etc)
	******/
class Actor {

    constructor(type) {

        let skills = StartSkills[type];
        Object.assign(this, skills);

        this.id = ActorID++;
        this.type = type;
        this.coords = vec2(0, 0);
        this.domElement = this.createDOMElement();
        this.isSelected = false;
    }

    createDOMElement() {
        let el = document.createElement('div');
        el.className = 'actor ' + this.className;
        el.innerHTML = this.label + this.id;
        return el;
    }

    removeDOMElement() {
        this.domElement.parentNode.removeChild(this.domElement);
    }

    updateDOMElement() {
        this.domElement.style.opacity = this.hp / 100;
    }

    prayForLuck() {
        return round(Math.random(), 1);
    }

    move(coords) {
        this.coords = coords;

        const { x, y } = coords;
        let el = this.domElement;

        el.style.left = x * el.offsetWidth + 'px';
        el.style.top = y * el.offsetWidth + 'px';
    }

    select() {
        this.isSelected = true;
        this.domElement.classList.add('selected');
    }
    unselect() {
        this.isSelected = false;
        this.domElement.classList.remove('selected');
    }

    onClick(listener) {
        this.domElement.addEventListener('click', listener);
    }

    toString() {
        return this.type + '#' + this.id;
    }
}
