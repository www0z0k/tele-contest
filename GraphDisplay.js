class GraphDisplay{
	constructor(x, y, w, h, rootSvg, graphY, legendH, minimapH, data){
		this.X_OFFSET = x;
		this.Y_OFFSET = y;
		this.WIDTH = w;
		this.GRAPH_H = h;

		this.GRAPH_Y = graphY;
		this.LEGEND_H = legendH;
		this.MINIMAP_H = minimapH;

		this.svgRootID = rootSvg;

		this.dataSets = [];
		this.boxes = [];
		this.lines = [];

		this.yLabels = [];
		this.xLabels = [];

		this.modeSwitch = '';
		this.dayMode = true;

		this.initdataSets(data);
	}

	yForIndex (i) {
	    return i * (this.GRAPH_Y + this.GRAPH_H + this.MINIMAP_H + this.LEGEND_H);
	}

	/*LEGEND*/
	drawlinesFor(yOffset, index) {
	    this.lines[index] = this.lines[index] || [];
	    this.yLabels[index] = this.yLabels[index] || [];
	    for (let i = 0; i < 6; i++) {
	    	let yStep = this.GRAPH_H / 5;
	    	let line = createTag('polyline', `guideline-${i}`, getByID(this.svgRootID), true);
	    	line.setStyle('#F2F4F5', '#00000000', 1);//F2F4F5
	    	
	    	line.attr('points', `${this.X_OFFSET},${this.GRAPH_Y + i * yStep + yOffset + this.Y_OFFSET} ${this.X_OFFSET + this.WIDTH},${this.GRAPH_Y + i * yStep + yOffset + this.Y_OFFSET}`);
	        this.lines[index].push(line);

	        let label = createTag('span', '', getByID(this.svgRootID).parentNode);
	        label.innerHTML = '';
	        label.attr('style', `position:absolute;left:${this.X_OFFSET / 2}px;top:${this.GRAPH_Y + i * yStep - 12 + this.yForIndex(index) + this.Y_OFFSET}px;color:#dddddd;font-size:0.7em;`);
	        this.yLabels[index].push(label);
	    }
	}

	cleanupLabels (index) {
	    for (let i = 0; i < this.xLabels[index].length; i++) {
	        this.xLabels[index][i].parentNode && this.xLabels[index][i].parentNode.removeChild(this.xLabels[index][i]);
	    }
	}

	updateGrid (coords, yMax, index) {
	    this.xLabels[index] && this.cleanupLabels(index);
	    this.xLabels[index] = [];
	    let monthMode = coords.length > 56 && coords.length <= 240;
	    let seasonMode = coords.length > 240;
	    let weekMode = !monthMode && !seasonMode;

	    let actualDays = [];
	    coords.map((arg) => { 
	        let d = new Date(arg);
	        if(weekMode && d.getDay() == 0){
	            actualDays.push(d);
	        }else if(monthMode && d.getDate() == 1){
	            actualDays.push(d);
	        }else if(seasonMode && d.getDate() == 1 && 
	                (d.getMonth() == 11 || d.getMonth() == 2 || d.getMonth() == 5 || d.getMonth() == 8)){
	            actualDays.push(d);
	        }
	    });

	    let xStepForlines = (coords.last() - coords[0]) / this.WIDTH;

	    for (let i = 0; i < actualDays.length; i ++) {
	        let date = actualDays[i];
	        let toShow = (seasonMode ? SEASONS[date.getMonth()] : MONTHS[date.getMonth()]) + ' ';
	        toShow += (seasonMode || monthMode
	                    ? '`' + (date.getFullYear() + (seasonMode && date.getMonth() == 11 ? 1 : 0)).toString().substring(2, 4) 
	                    : (date.getDate()));

	        let x = this.X_OFFSET + (date.getTime() - coords[0]) / xStepForlines;

	        let label = createTag('span', '', getByID(this.svgRootID).parentNode);
	        label.innerHTML = toShow;
	        label.attr('style', `position:absolute;left:${x - (seasonMode ? 44 : 22)}px;top:${this.Y_OFFSET + this.yForIndex(index) + this.GRAPH_Y + this.GRAPH_H + 9}px;color:#dddddd;font-size:1em;`);

	        this.xLabels[index].push(label);
	    }
	    this.yLabels[index] && this.updateYlinesLegend(yMax, index);
	}

	updateYlinesLegend (yMax, index) {
	    this.yLabels[index].map((arg, i) => { arg.innerHTML = beautifyNum((this.yLabels[index].length - 1 - i) * yMax); });
	}

	initdataSets(input){
	    let itemH = this.yForIndex(1);
	    getByID(this.svgRootID).attr('width', `${this.WIDTH + this.X_OFFSET + 7}px`);
	    getByID(this.svgRootID).attr('height', `${this.Y_OFFSET + itemH * input.length + this.LEGEND_H}px`);
	    getByID(this.svgRootID).attr('viewBox', `0 0 ${this.WIDTH + this.X_OFFSET} ${this.Y_OFFSET + itemH * input.length + this.LEGEND_H}`);
	    
	    // getByID('bg').attr('this.WIDTH', `${this.WIDTH + this.X_OFFSET + 7}px`);
	    // getByID('bg').attr('height', `${itemH * input.length + this.LEGEND_H}px`);

	    for (let i = 0; i < input.length; i++) {
	        this.drawlinesFor(itemH * i, i);
	        let header = createTag('h3', '', getByID(this.svgRootID).parentNode);
	        header.innerHTML = 'Caption for # ' + i;
	        header.attr('style', `position:absolute;left:${this.X_OFFSET + 40}px;top:${this.Y_OFFSET + this.yForIndex(i)}px;`);

	        this.dataSets.push(new Graph(input[i], i, getByID(this.svgRootID),
	                        this.X_OFFSET, this.Y_OFFSET + this.GRAPH_Y + itemH * i, this.WIDTH, this.GRAPH_H, this.LEGEND_H, this.MINIMAP_H, 
	                        this.updateYlinesLegend.bind(this)));
	        this.boxes.push(new Box(this.svgRootID, i, this.handleSelectionChange.bind(this), this.X_OFFSET, this.X_OFFSET + this.WIDTH, 40, this.X_OFFSET, this.Y_OFFSET + this.GRAPH_Y + this.GRAPH_H + this.LEGEND_H + itemH * i, this.WIDTH, this.MINIMAP_H));
	        
	        this.updateGrid(this.dataSets[i].getXRange(), this.dataSets[i].getMaxY(), i);

	    }

	    this.modeSwitch = createTag('span', `mode-switch`, getByID(this.svgRootID).parentNode);
	    this.modeSwitch.innerHTML = TO_NIGHT_CAPTION;
	    this.modeSwitch.attr('style', `position:absolute;left:${this.X_OFFSET + 165}px;top:${this.Y_OFFSET + itemH * input.length + 16}px;cursor:pointer;color:rgb(0,0,238);font-size:1.2em;`);
	    this.modeSwitch.onclick = this.toggleMode.bind(this);
	}

	toggleMode(){
	    this.dayMode = !this.dayMode;
	    this.modeSwitch.innerHTML = this.dayMode ? TO_NIGHT_CAPTION : TO_DAY_CAPTION;
	    this.boxes.map((box) => {box.setColors(this.dayMode ? '#ffffff66' : '#212F3E55')});
	    getByID(this.svgRootID).parentNode.style['background-color'] = this.dayMode ? '#ffffff' : '#212F3E';
	    // getByID('bg').attr('fill', dayMode ? '#ffffff' : '#212F3E');
	    this.dataSets.map((graph) => {graph.setColors((this.dayMode ? '#ffffff' : '#212F3E'), (this.dayMode ? '#000000' : '#F2F4F5'))});
	    getByTag('h3').map((el) => {el.style.color = (this.dayMode ? '#000000' : '#dddddd')});    
	}

	/*MINIMAP NAV*/
	handleSelectionChange(key, obj) {
		//might check key here if several this.boxes are used
		for (let i = 0; i < this.dataSets.length; i++) {
			if(i == key){
				this.dataSets[i].drawRange(obj.start, obj.length);
	            this.updateGrid(this.dataSets[i].getXRange(), this.dataSets[i].getMaxY(), i);
			}
		}
	}
}




