import { Event } from './Event';
import IEventTarget from './IEventTarget';
export interface DOMEvent<T extends IEventTarget> extends Event {
	_currentTarget: T;
	_target: T;
	get target(): T;
}

export type DOMEventWithData<T extends IEventTarget, EventData> = DOMEvent<T> & EventData;
