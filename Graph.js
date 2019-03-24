class Graph {
	constructor(data, key, rootNode, xOffset, graphY, width, graphH, legendH, minimapH, cb = null){
    this.X_OFFSET = xOffset;
    this.GRAPH_Y = graphY;
    this.WIDTH = width;
    this.GRAPH_H = graphH;

    this.LEGEND_H = legendH;
    this.MINIMAP_H = minimapH;

    this.MODE_DAYS = 'days';
    this.MODE_HOURS = 'hours';
    this.MODE_MINS = 'mins';
    this.MODE_SECS = 'secs';
    this.MODE_NONE_PREDEFINED = 'non-predefined';

    this.changeHandler = cb;

		this.key = key;
    this.main = rootNode;

    this.start = 0;
    this.length = 1;

    this.dotColor = '#FFFFFF';
    this.textColor = '#000000';

    this.visible = true;

    this.xID = data.columns[0][0];
    this.xCoords = data.columns[0].slice(1);
    this.visibleXCoords = [];
    this.zeroX = this.xCoords[0];
    this.deltaX = this.xCoords[this.xCoords.length - 1] - this.zeroX;

    this.types = data.types;
    this.names = data.names;
    this.colors = data.colors;

    this.timeStep = (this.xCoords[1] - this.xCoords[0]) / 1000;
    this.timeMode = this.timeStep == 86400 ? this.MODE_DAYS :
                      this.timeStep == 3600 ? this.MODE_HOURS : 
                      this.timeStep == 60 ? this.MODE_MINS : 
                      this.timeStep == 1 ? this.MODE_SECS : this.MODE_NONE_PREDEFINED;

    this.yValues = {};

    this.descData = {};
    this.totalMinY = 0;
    this.totalMaxY = 0;

    for (let i = 1; i < data.columns.length; i++) {
      let id = data.columns[i][0];
      this.yValues[id] = {};
      this.yValues[id].data = data.columns[i].slice(1);
      this.yValues[id].min = 0;
      this.yValues[id].max = 0;

      this.yValues[id].visible = true;
      this.yValues[id].mini = createTag('polyline', `mini-${id}-${key}`, this.main, true);
      this.yValues[id].full = createTag('polyline', `full-${id}-${key}`, this.main, true);
      this.yValues[id].dot = createTag('circle', `dot-${id}-${key}`, this.main, true);

      this.yValues[id].mini.setStyle(this.colors[id], '#00000000', 1);
      this.yValues[id].full.setStyle(this.colors[id], '#00000000', 1);
      this.yValues[id].mini.attr('fill-opacity', 0);
      this.yValues[id].full.attr('fill-opacity', 0);

      this.yValues[id].data.map((arg) => {
        this.yValues[id].max = Math.max(this.yValues[id].max, arg);
        this.yValues[id].min = Math.min(this.yValues[id].min, arg);
      });

      this.descData[id] = {
        id : id,
        name : this.names[id],
        color : this.colors[id]
      }

      this.totalMaxY = Math.max(this.totalMaxY, this.yValues[id].max);
      this.totalMinY = Math.min(this.totalMinY, this.yValues[id].min);
    }

    this.newYMax = this.totalMaxY;

    this.validate = this.validate.bind(this);


    let outer = createTag('span', `outer-box-${this.key}`, this.main.parentNode);
    outer.attr('class', `w100`);
    outer.attr('style', `position:absolute;left:${this.X_OFFSET + 25}px;top:${this.GRAPH_Y + this.GRAPH_H + this.LEGEND_H/3 + 10}px;`);

    let i = 0;
    for (let id in this.yValues) {
      this.drawGraph(id, true, true);
      this.drawGraph(id, false, true);

      let span = createTag('span', `outer-${id}-${this.key}`, outer);
      span.attr('class', `for-${this.key}`);
      span.attr('style', `margin-left:7px;border-radius:15px;border:1px solid #c0c0c0;cursor:pointer;padding:2px;`);

      let box = createTag('input', `for-${id}-${this.key}`, span);
      box.attr('type', `checkbox`);
      box.attr('style', `background-color:${this.colors[id]}`);
      box.attr('class', `checkbox-round box-${this.key}`);
      box.attr('data-id', `${id}`);
      box.checked = true;

      let label = createTag('label', `label-${id}-${this.key}`, span);
      label.attr('style', `padding:10px;color:${this.colors[id]}`);
      label.attr('for', `for-${id}-${this.key}`);
      label.innerHTML = this.names[id];
      ++i;

      box.addEventListener('change', this.validate);
    }

    this.lineColor = '#F2F4F5';
    
    this.verticalAccent = createTag('polyline', `vertical-${key}`, this.main, true);
    this.verticalAccent.setStyle(this.lineColor, '#00000000', 1);
    
    this.accentLabel = createTag('span', `vertical-data-${key}`, this.main.parentNode);
    this.accentLabel.attr('class', 'accent-label');
    this.accentLabel.style['background-color'] = this.dotColor;
    this.accentLabel.style['color'] = this.textColor;

    this.hideValueHL();

    for (let id in this.yValues) {
      this.yValues[id].dot = createTag('circle', `dot-${id}-${key}`, this.main, true);
      this.yValues[id].dot.setStyle(this.colors[id], this.dotColor, 2);
    }

    this.prevTouch = {x: 0, y: 0};

    this.main.addEventListener('click', this.highlightValues.bind(this));
    this.main.addEventListener('mousemove', (evt) => {if(evt.buttons)this.highlightValues(evt)});
    this.main.addEventListener('touchmove', (evt) => { this.highlightValues(evt); });
    this.main.addEventListener('touchstart', (evt) => { 
      this.prevTouch.x = evt.touches[0].clientX;
      this.prevTouch.y = evt.touches[0].clientY;
    });

  }

  hide(){
    this.visible = false;
    for (let id in this.yValues) {
      this.yValues[id].mini.hide();
      this.yValues[id].full.hide();
    }
    this.hideValueHL();
    getByClass(`for-${this.key}`).map((el) => {el.hide();});
  }

  show(){
    this.visible = true;
    for (let id in this.yValues) {
      this.yValues[id].mini.show();
      this.yValues[id].full.show();
    }    
    getByClass(`for-${this.key}`).map((el) => {el.showInline();});
  }

  hideValueHL(){
    this.verticalAccent.hide();
    this.accentLabel.hide();
    for(let id in this.yValues){
      this.yValues[id].dot.hide();
    }
  }

  setColors(dotColor, textColor){
    this.dotColor = dotColor;
    this.textColor = textColor;
    this.accentLabel.style['background-color'] = this.dotColor;
    this.accentLabel.style['color'] = this.textColor;
    for(let id in this.yValues){
      this.yValues[id].dot.attr('fill', dotColor);
    }
  }

  highlightValues(evt) {
    let eventX = (evt.touches ? evt.touches[0].clientX : evt.clientX) - this.main.getBoundingClientRect().left;
    let eventY = (evt.touches ? evt.touches[0].clientY : evt.clientY) - this.main.getBoundingClientRect().top;

    let horizontal = true;
    if(evt.touches){
      if(Math.abs(this.prevTouch.x - evt.touches[0].clientX) < Math.abs(this.prevTouch.y - evt.touches[0].clientY)){
        horizontal = false;
      }
      this.prevTouch.x = evt.touches[0].clientX;
      this.prevTouch.y = evt.touches[0].clientY;
    }

    if(!this.visible 
      || !horizontal
      || eventY < this.GRAPH_Y
      || eventY > this.GRAPH_Y + this.GRAPH_H
      || eventX > this.X_OFFSET + this.WIDTH
      || eventX < this.X_OFFSET){
      return;
    }

    evt.preventDefault();
    let posInRange = (eventX - this.X_OFFSET) / this.WIDTH;

    let startY = this.GRAPH_Y;
    let stopY = this.GRAPH_Y + this.GRAPH_H;

    let startIndex = Math.floor(this.xCoords.length * this.start);
    let len = Math.ceil(this.xCoords.length * this.length);

    let currYVals = [];

    let j = Math.floor(len * posInRange) + startIndex;
    let x = this.X_OFFSET + (this.xCoords[j] - this.xCoords[startIndex]) / this.xValuesPerPixel();
    for(let id in this.yValues){
      if(this.yValues[id].visible){
        let y = stopY - this.yValues[id].data[j] / this.yValuesPerPixel();//invert y here
        if(!isNaN(x) && !isNaN(y)){
          this.yValues[id].dot.show();
          this.yValues[id].dot.attr('r', 3.5);
          this.yValues[id].dot.attr('cx', x);
          this.yValues[id].dot.attr('cy', y);
          currYVals.push({
            id: id,
            val: this.yValues[id].data[j],
            color: this.colors[id]
          });
        }
      }
    } 
    if(currYVals.length){
      this.accentLabel.show();
      let date = new Date(this.xCoords[j]);
      this.accentLabel.innerHTML = `${WEEK_DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;

      let table = createTag('table', '', this.accentLabel);
      let tHead = createTag('tr', '', table);
      let tBody = createTag('tr', '', table);
      for (let i = 0; i < currYVals.length; i++) {
        let h = createTag('td', '', tHead);
        h.innerHTML = '<strong>' + currYVals[i].val + '</strong>';
        h.style.color = currYVals[i].color;
        
        let b = createTag('td', '', tBody);
        b.innerHTML = currYVals[i].id;
        b.style.color = currYVals[i].color;
      }
      this.accentLabel.attr('style', `position: absolute;height: 65px;border-radius: 5px;border: 1px solid #F2F4F5;left:${this.X_OFFSET + this.WIDTH * posInRange - this.accentLabel.getBoundingClientRect().width * posInRange * 0.9}px;top:${this.GRAPH_Y - 40}px;color:${this.textColor};background-color:${this.dotColor}`);
      
      this.verticalAccent.show();
      this.verticalAccent.attr('points', `${x},${this.GRAPH_Y} ${x},${this.GRAPH_Y + this.GRAPH_H}`);
    }
  }

  xValuesPerPixel(){
    return this.length * this.deltaX / this.WIDTH;
  }

  yValuesPerPixel(mini){
    return (this.totalMaxY - this.totalMinY) / (mini ? this.MINIMAP_H : this.GRAPH_H);
  }

  getIDs(){
    return this.descData;
  }

  getMaxY () {
    return this.totalMaxY;
  }

  getXRange () {
    return this.visibleXCoords;
  }

  drawRange(start, length){
    this.stopTween && this.stopTween();
    this.start = start;
    this.length = length;
    
    this.updateYMax();

    for (let id in this.yValues) {
      if(this.yValues[id].visible){
        this.drawGraph(id, false);
      }
    }
    this.hideValueHL();
    // this.updateYMax();
    if(this.newYMax != this.totalMaxY){
      this.stopTween = tweenToValue(this, 'totalMaxY', this.totalMaxY, this.newYMax, 5, (() => {
        for (let id in this.yValues) {
          if(this.yValues[id].visible){
            this.drawGraph(id, false);
          }
        }
      }).bind(this), 'out');
    }
  }

  updateYMax(){
    // this.oldYMax = this.totalMaxY;
    this.newYMax = 0;
    let startI = Math.floor(this.xCoords.length * this.start);
    startI = startI == 0 ? 0 : startI - 1;
    let len = Math.ceil(this.xCoords.length * this.length) + startI + 2;
    for (let id in this.yValues) {
      if(this.yValues[id].visible){        
        this.yValues[id].data.slice(startI, len).map((arg) => { this.newYMax = Math.max(this.newYMax, arg); });
      }
    }
  }

  validate(){
    this.stopTween && this.stopTween();

    let shownID = '';
    getByClass(`box-${this.key}`).map((arg) => {
      let id = arg.attr('data-id');
      if(arg.checked){
        this.yValues[id].full.show();
        this.yValues[id].mini.show();
        arg.attr('style', `background-color:${this.colors[id]}`);
        if(!this.yValues[id].visible){
          shownID = id;
        }
        this.yValues[id].visible = true;
      }else{
        this.yValues[id].full.hide();
        this.yValues[id].mini.hide();
        arg.attr('style', `background-color:#c0c0c0`);
        this.yValues[id].visible = false;
      }
    });

    this.updateYMax();

    for (let id in this.yValues) {
      if(this.yValues[id].visible){
        this.drawGraph(id, false);   
        this.drawGraph(id, true);
      }
    }
    this.hideValueHL();

    if(this.newYMax != this.totalMaxY){
      this.stopTween = tweenToValue(this, 'totalMaxY', this.totalMaxY, this.newYMax, 5, ((progress) => {
        for (let id in this.yValues) {
          if(this.yValues[id].visible){
            this.drawGraph(id, false);
            this.drawGraph(id, true);
          }
          if(id == shownID){
            let opacity = progress;
            this.yValues[id].mini.attr('opacity', opacity);
            this.yValues[id].full.attr('opacity', opacity);
          }
        }
      }).bind(this), 'out');
    }
  }

  drawGraph(id, mini, silentMode){
    this.visibleXCoords = [];
    //TODO pass all global values for better reusability
    let startY = mini ? this.GRAPH_Y + this.GRAPH_H + this.LEGEND_H : this.GRAPH_Y;
    let stopY = mini ? this.GRAPH_Y + this.GRAPH_H + this.LEGEND_H + this.MINIMAP_H : this.GRAPH_Y + this.GRAPH_H;

    let startIndex = Math.floor(this.xCoords.length * this.start);
    let len = Math.ceil(this.xCoords.length * this.length);
    len += len < this.xCoords.length ? 1 : 0;

    let points = [];
    for (let j = startIndex; j < startIndex + len; j++) {
      let currentXProgress = (this.xCoords[j] - this.zeroX) / this.deltaX;
      if(currentXProgress < this.start){
        continue;
      }
      let x = this.X_OFFSET + (this.xCoords[j] - this.xCoords[startIndex]) / this.xValuesPerPixel(mini);
      let y = stopY - this.yValues[id].data[j] / this.yValuesPerPixel(mini);//invert y here
      if(!isNaN(x) && !isNaN(y)){
        points.push(x + ',' + y);
        this.visibleXCoords.push(this.xCoords[j]);
      }

      if(currentXProgress > this.start + this.length){
        break;
      }
    }
    let line = mini ? this.yValues[id].mini : this.yValues[id].full;
    line.attr('points', points.join(' '));

    (!silentMode && this.changeHandler) && this.changeHandler(this.totalMaxY, this.key);
  }
}
/*
	"columns": [
		[],
		[],
		[]
	],
    "types": {
      "y0": "line",
      "y1": "line",
      "x": "x"
    },
    "names": {
      "y0": "#0",
      "y1": "#1"
    },
    "colors": {
      "y0": "#3DC23F",
      "y1": "#F34C44"
    }
  },
*/