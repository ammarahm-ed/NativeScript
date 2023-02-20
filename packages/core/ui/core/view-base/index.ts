import { HTMLElement, Event, DOMEvent } from './../../dom/index';
// Definitions.

// Types.
import { CSSUtils } from '../../../css/system-classes';
import { Style } from '../../styling/style';
import { paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty } from '../../styling/style-properties';
import { clearInheritedProperties, CssAnimationProperty, CssProperty, InheritedProperty, initNativeView, propagateInheritableCssProperties, propagateInheritableProperties, Property } from '../properties';

// TODO: Remove this import!
import { getClass } from '../../../utils/types';

import NodeTypeEnum from '../../dom/src/nodes/node/NodeTypeEnum';
import * as Styling from '../../styling/style-scope';
import { ViewBase as ViewDefinition } from './index.d';
import { DOMNode } from '../../../debugger/dom-node';
import { CoreTypes } from '../../enums';
import IEventTarget from '../../dom/src/event/IEventTarget';

let styleScopeModule: typeof Styling;
function ensureStyleScopeModule() {
	if (!styleScopeModule) {
		styleScopeModule = require('@nativescript/core/ui/styling/style-scope');
	}
}

export interface ShowModalOptions {
	/**
	 * Any context you want to pass to the modally shown view. This same context will be available in the arguments of the shownModally event handler.
	 */
	context: any;

	/**
	 * A function that will be called when the view is closed. Any arguments provided when calling ShownModallyData.closeCallback will be available here.
	 */
	closeCallback: Function;

	/**
	 * An optional parameter specifying whether to show the modal view in full-screen mode.
	 */
	fullscreen?: boolean;

	/**
	 * An optional parameter specifying whether to show the modal view with animation.
	 */
	animated?: boolean;

	/**
	 * An optional parameter specifying whether to stretch the modal view when not in full-screen mode.
	 */
	stretched?: boolean;

	/**
	 * An optional parameter that specify options specific to iOS as an object.
	 */
	ios?: {
		/**
		 * The UIModalPresentationStyle to be used when showing the dialog in iOS .
		 */
		presentationStyle?: any /* UIModalPresentationStyle */;
		/**
		 * width of the popup dialog
		 */
		width?: number;
		/**
		 * height of the popup dialog
		 */
		height?: number;
	};
	android?: {
		/**
		 * @deprecated Use ShowModalOptions.cancelable instead.
		 * An optional parameter specifying whether the modal view can be dismissed when not in full-screen mode.
		 */
		cancelable?: boolean;
		/**
		 * An optional parameter specifying the windowSoftInputMode of the dialog window
		 * For possible values see https://developer.android.com/reference/android/view/WindowManager.LayoutParams#softInputMode
		 */
		windowSoftInputMode?: number;
	};
	/**
	 * An optional parameter specifying whether the modal view can be dismissed when not in full-screen mode.
	 */
	cancelable?: boolean;
}

export type ViewBaseEventsMap = {
	loaded: DOMEvent<ViewBase>;
	unloaded: DOMEvent<ViewBase>;
	created: DOMEvent<ViewBase>;
	disposeNativeView: DOMEvent<ViewBase>;
};

let viewIdCounter = 0;
export class ViewBase<EventsMap = {}> extends HTMLElement<EventsMap & ViewBaseEventsMap> implements ViewDefinition {
	public id: string;
	public _styleScope: Styling.StyleScope;
	public _isStyleScopeHost: boolean;
	public _cssState: Styling.CssState = new Styling.CssState(new WeakRef(this as any));
	public _suspendedUpdates: {
		[propertyName: string]: Property<any, any> | CssProperty<Style, any> | CssAnimationProperty<Style, any>;
	};
	public _context: any;
	public effectiveMinWidth: number;
	public effectiveMinHeight: number;
	public effectiveWidth: number;
	public effectiveHeight: number;
	public effectiveMarginTop: number;
	public effectiveMarginRight: number;
	public effectiveMarginBottom: number;
	public effectiveMarginLeft: number;
	public effectivePaddingTop: number;
	public effectivePaddingRight: number;
	public effectivePaddingBottom: number;
	public effectivePaddingLeft: number;
	public effectiveBorderTopWidth: number;
	public effectiveBorderRightWidth: number;
	public effectiveBorderBottomWidth: number;
	public effectiveBorderLeftWidth: number;

	public _defaultPaddingTop: number;
	public _defaultPaddingRight: number;
	public _defaultPaddingBottom: number;
	public _defaultPaddingLeft: number;
	public _isPaddingRelative: boolean;

	public recycleNativeView: 'always' | 'never' | 'auto';
	public viewController: any;
	public nativeViewProtected: any;
	public isCollapsed: boolean; // Default(false) set in prototype

	public isConnected: boolean = false;
	public reusable: boolean;
	public _isViewBase: boolean;

	public _suspendNativeUpdatesCount: number;
	public _oldLeft: number;
	public _oldTop: number;
	public _oldRight: number;
	public _oldBottom: number;
	public _domId: number;

	public _automaticallyAdjustsScrollViewInsets: boolean;

	constructor() {
		super(NodeTypeEnum.elementNode, 'ViewBase');
		this.tagName = this.constructor.name;
		this._domId = viewIdCounter++;
		this._style = new Style(new WeakRef(this));
		this.dispatchEvent(new Event('created'));
	}
	left: CoreTypes.LengthType;
	top: CoreTypes.LengthType;
	effectiveLeft: number;
	effectiveTop: number;
	dock: 'left' | 'top' | 'right' | 'bottom';
	row: number;
	col: number;
	column: number;
	rowSpan: number;
	colSpan: number;
	columnSpan: number;
	_moduleName?: string;
	_style: Style;

	get page(): any {
		if (this.parentNode) {
			return (this.parentNode as ViewBase).page;
		}
		return null;
	}

	get typeName(): string {
		return getClass(this);
	}

	get nativeView(): any {
		// this._disableNativeViewRecycling = true;
		return this.nativeViewProtected;
	}
	set nativeView(value: any) {
		this.setNativeView(value);
	}

	get style(): Style {
		return this._style;
	}
	set style(value: Style /* | string */) {
		if (typeof value === 'string') {
			this.setInlineStyle(value);
		} else {
			throw new Error('View.style property is read-only.');
		}
	}

	setAttribute(name: string, value: unknown): void {
		if (name === 'style') {
			if (typeof value === 'string') {
				this.setInlineStyle(value);
			} else if (typeof value === 'object') {
				for (const property in value) {
					this.style.setProperty(property, value[property]);
				}
			}
			return;
		}

		super.setAttribute(name, value);
	}

	getAttribute(name: string) {
		if (name === 'style') return this.style;
		return super.getAttribute(name);
	}

	public createNativeView(): Object {
		return undefined;
	}

	get ['class'](): string {
		return this.className;
	}
	set ['class'](v: string) {
		this.className = v;
	}

	public disposeNativeView() {
		this.dispatchEvent(new Event('disposeNativeView'));
	}

	public initNativeView(): void {}

	public resetNativeView(): void {}

	insertBefore(newNode: ViewBase, referenceNode: ViewBase): ViewBase {
		super.insertBefore(newNode, referenceNode);
		// propagate properties
		propagateInheritableProperties(this as any, newNode as any);
		// Inherit stylescope of parent
		newNode._inheritStyleScope(this._styleScope);
		propagateInheritableCssProperties(this.style, newNode.style);

		if (this._context) {
			newNode.renderNativeView(this._context, referenceNode ? this.childNodes.findIndex((node) => node === referenceNode) : -1);
		}

		if (this.isConnected) {
			newNode.connectedCallback();
		}

		return newNode;
	}

	removeChild(node: any) {
		super.removeChild(node);
		this.disconnectedCallback();
		this.detachNativeView();
	}

	public detachNativeView(force?: boolean): void {
		// No context means we are already teared down.
		if (!this._context) return;

		const preserveNativeView = this.reusable && !force;

		if (!preserveNativeView) {
			for (const node of this.childNodes) {
				(node as ViewBase).detachNativeView(force);
			}
		}

		if (this.parentNode) (this.parentNode as ViewBase).onChildRemoved(this);
		clearInheritedProperties(this as any);
		if (!preserveNativeView) {
			this.disposeNativeView();
			this._suspendNativeUpdates(SuspendType.UISetup);
			this.nativeViewProtected = null;
			this._context = null;
		}
	}

	public renderNativeView(context: any, index?: number, parentIsLoaded?: boolean): void {
		this._context = context;
		// Create the native view
		const nativeView = this.createNativeView();

		if (global.isAndroid && nativeView && __ANDROID__) {
			setDefaultPaddings(this);
		}

		this.setNativeView(nativeView);

		// Notify parent that a child has been added to DOM.
		// so the child can be attached to the actual native tree
		// of the parent nativeView.
		if (this.parentNode) (this.parentNode as ViewBase).onChildAdded(this, this.childIndexToNativeChildIndex(index));

		// Render all children of this node.
		for (const node of this.childNodes as ViewBase[]) {
			node.renderNativeView(this._context);
		}
	}

	setNativeView(nativeView: any) {
		if (this.nativeView === nativeView) return;
		this.nativeViewProtected = nativeView as any;
		this._suspendNativeUpdates(SuspendType.NativeView);
		this._suspendedUpdates = undefined;
		this.initNativeView();
		this._resumeNativeUpdates(SuspendType.NativeView);
	}

	onChildAdded(node: ViewBase, index?: number) {
		if (node.isConnected) throw new Error('Child is already connected to another parent.');
	}

	onChildRemoved(node: ViewBase, index?: number) {
		node.isConnected = false;
	}

	public _layoutParent() {
		if (this.parentNode) {
			(this.parentNode as ViewBase)._layoutParent();
		}
	}

	public connectedCallback() {
		if (this.isConnected) {
			return;
		}

		this.isConnected = true;
		this._cssState.onLoaded();
		this._resumeNativeUpdates(SuspendType.Loaded);

		for (const node of this.childNodes as ViewBase[]) {
			node.connectedCallback();
		}
		this.dispatchEvent(new Event('loaded'));
	}

	public disconnectedCallback() {
		if (!this.isConnected) {
			return;
		}

		this._suspendNativeUpdates(SuspendType.Loaded);

		for (const node of this.childNodes as ViewBase[]) {
			node.disconnectedCallback();
		}

		this.isConnected = false;
		this._cssState.onUnloaded();
		this.dispatchEvent(new Event('unloaded'));
	}

	childIndexToNativeChildIndex(index: number) {
		return index;
	}

	_inheritStyleScope(styleScope: Styling.StyleScope): void {
		// If we are styleScope don't inherit parent stylescope.
		// TODO: Consider adding parent scope and merge selectors.
		if (this._isStyleScopeHost) return;
		if (this._styleScope !== styleScope) {
			this._styleScope = styleScope;
			this._cssState.onChange();
			for (const node of this.childNodes as ViewBase[]) {
				node._inheritStyleScope(styleScope);
			}
		}
	}

	_onCssStateChange() {
		this._cssState.onChange();
		for (const node of this.childNodes as ViewBase[]) {
			node._cssState.onChange();
		}
	}

	setInlineStyle(style: string) {
		if (typeof style !== 'string') {
			throw new Error('Parameter should be valid CSS string!');
		}
		ensureStyleScopeModule();
		styleScopeModule.applyInlineStyle(this, style, undefined);
	}

	public _suspendNativeUpdates(type: SuspendType): void {
		if (type) {
			this._suspendNativeUpdatesCount = this._suspendNativeUpdatesCount | type;
		} else {
			this._suspendNativeUpdatesCount++;
		}
	}
	public _resumeNativeUpdates(type: SuspendType): void {
		if (type) {
			this._suspendNativeUpdatesCount = this._suspendNativeUpdatesCount & ~type;
		} else {
			if ((this._suspendNativeUpdatesCount & SuspendType.IncrementalCountMask) === 0) {
				throw new Error(`Invalid call to ${this}._resumeNativeUpdates`);
			}
			this._suspendNativeUpdatesCount--;
		}

		if (!this._suspendNativeUpdatesCount) {
			this.onResumeNativeUpdates();
		}
	}

	public _batchUpdate<T>(callback: () => T): T {
		try {
			this._suspendNativeUpdates(SuspendType.Incremental);

			return callback();
		} finally {
			this._resumeNativeUpdates(SuspendType.Incremental);
		}
	}

	public onResumeNativeUpdates(): void {
		// Apply native setters...
		initNativeView(this, undefined, undefined);
	}

	public _shouldDelayLayout(): boolean {
		return false;
	}

	private performLayout(currentRun = 0) {
		// if there's an animation in progress we need to delay the layout
		// we've added a guard of 5000 milliseconds execution
		// to make sure that the layout will happen even if the animation haven't finished in 5 seconds
		if (this._shouldDelayLayout() && currentRun < 100) {
			setTimeout(() => this.performLayout(currentRun), currentRun);
			currentRun++;
		} else {
			(this.parentNode as ViewBase).requestLayout();
		}
	}

	public requestLayout(): void {
		// Default implementation for non View instances (like TabViewItem).
		if (this.parentNode) this.performLayout();
	}

	get android(): any {
		return this.nativeViewProtected;
	}

	get ios(): any {
		return this.nativeViewProtected;
	}

	private onPseudoClassChange(pseudoClass: string): void {
		//this.notify({ eventName: ':' + pseudoClass, object: this });
	}

	private pseudoClassAliases = {
		highlighted: ['active', 'pressed'],
	};

	public cssClasses: Set<string> = new Set();
	public cssPseudoClasses: Set<string> = new Set();

	private getAllAliasedStates(name: string): Array<string> {
		const allStates = [];
		allStates.push(name);
		if (name in this.pseudoClassAliases) {
			for (let i = 0; i < this.pseudoClassAliases[name].length; i++) {
				allStates.push(this.pseudoClassAliases[name][i]);
			}
		}

		return allStates;
	}

	public addPseudoClass(name: string): void {
		const allStates = this.getAllAliasedStates(name);
		for (let i = 0; i < allStates.length; i++) {
			if (!this.cssPseudoClasses.has(allStates[i])) {
				this.cssPseudoClasses.add(allStates[i]);
				this.onPseudoClassChange(allStates[i]);
			}
		}
	}

	public deletePseudoClass(name: string): void {
		const allStates = this.getAllAliasedStates(name);
		for (let i = 0; i < allStates.length; i++) {
			if (this.cssPseudoClasses.has(allStates[i])) {
				this.cssPseudoClasses.delete(allStates[i]);
				this.onPseudoClassChange(allStates[i]);
			}
		}
	}

	_setupAsRootView(context: any): void {
		this.renderNativeView(context);
	}

	public _onRootViewReset(): void {
		for (const node of this.childNodes as ViewBase[]) {
			node._onRootViewReset();
		}
	}

	private _visualState: string;
	public _goToVisualState(state: string) {
		if (state === this._visualState) {
			return;
		}

		this.deletePseudoClass(this._visualState);
		this._visualState = state;
		this.addPseudoClass(state);
	}

	public showModal(...args): ViewBase {
		const parent = this.parentNode as ViewBase;

		return parent && parent.showModal(...args);
	}

	public closeModal(...args): void {
		const parent = this.parentNode as ViewBase;
		if (parent) {
			parent.closeModal(...args);
		}
	}

	public _dialogClosed(): void {
		for (const child of this.childNodes as ViewBase[]) {
			child._dialogClosed();
		}
	}
}

function setDefaultPaddings(node: ViewBase) {
	const nativeView = node.nativeView;
	if (this._isPaddingRelative === undefined) {
		this._isPaddingRelative = (nativeView as android.view.View).isPaddingRelative();
	}

	let result: any /* android.graphics.Rect */ = nativeView.defaultPaddings;
	if (result === undefined) {
		result = org.nativescript.widgets.ViewHelper.getPadding(nativeView as android.view.View);
		(<any>nativeView).defaultPaddings = result;
	}

	this._defaultPaddingTop = result.top;
	this._defaultPaddingRight = result.right;
	this._defaultPaddingBottom = result.bottom;
	this._defaultPaddingLeft = result.left;

	const style = this.style;
	if (!paddingTopProperty.isSet(style)) {
		this.effectivePaddingTop = this._defaultPaddingTop;
	}
	if (!paddingRightProperty.isSet(style)) {
		this.effectivePaddingRight = this._defaultPaddingRight;
	}
	if (!paddingBottomProperty.isSet(style)) {
		this.effectivePaddingBottom = this._defaultPaddingBottom;
	}
	if (!paddingLeftProperty.isSet(style)) {
		this.effectivePaddingLeft = this._defaultPaddingLeft;
	}
}

ViewBase.prototype.isCollapsed = false;

ViewBase.prototype._oldLeft = 0;
ViewBase.prototype._oldTop = 0;
ViewBase.prototype._oldRight = 0;
ViewBase.prototype._oldBottom = 0;

ViewBase.prototype.effectiveMinWidth = 0;
ViewBase.prototype.effectiveMinHeight = 0;
ViewBase.prototype.effectiveWidth = 0;
ViewBase.prototype.effectiveHeight = 0;
ViewBase.prototype.effectiveMarginTop = 0;
ViewBase.prototype.effectiveMarginRight = 0;
ViewBase.prototype.effectiveMarginBottom = 0;
ViewBase.prototype.effectiveMarginLeft = 0;
ViewBase.prototype.effectivePaddingTop = 0;
ViewBase.prototype.effectivePaddingRight = 0;
ViewBase.prototype.effectivePaddingBottom = 0;
ViewBase.prototype.effectivePaddingLeft = 0;
ViewBase.prototype.effectiveBorderTopWidth = 0;
ViewBase.prototype.effectiveBorderRightWidth = 0;
ViewBase.prototype.effectiveBorderBottomWidth = 0;
ViewBase.prototype.effectiveBorderLeftWidth = 0;
ViewBase.prototype._defaultPaddingTop = 0;
ViewBase.prototype._defaultPaddingRight = 0;
ViewBase.prototype._defaultPaddingBottom = 0;
ViewBase.prototype._defaultPaddingLeft = 0;
ViewBase.prototype._isViewBase = true;
ViewBase.prototype.recycleNativeView = 'never';
ViewBase.prototype.reusable = false;

enum SuspendType {
	Incremental = 0,
	Loaded = 1 << 20,
	NativeView = 1 << 21,
	UISetup = 1 << 22,
	IncrementalCountMask = ~((1 << 20) + (1 << 21) + (1 << 22)),
}

ViewBase.prototype._suspendNativeUpdatesCount = SuspendType.Loaded | SuspendType.NativeView | SuspendType.UISetup;

namespace SuspendType {
	export function toString(type: SuspendType): string {
		return (type ? 'suspended' : 'resumed') + '(' + 'Incremental: ' + (type & SuspendType.IncrementalCountMask) + ', ' + 'Loaded: ' + !(type & SuspendType.Loaded) + ', ' + 'NativeView: ' + !(type & SuspendType.NativeView) + ', ' + 'UISetup: ' + !(type & SuspendType.UISetup) + ')';
	}
}

export const classNameProperty = new Property<any, string>({
	name: 'className',
	valueChanged(view: ViewBase, oldValue: string, newValue: string) {
		const cssClasses = view.cssClasses;
		const rootViewsCssClasses = CSSUtils.getSystemCssClasses();

		const shouldAddModalRootViewCssClasses = cssClasses.has(CSSUtils.MODAL_ROOT_VIEW_CSS_CLASS);
		const shouldAddRootViewCssClasses = cssClasses.has(CSSUtils.ROOT_VIEW_CSS_CLASS);

		cssClasses.clear();

		if (shouldAddModalRootViewCssClasses) {
			cssClasses.add(CSSUtils.MODAL_ROOT_VIEW_CSS_CLASS);
		} else if (shouldAddRootViewCssClasses) {
			cssClasses.add(CSSUtils.ROOT_VIEW_CSS_CLASS);
		}

		rootViewsCssClasses.forEach((c) => cssClasses.add(c));

		if (typeof newValue === 'string' && newValue !== '') {
			newValue.split(' ').forEach((c) => cssClasses.add(c));
		}

		view._onCssStateChange();
	},
});
classNameProperty.register(ViewBase);

export const idProperty = new Property<any, string>({
	name: 'id',
	valueChanged: (view, oldValue, newValue) => view.onCssStateChange(),
});
idProperty.register(ViewBase);

export const bindingContextProperty = new InheritedProperty<ViewBase, any>({
	name: 'bindingContext',
});
bindingContextProperty.register(ViewBase);

export const hiddenProperty = new Property<ViewBase, boolean>({
	name: 'hidden',
	defaultValue: false,
	affectsLayout: global.isIOS,
	valueConverter: booleanConverter,
	valueChanged: (target, oldValue, newValue) => {
		if (target) {
			target.isCollapsed = !!newValue;
		}
	},
});
hiddenProperty.register(ViewBase);

export function booleanConverter(v: string | boolean): boolean {
	const lowercase = (v + '').toLowerCase();
	if (lowercase === 'true') {
		return true;
	} else if (lowercase === 'false') {
		return false;
	}

	throw new Error(`Invalid boolean: ${v}`);
}
