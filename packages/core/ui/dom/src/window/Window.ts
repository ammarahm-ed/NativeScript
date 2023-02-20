import AbortSignal from '../event/AbortSignal';
import { Event } from '../event/Event';
import EventTarget from '../event/EventTarget';
import CharacterData from '../nodes/character-data/CharacterData';
import Comment from '../nodes/comment/Comment';
import DocumentFragment from '../nodes/document-fragment/DocumentFragment';
import Document from '../nodes/document/Document';
import Element from '../nodes/element/Element';
import { HTMLElement } from '../nodes/html-element/HTMLElement';
import Node from '../nodes/node/Node';
import NodeList from '../nodes/node/NodeList';
import SVGElement from '../nodes/svg-element/SVGElement';
import Text from '../nodes/text/Text';
import XMLSerializer from '../xml-serializer/XMLSerializer';
/**
 * Browser window.
 *
 * Reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window.
 */
export default class Window {
	public readonly Node = Node;
	public readonly HTMLElement = HTMLElement;
	public readonly Text = Text;
	public readonly Comment = Comment;
	public readonly Element = Element;
	public readonly DocumentFragment = DocumentFragment;
	public readonly CharacterData = CharacterData;
	public readonly Document = Document;
	public readonly Event = Event;
	public readonly EventTarget = EventTarget;
	public readonly XMLSerializer = XMLSerializer;
	public readonly NodeList = NodeList;
	public readonly AbortSignal = AbortSignal;
	public readonly SVGElement = SVGElement;
	public readonly document: Document;
	constructor() {
		this.bindToGlobal();
		//@ts-ignore
		globalThis.htmlElementRegistry = {};
		//@ts-ignore
		globalThis.registerElement = this.registerElement;
		this.document = new Document();
		this.document.defaultView = this;
		//@ts-ignore
		globalThis.window = this;
		//@ts-ignore
		globalThis.document = this.document;
	}

	registerElement(name: string, element: HTMLElement) {
		//@ts-ignore
		element.NODE_TAG_NAME = name;
		//@ts-ignore
		globalThis.htmlElementRegistry[name] = element;
	}

	bindToGlobal() {
		//@ts-ignore
		globalThis.Node = Node;
		//@ts-ignore
		globalThis.HTMLElement = HTMLElement;
		//@ts-ignore
		globalThis.Text = Text;
		//@ts-ignore
		globalThis.Comment = Comment;
		//@ts-ignore
		globalThis.Element = Element;
		//@ts-ignore
		globalThis.DocumentFragment = DocumentFragment;
		//@ts-ignore
		globalThis.CharacterData = CharacterData;
		//@ts-ignore
		globalThis.Document = Document;
		//@ts-ignore
		globalThis.Event = Event;
		//@ts-ignore
		globalThis.EventTarget = EventTarget;
		//@ts-ignore
		globalThis.XMLSerializer = XMLSerializer;
		//@ts-ignore
		globalThis.SVGElement = SVGElement;
		//@ts-ignore
		globalThis.NodeList = NodeList;
		//@ts-ignore
		globalThis.AbortSignal = AbortSignal;

		return this;
	}
}
