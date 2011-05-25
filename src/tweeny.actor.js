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
			actorInst = registeredActors[drawList[i]];
			actorInst.draw.call(actorInst.get(), actorInst.context);
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
	function sortArrayNumerically (array) {
		return array.sort(function (a, b) {
			return a - b;
		});
	}
	
	if (!global.tweeny) {
		return;
	}
	
	tweeny = global.tweeny;
	guid = 0;
	registeredActors = {};
	drawList = [];
	contextList = [];
	
	// Start the loop
	updateActors();
	
	function createActorInstance (actorPrototypeProps) {
		var actor;
		
		function Actor () {
			var prop;
			
			for (prop in actorPrototypeProps) {
				if (actorPrototypeProps.hasOwnProperty(prop)) {
					this[prop] = actorPrototypeProps[prop];
				}
			}
			
			return this;
		}
		
		actor = function () {};
		actor.prototype = new Actor();
		
		return new actor();
	}
	
	/**
	 * @param {Object|Function} actorTemplate A Kapi-style actor template
	 * @param {Object} context An HTML 5 canvas object context
	 */
	tweeny.actorCreate = function actorInit (actorTemplate, context) {
		var actorId,
			prototypeProps,
			actorInst,
			tweenController,
			
			// private actor instance vars
			actorState,
			actorData;
		
		actorId = guid++;
		actorState = {};
		actorData = {};
		
		// Normalize the actor template, regardless of whether it was passed as an Object or Function.
		if (actorTemplate.draw) {
			prototypeProps = {
				'draw': actorTemplate.draw,
				'setup': actorTemplate.setup || function () {},
				'teardown': actorTemplate.teardown || function () {}
			};
		} else {
			prototypeProps = {
				'draw': actorTemplate,
				'setup': function () {},
				'teardown': function () {}
			};
		}
		
		prototypeProps.context = context;
		actorInst = createActorInstance(prototypeProps);
		
		if (context) {
			addContext(context);
		}
		
		// Need to store the actor instance internally.  Things that need to be stored:
		//   - Canvas context
		//   - A reference to the actor template
		//   - Arbitrary actor `data`
		registeredActors[actorId] = actorInst;
		

		// Add the actor to the draw list
		actorInst.begin = function begin () {
			drawList.push(actorId);
			sortArrayNumerically(drawList);
		};
			
		// Remove the actor from the draw list
		actorInst.stop = function stop () {
			var i, limit;
			
			limit = drawList.length;
			tweenController.stop();
			
			for (i = 0; i < limit; i++) {
				if (drawList[i] === actorId) {
					drawList.splice(i, 1);
					i = limit;
				}
			}
		};
			
		// Remove the actor completely
		actorInst.destroy = function destroy () {
			actorInst.stop();
			actorInst.teardown.call(actorInst);
			delete registeredActors[actorId];
		};
			
		actorInst.data = function data (newData) {
			if (newData) {
				actorData = newData;
			}
			
			return actorData;
		};
			
		actorInst.get = function () {
			return actorState;
		};
			
		actorInst.tween = function tween (from, to, duration, callback, easing) {
			var normalizedTweenConfigObj,
				step;
			
			function wrappedStepFunc () {
				step();
				actorState = tweenController.get();
			}
			
			if (to) {
				// Tween params were passed as formal params
				step = function () {};
				
				normalizedTweenConfigObj = {
					'step': wrappedStepFunc,
					'from': from,
					'to': to,
					'duration': duration,
					'callback': callback,
					'easing': easing
				};
			} else {
				// Tween params were passed as an Object
				step = from.step || function () {};
				
				normalizedTweenConfigObj = {
					'step': wrappedStepFunc,
					'from': from.from,
					'to': from.to,
					'duration': from.duration,
					'callback': from.callback,
					'easing': from.easing
				};
			}
			
			tweenController = tweeny.tween(normalizedTweenConfigObj);
		};

		//if (tweeny.queue) {
			// Wrap the Tweeny queuing methods here if they are available
		//}
		
		return actorInst;
	};
	
}(this));