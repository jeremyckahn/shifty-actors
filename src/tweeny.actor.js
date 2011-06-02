/*global setTimeout:true */

(function (global) {
	var guid,
		registeredActors,
		drawList,
		contextList;
		
	function clearCanvases () {
		var i, 
			context;
		
		for (i = 0; i < contextList.length; i++) {
			context = contextList[i];
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		}
	}	
	
	function addContext (context) {
		var i;
		
		for (i = 0; i < contextList.length; i++) {
			if (contextList[i] === context) {
				return;
			}
		}
		
		contextList.push(context);
	}
	
	/**
	 * Sorts an array numerically, from smallest to largest.
	 * @param {Array} array The Array to sort.
	 * @returns {Array} The sorted Array.
	 */
	function sortActorsById (array) {
		return array.sort(function (a, b) {
			return a.actorId - b.actorId;
		});
	}
	
	guid = 0;
	registeredActors = {};
	drawList = [];
	contextList = [];
	
	function Actor (actorTemplate, context) {
		/**
		 * @param {Object|Function} actorTemplate A Kapi-style actor template
		 * @param {Object} context An HTML 5 canvas object context
		 */
		var self,
			prop;
		
		if (!global.Tweenable) {
			return;
		}
		
		/*this.prototype = new global.Tweenable();
		
		for (prop in this.prototype) {
			if (this.prototype.hasOwnProperty(prop)) {
				this[prop] = this.prototype[prop];
			}
		}*/
		
		self = this;
		this.actorId = guid++;
		this.actorState = {};
		this.actorData = {};

		// Normalize the actor template, regardless of whether it was passed as an Object or Function.
		if (actorTemplate.draw) {
			this.templateProps = {
				'draw': actorTemplate.draw,
				'setup': actorTemplate.setup || function () {},
				'teardown': actorTemplate.teardown || function () {}
			};
		} else {
			this.templateProps = {
				'draw': actorTemplate,
				'setup': function () {},
				'teardown': function () {}
			};
		}

		for (prop in this.templateProps) {
			if (this.templateProps.hasOwnProperty(prop)) {
				this[prop] = this.templateProps[prop];
			}
		}
		
		this.context = context;
		
		if (this.context) {
			addContext(this.context);
		}

		// Add the actor to the draw list
		this.stage = function begin () {
			drawList.push(self);
			sortActorsById(drawList);
		};

		// Remove the actor from the draw list
		this.unstage = function stop () {
			var i, 
				limit;

			limit = drawList.length;
			this._tweenParams.tweenController.stop();

			for (i = 0; i < limit; i++) {
				if (drawList[i] === this) {
					drawList.splice(i, 1);
					i = limit;
				}
			}
		};

		// Remove the actor completely
		this.destroy = function destroy () {
			this._tweenParams.tweenController.stop();
			this.unstage();
			this.teardown.call(this);
			delete registeredActors[this.actorId];
		};

		return this;
	}
	
	function Twactor (actorTemplate, context) {
		var inst;
		
		inst = Actor;
		inst.prototype = new global.Tweenable();
		return new inst(actorTemplate, context);
	}
	
	Twactor.fps = 20;
	
	(function updateActors () {
		var i, 
			limit, 
			actorInst;
		
		clearCanvases();
		limit = drawList.length;
		
		for (i = 0; i < limit; i++) {
			actorInst = drawList[i];
			actorInst.draw.call(actorInst._state.current, actorInst.context);
		}
		
		setTimeout(updateActors, 1000 / Twactor.fps);
	}());
	
	global.Twactor = Twactor;
	
}(this));