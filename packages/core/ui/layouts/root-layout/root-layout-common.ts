import { CoreTypes } from '../../../core-types';
import { Trace } from '../../../trace';
import { CSSType, View } from '../../core/view';
import { GridLayout } from '../grid-layout';
import { RootLayout, RootLayoutOptions, ShadeCoverOptions, TransitionAnimation } from '.';
import { Animation } from '../../animation';
import { AnimationDefinition } from '../../animation';
import { isNumber } from '../../../utils/types';

@CSSType('RootLayout')
export class RootLayoutBase extends GridLayout {
	private shadeCover: View;
	private staticChildCount: number;
	private popupViews: { view: View; options: RootLayoutOptions }[] = [];

	constructor() {
		super();
		global.rootLayout = this;
	}

	public onLoaded() {
		// get actual content count of rootLayout (elements between the <RootLayout> tags in the template).
		// All popups will be inserted dynamically at a higher index
		this.staticChildCount = this.getChildrenCount();

		super.onLoaded();
	}

	public _onLivesync(context?: ModuleContext): boolean {
		let handled = false;

		if (this.popupViews.length > 0) {
			this.closeAll();
			handled = true;
		}

		if (super._onLivesync(context)) {
			handled = true;
		}

		return handled;
	}

	/**
	 * Ability to add any view instance to composite views like layers.
	 *
	 * @param view
	 * @param options
	 * @returns
	 */
	open(view: View, options: RootLayoutOptions = {}): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!(view instanceof View)) {
				return reject(new Error(`Invalid open view: ${view}`));
			}

			if (this.hasChild(view)) {
				return reject(new Error(`${view} has already been added`));
			}

			const toOpen = [];
			const enterAnimationDefinition = options.animation ? options.animation.enterFrom : null;

			// keep track of the views locally to be able to use their options later
			this.popupViews.push({ view: view, options: options });

			if (options.shadeCover) {
				// perf optimization note: we only need 1 layer of shade cover
				// we just update properties if needed by additional overlaid views
				if (this.shadeCover) {
					// overwrite current shadeCover options if topmost popupview has additional shadeCover configurations
					toOpen.push(this.updateShadeCover(this.shadeCover, options.shadeCover));
				} else {
					toOpen.push(this.openShadeCover(options.shadeCover));
				}
			}

			view.opacity = 0; // always begin with view invisible when adding dynamically
			this.insertChild(view, this.getChildrenCount() + 1);

			toOpen.push(
				new Promise<void>((res, rej) => {
					setTimeout(() => {
						// only apply initial state and animate after the first tick - ensures safe areas and other measurements apply correctly
						this.applyInitialState(view, enterAnimationDefinition);
						this.getEnterAnimation(view, enterAnimationDefinition)
							.play()
							.then(
								() => {
									this.applyDefaultState(view);
									view.notify({ eventName: 'opened', object: view });
									res();
								},
								(err) => {
									rej(new Error(`Error playing enter animation: ${err}`));
								}
							);
					});
				})
			);

			Promise.all(toOpen).then(
				() => {
					resolve();
				},
				(err) => {
					reject(err);
				}
			);
		});
	}

	/**
	 * Ability to remove any view instance from composite views.
	 * Optional animation parameter to overwrite close animation declared when opening popup.
	 *
	 * @param view
	 * @param exitTo
	 * @returns
	 */
	close(view: View, exitTo?: TransitionAnimation): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!(view instanceof View)) {
				return reject(new Error(`Invalid close view: ${view}`));
			}

			if (!this.hasChild(view)) {
				return reject(new Error(`Unable to close popup. ${view} not found`));
			}

			const toClose = [];
			const popupIndex = this.getPopupIndex(view);
			const poppedView = this.popupViews[popupIndex];
			const cleanupAndFinish = () => {
				view.notify({ eventName: 'closed', object: view });
				this.removeChild(view);
				resolve();
			};
			// use exitAnimation that is passed in and fallback to the exitAnimation passed in when opening
			const exitAnimationDefinition = exitTo || poppedView?.options?.animation?.exitTo;

			// Remove view from tracked popupviews
			this.popupViews.splice(popupIndex, 1);

			toClose.push(
				new Promise<void>((res, rej) => {
					if (exitAnimationDefinition) {
						this.getExitAnimation(view, exitAnimationDefinition)
							.play()
							.then(res, (err) => {
								rej(new Error(`Error playing exit animation: ${err}`));
							});
					} else {
						res();
					}
				})
			);

			if (this.shadeCover) {
				// Update shade cover with the topmost popupView options (if not specifically told to ignore)
				if (this.popupViews.length) {
					if (!poppedView?.options?.shadeCover?.ignoreShadeRestore) {
						const shadeCoverOptions = this.popupViews[this.popupViews.length - 1].options?.shadeCover;
						if (shadeCoverOptions) {
							toClose.push(this.updateShadeCover(this.shadeCover, shadeCoverOptions));
						}
					}
				} else {
					// Remove shade cover animation if this is the last opened popup view
					toClose.push(this.closeShadeCover(poppedView?.options?.shadeCover));
				}
			}

			Promise.all(toClose).then(
				() => {
					cleanupAndFinish();
				},
				(err) => {
					reject(err);
				}
			);
		});
	}

	closeAll(): Promise<void[]> {
		const toClose = [];
		const views = this.popupViews.map((popupView) => popupView.view);

		// Close all views at the same time and wait for all of them
		for (const view of views) {
			toClose.push(this.close(view));
		}
		return Promise.all(toClose);
	}

	getShadeCover(): View {
		return this.shadeCover;
	}

	openShadeCover(options: ShadeCoverOptions = {}): Promise<void> {
		return new Promise((resolve) => {
			if (this.shadeCover) {
				if (Trace.isEnabled()) {
					Trace.write(`RootLayout shadeCover already open.`, Trace.categories.Layout, Trace.messageType.warn);
				}
				resolve();
			} else {
				// Create the one and only shade cover
				const shadeCover = this.createShadeCover();
				shadeCover.on('loaded', () => {
					this._initShadeCover(shadeCover, options);
					this.updateShadeCover(shadeCover, options).then(() => {
						resolve();
					});
				});

				this.shadeCover = shadeCover;
				// Insert shade cover at index right above the first layout
				this.insertChild(this.shadeCover, this.staticChildCount + 1);
			}
		});
	}

	closeShadeCover(shadeCoverOptions: ShadeCoverOptions = {}): Promise<void> {
		return new Promise((resolve) => {
			// if shade cover is displayed and the last popup is closed, also close the shade cover
			if (this.shadeCover) {
				return this._closeShadeCover(this.shadeCover, shadeCoverOptions).then(() => {
					if (this.shadeCover) {
						this.shadeCover.off('loaded');
						if (this.shadeCover.parent) {
							this.removeChild(this.shadeCover);
						}
					}
					this.shadeCover = null;
					// cleanup any platform specific details related to shade cover
					this._cleanupPlatformShadeCover();
					resolve();
				});
			}
			resolve();
		});
	}

	topmost(): View {
		return this.popupViews.length ? this.popupViews[this.popupViews.length - 1].view : null;
	}

	// bring any view instance open on the rootlayout to front of all the children visually
	bringToFront(view: View, animated: boolean = false): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!(view instanceof View)) {
				return reject(new Error(`Invalid bringToFront view: ${view}`));
			}

			if (!this.hasChild(view)) {
				return reject(new Error(`${view} not found or already at topmost`));
			}

			const popupIndex = this.getPopupIndex(view);
			// popupview should be present and not already the topmost view
			if (popupIndex < 0 || popupIndex == this.popupViews.length - 1) {
				return reject(new Error(`${view} not found or already at topmost`));
			}

			// keep the popupViews array in sync with the stacking of the views
			const currentView = this.popupViews[this.getPopupIndex(view)];
			this.popupViews.splice(this.getPopupIndex(view), 1);
			this.popupViews.push(currentView);

			const exitAnimation = this.getViewExitState(view);
			if (animated && exitAnimation) {
				this.getExitAnimation(view, exitAnimation)
					.play()
					.then(() => {
						this._bringToFront(view);
						const initialState = this.getViewInitialState(currentView.view);
						if (initialState) {
							this.applyInitialState(view, initialState);
							this.getEnterAnimation(view, initialState)
								.play()
								.then(() => {
									this.applyDefaultState(view);
								})
								.catch((ex) => {
									reject(new Error(`Error playing enter animation: ${ex}`));
								});
						} else {
							this.applyDefaultState(view);
						}
					})
					.catch((ex) => {
						this._bringToFront(view);
						reject(new Error(`Error playing exit animation: ${ex}`));
					});
			} else {
				this._bringToFront(view);
			}

			// update shadeCover to reflect topmost's shadeCover options
			const shadeCoverOptions = currentView?.options?.shadeCover;
			if (shadeCoverOptions) {
				this.updateShadeCover(this.shadeCover, shadeCoverOptions);
			}
			resolve();
		});
	}

	private getPopupIndex(view: View): number {
		return this.popupViews.findIndex((popupView) => popupView.view === view);
	}

	private getViewInitialState(view: View): TransitionAnimation {
		const popupIndex = this.getPopupIndex(view);
		if (popupIndex === -1) {
			return;
		}
		const initialState = this.popupViews[popupIndex]?.options?.animation?.enterFrom;
		if (!initialState) {
			return;
		}
		return initialState;
	}

	private getViewExitState(view: View): TransitionAnimation {
		const popupIndex = this.getPopupIndex(view);
		if (popupIndex === -1) {
			return;
		}
		const exitAnimation = this.popupViews[popupIndex]?.options?.animation?.exitTo;
		if (!exitAnimation) {
			return;
		}
		return exitAnimation;
	}

	private applyInitialState(targetView: View, enterFrom: TransitionAnimation): void {
		const animationOptions = {
			...defaultTransitionAnimation,
			...(enterFrom || {}),
		};
		targetView.translateX = animationOptions.translateX;
		targetView.translateY = animationOptions.translateY;
		targetView.scaleX = animationOptions.scaleX;
		targetView.scaleY = animationOptions.scaleY;
		targetView.rotate = animationOptions.rotate;
		targetView.opacity = animationOptions.opacity;
	}

	private applyDefaultState(targetView: View): void {
		targetView.translateX = 0;
		targetView.translateY = 0;
		targetView.scaleX = 1;
		targetView.scaleY = 1;
		targetView.rotate = 0;
		targetView.opacity = 1;
	}

	private getEnterAnimation(targetView: View, enterFrom: TransitionAnimation): Animation {
		const animationOptions = {
			...defaultTransitionAnimation,
			...(enterFrom || {}),
		};
		return new Animation([
			{
				target: targetView,
				translate: { x: 0, y: 0 },
				scale: { x: 1, y: 1 },
				rotate: 0,
				opacity: 1,
				duration: animationOptions.duration,
				curve: animationOptions.curve,
			},
		]);
	}

	private getExitAnimation(targetView: View, exitTo: TransitionAnimation): Animation {
		return new Animation([this.getExitAnimationDefinition(targetView, exitTo)]);
	}

	private getExitAnimationDefinition(targetView: View, exitTo: TransitionAnimation): AnimationDefinition {
		return {
			target: targetView,
			...defaultTransitionAnimation,
			...(exitTo || {}),
			translate: { x: isNumber(exitTo.translateX) ? exitTo.translateX : defaultTransitionAnimation.translateX, y: isNumber(exitTo.translateY) ? exitTo.translateY : defaultTransitionAnimation.translateY },
			scale: { x: isNumber(exitTo.scaleX) ? exitTo.scaleX : defaultTransitionAnimation.scaleX, y: isNumber(exitTo.scaleY) ? exitTo.scaleY : defaultTransitionAnimation.scaleY },
		};
	}

	private createShadeCover(): View {
		const shadeCover = new GridLayout();
		shadeCover.verticalAlignment = 'bottom';
		return shadeCover;
	}

	private updateShadeCover(shade: View, shadeOptions: ShadeCoverOptions = {}): Promise<void> {
		if (shadeOptions.tapToClose !== undefined && shadeOptions.tapToClose !== null) {
			shade.off('tap');
			if (shadeOptions.tapToClose) {
				shade.on('tap', () => {
					this.closeAll();
				});
			}
		}
		return this._updateShadeCover(shade, shadeOptions);
	}

	private hasChild(view: View): boolean {
		return this.getChildIndex(view) >= 0;
	}

	protected _bringToFront(view: View) {}

	protected _initShadeCover(view: View, shadeOption: ShadeCoverOptions): void {}

	protected _updateShadeCover(view: View, shadeOption: ShadeCoverOptions): Promise<void> {
		return new Promise(() => {});
	}

	protected _closeShadeCover(view: View, shadeOptions: ShadeCoverOptions): Promise<void> {
		return new Promise(() => {});
	}

	protected _cleanupPlatformShadeCover(): void {}
}

export function getRootLayout(): RootLayout {
	return <RootLayout>global.rootLayout;
}

export const defaultTransitionAnimation: TransitionAnimation = {
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
	opacity: 1,
	duration: 300,
	curve: CoreTypes.AnimationCurve.easeIn,
};

export const defaultShadeCoverTransitionAnimation: TransitionAnimation = {
	...defaultTransitionAnimation,
	opacity: 0, // default to fade in/out
};

export const defaultShadeCoverOptions: ShadeCoverOptions = {
	opacity: 0.5,
	color: '#000000',
	tapToClose: true,
	animation: {
		enterFrom: defaultShadeCoverTransitionAnimation,
		exitTo: defaultShadeCoverTransitionAnimation,
	},
	ignoreShadeRestore: false,
};
