class Box {
    constructor(idKey = 'main', suffix = 'mygraph', cb = null, left = 30, right = 400, minWidth = 10, x = 30, y = 30, w = 370, h = 50){
        this.idKey = idKey;
        this.suffix = suffix;
        this.BOX_LEFT = left;
        this.BOX_RIGHT = right;
        this.MIN_BOX_WIDTH = minWidth;

        this.DRAG_ALL = 'drag all';
        this.DRAG_LEFT = 'drag left';
        this.DRAG_RIGHT = 'drag right';

        this.dragMode = '';
        this.dragX = 0;
        this.rightEdge = 0;
        this.leftEdge = 0;

        this.dragBox = {x : x, y : y, w : w, h : h};

        this.initBox();
        this.setColors('#ffffff');
        this.updateBox();

        this.handleDragMove = this.handleDragMove.bind(this);
        this.stopDrag = this.stopDrag.bind(this);

        this.targetX = x;
        this.targetW = w;

        this.prevTouch = {x: 0, y: 0};

        this.selectionChangeHandler = cb;
    }

    // updateWidth (updatedValue) {
    //     this.BOX_RIGHT = updatedValue - this.BOX_LEFT;
    // }

    customizeID (id) {
        return id + '-' + this.suffix + this.idKey;
    }

    getMain () {
        return getByID(this.idKey);
    }

    getItem (key) {
        return getByID(this.customizeID(key));
    }

    initBox () {
        let main = this.getMain();

        createTag('path', this.customizeID('box-fader'), main, true);
        createTag('rect', this.customizeID('box-inner'), main, true);
        createTag('polyline', this.customizeID('box-top'), main, true);
        createTag('polyline', this.customizeID('box-bottom'), main, true);
        createTag('polyline', this.customizeID('box-left'), main, true);
        createTag('polyline', this.customizeID('box-right'), main, true);

        main.addEventListener('click', this.initialMouseHandler.bind(this));
        main.addEventListener('mousemove', (evt) => {if(evt.buttons) this.initialMouseHandler(evt)});
        main.addEventListener('touchmove', (evt) => { this.initialMouseHandler(evt); });
        main.addEventListener('touchstart', (evt) => { 
          this.prevTouch.x = evt.touches[0].clientX;
          this.prevTouch.y = evt.touches[0].clientY;
        });

        document.body.addEventListener('mouseup', (evt) => { this.stopDrag() });
        document.body.addEventListener('mousemove', (evt) => { if(!evt.buttons) this.stopDrag() });
        document.body.addEventListener('touchend', (evt) => { this.stopDrag() });
    }

    initialMouseHandler (evt) {
        let eventX = (evt.touches ? evt.touches[0].clientX : evt.clientX) - this.getMain().getBoundingClientRect().left;
        let eventY = (evt.touches ? evt.touches[0].clientY : evt.clientY) - this.getMain().getBoundingClientRect().top;

        // let horizontal = true;
        if(evt.touches){
          // if(Math.abs(this.prevTouch.x - evt.touches[0].clientX) < Math.abs(this.prevTouch.y - evt.touches[0].clientY)){
            // horizontal = false;
          // }
          this.prevTouch.x = evt.touches[0].clientX;
          this.prevTouch.y = evt.touches[0].clientY;
        }

        let left = this.dragBox.x;
        let top = this.dragBox.y;
        let right = this.dragBox.x + this.dragBox.w;
        let bottom = this.dragBox.h + this.dragBox.y;

        if(!this.dragMode && eventY > top && eventY < bottom){
            //y-match
            if(eventX > left - 10 && eventX < left + 10){
                this.startDrag(this.DRAG_LEFT, evt);
            }else if(eventX > right - 10 && eventX < right + 10){
                this.startDrag(this.DRAG_RIGHT, evt);
            }else if(eventX > left && eventX < right){
                this.startDrag(this.DRAG_ALL, evt);
            }
        }
    }

    startDrag (mode, evt) {
        this.dragMode = mode;
        this.stopTweenX && this.stopTweenX();
        this.stopTweenW && this.stopTweenW();

        let eventX = (evt.touches ? evt.touches[0].clientX : evt.clientX) - this.getMain().getBoundingClientRect().left;

        this.dragX = eventX - this.dragBox.x;
        this.leftEdge = this.dragBox.x;
        this.rightEdge = this.dragBox.x + this.dragBox.w;
        this.getMain().addEventListener('mousemove', this.handleDragMove);
        this.getMain().addEventListener('touchmove', this.handleDragMove);
    }

    stopDrag () {
        this.dragMode = '';
        this.getMain().removeEventListener('mousemove', this.handleDragMove);
        this.getMain().removeEventListener('touchmove', this.handleDragMove);
        if(this.targetX != this.dragBox.x){
            this.stopTweenX = tweenToValue(this.dragBox, 'x', this.dragBox.x, this.targetX, 5, this.updateBox.bind(this), 'out');
        }
        if(this.targetW != this.dragBox.w){
            this.stopTweenW = tweenToValue(this.dragBox, 'w', this.dragBox.w, this.targetW, 5, this.updateBox.bind(this), 'out');
        }
    }

    setColors (faderColor) {
        this.getItem('box-fader').attr('fill', faderColor);        
        this.getItem('box-inner').attr('fill', '#eeffee');
        this.getItem('box-fader').attr('fill-opacity', 0.3);
        this.getItem('box-inner').attr('fill-opacity', 0);
        
        this.getItem('box-top').setStyle('#DD6699', '#00000000', 1);
        this.getItem('box-bottom').setStyle('#DD6699', '#00000000', 1);
        this.getItem('box-left').setStyle('#DD6699', '#00000000', 5);
        this.getItem('box-right').setStyle('#DD6699', '#00000000', 5);
        
        this.getItem('box-top').attr('fill-opacity', 0);
        this.getItem('box-bottom').attr('fill-opacity', 0);
        this.getItem('box-left').attr('fill-opacity', 0);
        this.getItem('box-right').attr('fill-opacity', 0);

        this.getItem('box-top').attr('stroke-opacity', 0.5);
        this.getItem('box-bottom').attr('stroke-opacity', 0.5);
        this.getItem('box-left').attr('stroke-opacity', 0.5);
        this.getItem('box-right').attr('stroke-opacity', 0.5);

        
        this.getItem('box-inner').attr('class', 'pointer');
        this.getItem('box-left').attr('class', 'pointer');
        this.getItem('box-right').attr('class', 'pointer');
    }

    updateBox () {
        let x = this.dragBox.x;
        let y = this.dragBox.y;
        let w = this.dragBox.w;
        let h = this.dragBox.h;

        let inner = this.getItem('box-inner');              

        inner.attr('x', x);
        inner.attr('y', y);
        inner.attr('width', w);
        inner.attr('height', h);

        this.getItem('box-top').attr('points', `${x},${y} ${x + w},${y}`);
        this.getItem('box-bottom').attr('points', `${x},${y + h} ${x + w},${y + h}`);
        this.getItem('box-left').attr('points', `${x},${y - 1} ${x},${y + h + 1}`);
        this.getItem('box-right').attr('points', `${x + w},${y - 1} ${x + w},${y + h + 1}`);

        this.getItem('box-fader').attr('d', `M${this.BOX_LEFT} ${y} L${x} ${y} L${x} ${y + h} L${this.BOX_LEFT} ${y + h} M${x + w} ${y} L${this.BOX_RIGHT} ${y} L${this.BOX_RIGHT} ${y + h} L${x + w} ${y + h} Z`);

        let fullWidth = this.BOX_RIGHT - this.BOX_LEFT;
        let startSection = (this.dragBox.x - this.BOX_LEFT) / fullWidth;
        let selectedPart = this.dragBox.w / fullWidth;

        this.selectionChangeHandler && this.selectionChangeHandler(
                                                                    this.suffix, 
                                                                    {
                                                                        start : startSection,
                                                                        length : selectedPart
                                                                    });
    }


    reset () {
        this.dragBox.x = this.BOX_LEFT;
        this.dragBox.w = this.BOX_RIGHT - this.BOX_LEFT;
        this.stopTweenX && this.stopTweenX();
        this.stopTweenW && this.stopTweenW();
        this.updateBox();
    }

    handleDragMove (evt) {
        let oldX = this.dragBox.x;
        let oldW = this.dragBox.w;
        if(evt.touches){
            evt.preventDefault();
        }
        let eventX = (evt.touches ? evt.touches[0].clientX : evt.clientX) - this.getMain().getBoundingClientRect().left;
        switch(this.dragMode){
            case this.DRAG_ALL:
                this.dragBox.x = eventX - this.dragX;

                this.dragBox.x = this.dragBox.x < this.BOX_LEFT ? this.BOX_LEFT : this.dragBox.x;
                this.dragBox.x = this.dragBox.x + this.dragBox.w > this.BOX_RIGHT ? this.BOX_RIGHT - this.dragBox.w : this.dragBox.x;
            break;
            case this.DRAG_RIGHT:
                this.dragBox.w = eventX - this.dragBox.x;

                this.dragBox.w = this.dragBox.x + this.dragBox.w > this.BOX_RIGHT ? this.BOX_RIGHT - this.dragBox.x : this.dragBox.w;    
                
                this.dragBox.w = this.dragBox.w < this.MIN_BOX_WIDTH ? this.MIN_BOX_WIDTH : this.dragBox.w;
            break;
            case this.DRAG_LEFT:
                this.dragBox.x = eventX;
                this.dragBox.w = this.rightEdge - this.dragBox.x;

                this.dragBox.w = this.dragBox.w < this.MIN_BOX_WIDTH ? this.MIN_BOX_WIDTH : this.dragBox.w;
                this.dragBox.x = this.dragBox.x < this.BOX_LEFT ? this.BOX_LEFT : 
                    (this.dragBox.x + this.dragBox.w > this.rightEdge ? this.rightEdge - this.dragBox.w : this.dragBox.x);
                
                this.dragBox.w = this.dragBox.x + this.dragBox.w > this.rightEdge ? this.rightEdge - this.dragBox.x : this.dragBox.w;
            break;        
        }

        this.targetX = this.dragBox.x;
        this.targetW = this.dragBox.w;

        if(!isNaN(oldX) && !isNaN(oldW)){
            this.dragBox.x = interpolateValue(oldX, this.dragBox.x);
            this.dragBox.w = interpolateValue(oldW, this.dragBox.w);
        }

        this.updateBox();
    }
}