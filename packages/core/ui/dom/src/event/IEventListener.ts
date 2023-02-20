import { Event } from './Event';

/**
 * Event listener.
 */
export default interface IEventListener<EventsMap = {}> {
	/**
	 * Handles event.
	 *
	 * @param event Event.
	 */
	handleEvent<EventName extends keyof EventsMap>(event: Event<EventsMap, EventName>): void;
}
