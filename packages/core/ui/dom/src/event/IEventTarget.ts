import IEventListener from './IEventListener';
import { Event } from './Event';

export type EventOptions = {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
};

/**
 * Handles events.
 */
export default interface IEventTarget<EventsMap = {}> {
	/**
	 * Adds an event listener.
	 *
	 * @param type Event type.
	 * @param listener Listener.
	 */
	addEventListener<EventName extends keyof EventsMap>(type: EventName, listener: ((event: Event<EventsMap, EventName>) => void) | IEventListener<EventsMap>, options?: EventOptions): void;

	/**
	 * Adds an event listener.
	 *
	 * @param type Event type.
	 * @param listener Listener.
	 */
	removeEventListener<EventName extends keyof EventsMap>(type: EventName, listener: ((event: Event<EventsMap, EventName>) => void) | IEventListener<EventsMap>, options?: EventOptions): void;

	/**
	 * Dispatches an event.
	 *
	 * @param event Event.
	 * @returns The return value is false if event is cancelable and at least one of the event handlers which handled this event called Event.preventDefault().
	 */
	dispatchEvent<EventName extends keyof EventsMap>(event: Event<EventsMap, EventName>): boolean;
}
