import IEventTarget from './IEventTarget';

type EventInitOptions<T> = {
	bubbles?: boolean;
	captures?: boolean;
	cancelable?: boolean;
} & T;

const EVENT_OPTIONS_DEFAULT: EventInitOptions<any> = {
	bubbles: false,
	captures: false,
	cancelable: false,
};

/**
 * Event.
 */
export class Event<EventsMap = {}, EventType extends keyof EventsMap = any> {
	public composed = false;
	public bubbles = false;
	public cancelable = false;
	public defaultPrevented = false;
	public captures = false;
	public passive = false;
	public _immediatePropagationStopped = false;
	public _propagationStopped = false;
	//@ts-ignore
	public _target: IEventTarget = null;
	//@ts-ignore
	public _currentTarget: IEventTarget = null;
	//@ts-ignore
	public type: EventType = null;

	constructor(type: EventType, options?: Partial<EventInitOptions<EventsMap[EventType]>>) {
		if (!options) options = EVENT_OPTIONS_DEFAULT;
		const { bubbles, cancelable, captures, ...restOptions } = options;
		this.initEvent(type, bubbles, cancelable, captures);
		if (restOptions) {
			for (const prop in restOptions) {
				this[prop] = restOptions[prop];
			}
		}
	}
	// eslint-disable-next-line max-params
	initEvent(type: EventType, bubbles?: boolean, cancelable = true, captures?: boolean) {
		this.type = type;
		this.bubbles = !!bubbles;
		this.cancelable = !!cancelable;
		this.captures = !!captures;
	}
	public stopPropagation() {
		this._propagationStopped = true;
	}
	public stopImmediatePropagation() {
		this._immediatePropagationStopped = this._propagationStopped = true;
	}
	public preventDefault() {
		if (this.passive) {
			console.error('[DOM] Unable to preventDefault inside passive event listener invocation.');
			return;
		}
		this.defaultPrevented = true;
	}

	/**
	 * Returns target.
	 *
	 * @returns Target.
	 */
	public get target(): IEventTarget {
		return this._target;
	}

	/**
	 * Returns target.
	 *
	 * @returns Target.
	 */
	public get currentTarget(): IEventTarget {
		return this._currentTarget;
	}

	/**
	 * Returns composed path.
	 *
	 * @returns Composed path.
	 */
}
