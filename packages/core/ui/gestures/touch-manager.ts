/**
 * Provides various helpers for adding easy touch handling animations.
 * Use when needing to implement more interactivity with your UI regarding touch down/up behavior.
 */
import { GestureEventData, GestureEventDataWithState, TouchGestureEventData } from '.';
import { Animation } from '../animation';
import { AnimationDefinition } from '../animation/animation-interfaces';
import { View } from '../core/view';
import { isObject, isFunction } from '../../utils/types';
import { GestureEvents, GestureStateTypes, GestureTypes } from './gestures-common';

export type TouchAnimationFn = (view: View) => void;
export type TouchAnimationOptions = {
	up?: TouchAnimationFn | AnimationDefinition;
	down?: TouchAnimationFn | AnimationDefinition;
};
export enum TouchAnimationTypes {
	up = 'up',
	down = 'down',
}

/**
 * Manage interactivity in your apps easily with TouchManager.
 * Store reusable down/up animation settings for touches as well as optionally enable automatic tap (down/up) animations for your app.
 */
export class TouchManager {
	/**
	 * Enable animations for all tap bindings in the UI.
	 */
	static enableGlobalTapAnimations: boolean;
	/**
	 * Define reusable touch animations to use on views with touchAnimation defined or with enableGlobalTapAnimations on.
	 */
	static animations: TouchAnimationOptions;
	/**
	 * Native Touch handlers (iOS only) registered with the view through the TouchManager.
	 * The TouchManager uses this internally but makes public for other versatility if needed.
	 */
	static touchHandlers: Array<{ view: View; handler: any /* UIGestureRecognizer */ }>;
	/**
	 * When using NativeScript AnimationDefinition's for touch animations this will contain any instances for finer grain control of starting/stopping under various circumstances.
	 * The TouchManager uses this internally but makes public for other versatility if needed.
	 */
	static touchAnimationDefinitions: Array<{ view: View; animation: Animation; type: TouchAnimationTypes }>;
	/**
	 * The TouchManager uses this internally.
	 * Adds touch animations to view based upon it's touchAnimation property or TouchManager.animations.
	 * @param view NativeScript view instance
	 */
	static addAnimations(view: View) {
		// console.log("tapHandler:", tapHandler);
		const handleDown = (view?.touchAnimation && (<TouchAnimationOptions>view?.touchAnimation).down) || (TouchManager.animations && TouchManager.animations.down);
		const handleUp = (view?.touchAnimation && (<TouchAnimationOptions>view?.touchAnimation).up) || (TouchManager.animations && TouchManager.animations.up);

		if (global.isIOS) {
			if (view?.ios?.addTargetActionForControlEvents) {
				// can use UIControlEvents
				// console.log('added UIControlEvents!');
				if (!TouchManager.touchHandlers) {
					TouchManager.touchHandlers = [];
				}
				TouchManager.touchHandlers.push({
					view,
					handler: TouchControlHandler.initWithOwner(new WeakRef(view)),
				});

				if (handleDown) {
					(<UIControl>view.ios).addTargetActionForControlEvents(TouchManager.touchHandlers[TouchManager.touchHandlers.length - 1].handler, GestureEvents.touchDown, UIControlEvents.TouchDown | UIControlEvents.TouchDragEnter);
					view.on(GestureEvents.touchDown, (args) => {
						// console.log('touchDown {N} event');
						TouchManager.startAnimationForType(view, TouchAnimationTypes.down);
					});
				}
				if (handleUp) {
					(<UIControl>view.ios).addTargetActionForControlEvents(TouchManager.touchHandlers[TouchManager.touchHandlers.length - 1].handler, GestureEvents.touchUp, UIControlEvents.TouchDragExit | UIControlEvents.TouchCancel | UIControlEvents.TouchUpInside | UIControlEvents.TouchUpOutside);
					view.on(GestureEvents.touchUp, (args) => {
						// console.log('touchUp {N} event');
						TouchManager.startAnimationForType(view, TouchAnimationTypes.up);
					});
				}
			} else {
				// console.log('added longPress to:', view.id);

				if (handleDown || handleUp) {
					view.on(GestureEvents.gestureAttached, (args: GestureEventData) => {
						if (args.type === GestureTypes.longPress) {
							(<UILongPressGestureRecognizer>args.ios).minimumPressDuration = 0;
						}
					});
					view.on(GestureTypes.longPress, (args: GestureEventDataWithState) => {
						switch (args.state) {
							case GestureStateTypes.began:
								if (handleDown) {
									// console.log('longPress began:', args.view.id, args.state);
									TouchManager.startAnimationForType(<View>args.view, TouchAnimationTypes.down);
								}
								break;
							case GestureStateTypes.cancelled:
							case GestureStateTypes.ended:
								if (handleUp) {
									TouchManager.startAnimationForType(<View>args.view, TouchAnimationTypes.up);
								}
								break;
						}
					});
				}
			}
		} else {
			if (handleDown || handleUp) {
				view.on(GestureTypes.touch, (args: TouchGestureEventData) => {
					switch (args.action) {
						case 'down':
							if (handleDown) {
								view.notify({
									eventName: GestureEvents.touchDown,
									object: view,
									data: args.android,
								});
							}
							break;
						case 'up':
						case 'cancel':
							if (handleUp) {
								view.notify({
									eventName: GestureEvents.touchUp,
									object: view,
									data: args.android,
								});
							}
							break;
					}
				});
				if (handleDown) {
					view.on(GestureEvents.touchDown, (args) => {
						// console.log('touchDown {N} event');
						TouchManager.startAnimationForType(view, TouchAnimationTypes.down);
					});
				}
				if (handleUp) {
					view.on(GestureEvents.touchUp, (args) => {
						// console.log('touchUp {N} event');
						TouchManager.startAnimationForType(view, TouchAnimationTypes.up);
					});
				}
			}
		}

		view.on(View.disposeNativeViewEvent, (args) => {
			// console.log('calling disposeNativeView:', args.eventName, 'TouchManager.touchHandlers.length:', TouchManager.touchHandlers.length);
			const index = TouchManager.touchHandlers?.findIndex((handler) => handler.view === args.object);
			if (index > -1) {
				TouchManager.touchHandlers.splice(index, 1);
			}
			TouchManager.touchAnimationDefinitions = TouchManager.touchAnimationDefinitions?.filter((d) => d.view !== args.object);
			// console.log('after clearing with disposeNativeView:', args.eventName, 'TouchManager.touchHandlers.length:', TouchManager.touchHandlers.length);
			// console.log('TouchManager.touchAnimationDefinitions.length:', TouchManager.touchAnimationDefinitions.length);
		});
	}

	static startAnimationForType(view: View, type: TouchAnimationTypes) {
		if (view) {
			const animate = function (definition: AnimationDefinition | TouchAnimationFn) {
				if (definition) {
					if (isFunction(definition)) {
						(<TouchAnimationFn>definition)(view);
					} else {
						if (!TouchManager.touchAnimationDefinitions) {
							TouchManager.touchAnimationDefinitions = [];
						}
						// reuse animations for each type
						let touchAnimation: Animation;
						// triggering animations should always cancel other animations which may be in progress
						for (const d of TouchManager.touchAnimationDefinitions) {
							if (d.view === view && d.animation) {
								d.animation.cancel();
								if (d.type === type) {
									touchAnimation = d.animation;
								}
							}
						}

						if (!touchAnimation) {
							touchAnimation = new Animation([
								{
									target: view,
									...(<AnimationDefinition>definition),
								},
							]);
							TouchManager.touchAnimationDefinitions.push({
								view,
								type,
								animation: touchAnimation,
							});
						}
						touchAnimation.play().catch(() => {});
					}
				}
			};
			// always use instance defined animation over global
			if (isObject(view.touchAnimation) && view.touchAnimation[type]) {
				animate(view.touchAnimation[type]);
			} else if (TouchManager.animations?.[type]) {
				// fallback to globally defined
				animate(TouchManager.animations?.[type]);
			}
		}
	}
}

export let TouchControlHandler: {
	initWithOwner: (owner: WeakRef<View>) => any;
};
ensureTouchControlHandlers();

function ensureTouchControlHandlers() {
	if (global.isIOS) {
		@NativeClass
		class TouchHandlerImpl extends NSObject {
			private _owner: WeakRef<View>;
			static ObjCExposedMethods = {
				touchDown: { returns: interop.types.void, params: [interop.types.id] },
				touchUp: { returns: interop.types.void, params: [interop.types.id] },
			};

			static initWithOwner(owner: WeakRef<View>): TouchHandlerImpl {
				const handler = <TouchHandlerImpl>TouchHandlerImpl.new();
				handler._owner = owner;
				return handler;
			}

			touchDown(args) {
				this._owner?.get?.().notify({
					eventName: GestureEvents.touchDown,
					object: this._owner?.get?.(),
					data: args,
				});
			}

			touchUp(args) {
				this._owner?.get?.().notify({
					eventName: GestureEvents.touchUp,
					object: this._owner?.get?.(),
					data: args,
				});
			}
		}

		TouchControlHandler = TouchHandlerImpl;
	}
}
