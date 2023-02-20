export { HTMLElement } from './src/nodes/html-element/HTMLElement';
export { Event } from './src/event/Event';
export type { DOMEvent, DOMEventWithData } from './src/event/NativeDomEvent';
import GlobalWindow from './src/window/Window';
export const Window = GlobalWindow;
new Window().bindToGlobal();
console.log('called');
