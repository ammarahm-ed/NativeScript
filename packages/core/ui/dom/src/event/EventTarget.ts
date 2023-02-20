import { Event } from './Event';
import IEventListener from './IEventListener';
import IEventTarget, { EventOptions } from './IEventTarget';

export type EventDescriptior = {
	target: EventTarget;
	type: string;
	listener?: IEventListener | ((event: Event) => void);
	removed?: boolean;
	abortHandler?: () => void;
} & EventOptions;

const getEventDescriptor = (target: EventTarget, type: string, listener: IEventListener | ((event: Event) => void), options?: EventOptions | boolean): EventDescriptior => {
	if (typeof options === 'object') {
		const { capture, once, passive, signal } = options;
		return { target, capture, type, once, passive, signal, listener };
	}
	return { target, capture: !!options, type, listener };
};

const dispatchToEventListeners = <EventsMap, K extends keyof EventsMap>(store: EventStore<EventsMap, K>, event: Event, cancelable: boolean) => {
	for (const descriptor of [...store.values()]) {
		const { target, listener, removed } = descriptor;
		if (!removed) {
			event.passive = !cancelable || !!descriptor.passive;
			event._currentTarget = target;
			//@ts-ignore todo
			listener.call(target, event);
			if (event._immediatePropagationStopped) return;
		}
	}
};

export type EventStore<EventsMap = {}, K extends keyof EventsMap = any> = Map<IEventListener<EventsMap> | ((event: Event<EventsMap, K>) => void), EventDescriptior>;

export default class EventTarget<EventsMap = {}> implements IEventTarget<EventsMap> {
	private _listeners: {
		capturePhase: {
			[K in keyof EventsMap]?: EventStore<EventsMap, K>;
		};
		bubblePhase: {
			[K in keyof EventsMap]?: EventStore<EventsMap, K>;
		};
	} = {
		capturePhase: {},
		bubblePhase: {},
	};

	hasListeners(type: string) {
		return !!this._listeners['capturePhase'][type] || !!this._listeners['bubblePhase'][type];
	}

	addEventListener<EventName extends keyof EventsMap>(type: EventName | (string & {}), listener: IEventListener<EventsMap> | ((event: Event<EventsMap, EventName>) => void), options?: EventOptions): void {
		const descriptor = getEventDescriptor(this, type as string, listener, options);

		const phase = (descriptor.capture && 'capturePhase') || 'bubblePhase';

		let store = this._listeners[phase][type as keyof EventsMap];
		if (!store) store = this._listeners[phase][type as keyof EventsMap] = new Map() as any;
		else if (store.has(listener as any)) return;

		store.set(listener as any, descriptor);

		const abortHandler = () => {
			if (!descriptor.removed) this.removeEventListener(type, listener);
		};

		descriptor.abortHandler = abortHandler;

		if (descriptor.once) {
			descriptor.listener = function (...handlerArgs) {
				abortHandler();
				//@ts-ignore
				abortHandler.call(this, ...handlerArgs);
			};
		}

		if (descriptor.signal) {
			descriptor.signal.addEventListener('abort', abortHandler);
		}
	}
	removeEventListener<EventName extends keyof EventsMap>(type: EventName | (string & {}), listener: IEventListener<EventsMap> | ((event: Event<EventsMap, EventName>) => void), options?: EventOptions): void {
		let capture = false;
		if (typeof options === 'object') capture = !!options.capture;
		else capture = !!options;

		const phase = (capture && 'capturePhase') || 'bubblePhase';

		const store = this._listeners[phase][type as keyof EventsMap];
		if (!store) return;

		const descriptor = store.get(listener as any);
		if (!descriptor) return;

		if (descriptor.signal && descriptor.abortHandler) descriptor.signal.removeEventListener('abort', descriptor.abortHandler);
		store.delete(listener as any);

		descriptor.removed = true;

		if (!store.size) delete this._listeners[phase][type as keyof EventsMap];
	}

	dispatchEvent<EventName extends keyof EventsMap>(event: Event<EventsMap, EventName>): boolean {
		const { cancelable, bubbles, captures, type } = event;
		if (!event.target || !event.currentTarget) {
			event._target = this;
			event._currentTarget = this;
		}

		const capturePhase: EventStore[] = [];
		const bubblePhase: EventStore[] = [];

		if (bubbles || captures) {
			// eslint-disable-next-line consistent-this
			let currentNode = this;
			while (currentNode) {
				if (captures && currentNode._listeners.capturePhase[type]) capturePhase.unshift(currentNode._listeners.capturePhase[type]);
				if (bubbles && currentNode._listeners.bubblePhase[type]) bubblePhase.push(currentNode._listeners.bubblePhase[type]);
				//@ts-ignore todo
				currentNode = currentNode.parentNode;
			}
		}

		if (!captures && this._listeners.capturePhase[type]) capturePhase.push(this._listeners.capturePhase[type]);
		if (!bubbles && this._listeners.bubblePhase[type]) bubblePhase.push(this._listeners.bubblePhase[type]);

		for (const i of capturePhase) {
			dispatchToEventListeners(i, event, cancelable);
			if (!event.bubbles || event._propagationStopped) return !event.defaultPrevented;
		}

		for (const i of bubblePhase) {
			dispatchToEventListeners(i, event, cancelable);
			if (!event.bubbles || event._propagationStopped) return !event.defaultPrevented;
		}

		return !event.defaultPrevented;
	}
}
