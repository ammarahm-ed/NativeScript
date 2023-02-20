import Element from '../element/Element';
import Node from '../node/Node';

export default interface IParentNode extends Node {
	get childElementCount(): number;
	get firstElementChild(): Element;
	get lastElementChild(): Element;
	readonly children: Element[];

	/**
	 * Inserts a set of Node objects or DOMString objects after the last child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.
	 *
	 * @param nodes List of Node or DOMString.
	 */
	append(...nodes: (Node | string)[]): void;

	// /**
	//  * Inserts a set of Node objects or DOMString objects before the first child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.
	//  *
	//  * @param nodes List of Node or DOMString.
	//  */
	// prepend(...nodes: (INode | string)[]): void;

	// /**
	//  * Query CSS Selector to find matching node.
	//  *
	//  * @param selector CSS selector.
	//  * @returns Matching element.
	//  */
	// querySelector(selector: string): Element;

	// /**
	//  * Query CSS selector to find matching nodes.
	//  *
	//  * @param selector CSS selector.
	//  * @returns Matching elements.
	//  */
	// querySelectorAll(selector: string): INodeList<Element>;

	// /**
	//  * Returns an elements by class name.
	//  *
	//  * @param className Tag name.
	//  * @returns Matching element.
	//  */
	// getElementsByClassName(className: string): IHTMLCollection<Element>;

	// /**
	//  * Returns an elements by tag name.
	//  *
	//  * @param tagName Tag name.
	//  * @returns Matching element.
	//  */
	// getElementsByTagName(tagName: string): IHTMLCollection<Element>;

	// /**
	//  * Returns an elements by tag name and namespace.
	//  *
	//  * @param namespaceURI Namespace URI.
	//  * @param tagName Tag name.
	//  * @returns Matching element.
	//  */
	// getElementsByTagNameNS(namespaceURI: string, tagName: string): IHTMLCollection<Element>;

	/**
	 * Replaces the existing children of a node with a specified new set of children.
	 *
	 * @param nodes List of Node or DOMString.
	 */
	replaceChildren(...nodes: Node[]): void;

	get textContent(): string;
	set textContent(value: string);
}
