
//Shortcuts
const createTag = (tag, id, parent, svgNS) => {
    let el = svgNS ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    el.attr('id', id);
    if(parent){
        parent.appendChild(el);
    }
    return el;
}
     
const getByID = (id) => {
    return document.getElementById(id);
}

const getByClass = (className) => {
    return Array.prototype.slice.call(document.getElementsByClassName(className));
}

const getByTag = (tagName) => {
    return Array.prototype.slice.call(document.getElementsByTagName(tagName));
}

HTMLElement.prototype.attr = function(name, value) {
    if(value === undefined){
        return this.getAttribute(name);
    }
    this.setAttribute(name, value);
};

SVGElement.prototype.attr = function(name, value) {
    if(value === undefined){
        return this.getAttribute(name);
    }
    this.setAttribute(name, value);
};

HTMLElement.prototype.hide = function() {
    this.style.display = 'none';
};

SVGElement.prototype.hide = function() {    
    this.style.display = 'none';
};

HTMLElement.prototype.showInline = function() {
    this.style.display = 'inline';
};

HTMLElement.prototype.show = function() {
    this.style.display = 'block';
};

SVGElement.prototype.show = function() {    
    this.style.display = 'block';
};

SVGElement.prototype.setStyle = function(stroke, fill, thickness) {
    this.attr('stroke', stroke);
    this.attr('fill', fill);
    this.attr('stroke-width', thickness);
};

Array.prototype.last = function() {
    return this.length === 0 ? undefined : this[this.length - 1];
};

//Tools
const NUMS = [ {val : 1000, name : 'K'}, {val : 1000000, name : 'M'}, {val : 1000000000, name : 'B'} ];
const beautifyNum = (num) => {
    for(let j = 0; j < NUMS.length; j++) {
        if(NUMS[j].val > num){
            return ( j == 0 ? num : (num / NUMS[j - 1].val).toFixed(1) + NUMS[j - 1].name );
        }
    }
}

const INTERPOLATION_COEFFICIENT = 2.5;
const interpolateValue = (source, destination) => {
    return source + (destination - source) / INTERPOLATION_COEFFICIENT;
}

const quadIn = (delta, prog) => { return delta * prog * prog; }
const quadOut = (delta, prog) => { return -delta * prog * (prog - 2); }


const FPS = 60;
const tweenToValue = (obj, field, startVal, stopVal, frames, changeHandler, easing = 'in') => {
    obj[field] = startVal;
    let frame = 0;
    let step = (stopVal - startVal) / frames;
    let delta = stopVal - startVal;
    let intervalID = setInterval(() => {
        let progress = frame / frames;
        // obj[field] = startVal + delta * progress * progress;//q-in
        // obj[field] = startVal - delta * progress * (progress - 2);//q-out
        
        obj[field] = startVal + (easing == 'in' ? quadIn(delta, progress) : quadOut(delta, progress));
    
        if(++frame >= frames){
            obj[field] = stopVal;
            clearInterval(intervalID);
        }
        changeHandler && changeHandler(progress);
    }, 1000 / FPS);
    return () => {
        clearInterval(intervalID);
        obj[field] = stopVal;
        changeHandler && changeHandler(1);
    }
}
