/*global setTimeout:true */

(function (global) {
	var guid,
		registeredActors,
		drawList,
		contextList;
		
	function clearCanvases () {
		var i, context;
		
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
	
	function Twactor (actorTemplate, context) {
		
		/**
		 * @param {Object|Function} actorTemplate A Kapi-style actor template
		 * @param {Object} context An HTML 5 canvas object context
		 */
		var self,
			actorId,
			prop,
			actorInst;
		
		if (!global.Tweenable) {
			return;
		}
		
		self = this;
		this.actorId = guid++;
		this.actorState = {};
		this.actorData = {};

		// Normalize the actor template, regardless of whether it was passed as an Object or Function.
		if (actorTemplate.draw) {
			this.prototypeProps = {
				'draw': actorTemplate.draw,
				'setup': actorTemplate.setup || function () {},
				'teardown': actorTemplate.teardown || function () {}
			};
		} else {
			this.prototypeProps = {
				'draw': actorTemplate,
				'setup': function () {},
				'teardown': function () {}
			};
		}

		for (prop in this.prototypeProps) {
			if (this.prototypeProps.hasOwnProperty(prop)) {
				this[prop] = this.prototypeProps[prop];
			}
		}
		
		this.context = context;
		
		if (this.context) {
			addContext(this.context);
		}

		this.hookAdd('step', function (state) {
			self.actorState = state;
		});

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
			actorInst.stop();
			actorInst.teardown.call(actorInst);
			delete registeredActors[actorId];
		};

		return this;
	}
	
	(function updateActors () {
		var i, limit, actorInst;
		
		clearCanvases();
		limit = drawList.length;
		
		for (i = 0; i < limit; i++) {
			actorInst = drawList[i];
			actorInst.draw.call(actorInst.actorState, actorInst.context);
		}
		
		setTimeout(updateActors, 1000 / Twactor.fps);
	}());
	
	Twactor.fps = 20;
	Twactor.prototype = new global.Tweenable();
	global.Twactor = Twactor;
	
}(this));