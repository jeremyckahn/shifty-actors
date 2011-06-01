/*global setTimeout:true */

(function tweenyActor (global) {
	var tweeny,
		guid,
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
	
	function updateActors () {
		var i, limit, actorInst;
		
		clearCanvases();
		limit = drawList.length;
		
		for (i = 0; i < limit; i++) {
			actorInst = drawList[i];
			actorInst.draw.call(actorInst.actorState, actorInst.context);
		}
		
		setTimeout(updateActors, 1000 / tweeny.fps);
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
	
	tweeny = global.tweeny;
	guid = 0;
	registeredActors = {};
	drawList = [];
	contextList = [];
	
	// Start the loop
	updateActors();
	
	function Twactor (actorTemplate, context) {
		
		/**
		 * @param {Object|Function} actorTemplate A Kapi-style actor template
		 * @param {Object} context An HTML 5 canvas object context
		 */
		var self,
			actorId,
			prop,
			actorInst,
			tweenController;
		
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
		this.start = function begin () {
			drawList.push(self);
			sortActorsById(drawList);
		};

		// Remove the actor from the draw list
		this.end = function stop () {
			var i, limit;

			limit = drawList.length;
			//tweenController.stop();

			for (i = 0; i < limit; i++) {
				if (drawList[i] === actorId) {
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
	
	Twactor.prototype = new global.Tweenable();
	global.Twactor = Twactor;
	
}(this));