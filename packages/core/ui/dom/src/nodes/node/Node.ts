import EventTarget from '../../event/EventTarget';
import type Element from '../element/Element';
import NodeList from './NodeList';
import NodeTypeEnum from './NodeTypeEnum';

/**
 * Node.
 */
export default class Node<EventsMap = {}> extends EventTarget<EventsMap> {
	public static readonly ELEMENT_NODE = NodeTypeEnum.elementNode;
	public static readonly ATTRIBUTE_NODE = NodeTypeEnum.attributeNode;
	public static readonly TEXT_NODE = NodeTypeEnum.textNode;
	public static readonly CDATA_SECTION_NODE = NodeTypeEnum.cdataSectionNode;
	public static readonly COMMENT_NODE = NodeTypeEnum.commentNode;
	public static readonly DOCUMENT_NODE = NodeTypeEnum.documentNode;
	public static readonly DOCUMENT_TYPE_NODE = NodeTypeEnum.documentTypeNode;
	public static readonly DOCUMENT_FRAGMENT_NODE = NodeTypeEnum.documentFragmentNode;
	public static readonly PROCESSING_INSTRUCTION_NODE = NodeTypeEnum.processingInstructionNode;
	public readonly ELEMENT_NODE = NodeTypeEnum.elementNode;
	public readonly ATTRIBUTE_NODE = NodeTypeEnum.attributeNode;
	public readonly TEXT_NODE = NodeTypeEnum.textNode;
	public readonly CDATA_SECTION_NODE = NodeTypeEnum.cdataSectionNode;
	public readonly COMMENT_NODE = NodeTypeEnum.commentNode;
	public readonly DOCUMENT_NODE = NodeTypeEnum.documentNode;
	public readonly DOCUMENT_TYPE_NODE = NodeTypeEnum.documentTypeNode;
	public readonly DOCUMENT_FRAGMENT_NODE = NodeTypeEnum.documentFragmentNode;
	public readonly PROCESSING_INSTRUCTION_NODE = NodeTypeEnum.processingInstructionNode;
	nodeType: NodeTypeEnum = NodeTypeEnum.elementNode;
	nodeName: string = '';
	//@ts-ignore
	_nodeValue: string = null;
	//@ts-ignore
	_textContent: string = null;
	readonly ownerDocument: any;
	//@ts-ignore
	readonly baseURI: string = null;
	//@ts-ignore
	parentElement: Element = null;
	//@ts-ignore
	_parentNode: Node = null;
	//@ts-ignore
	nextSibling: Node = null;
	//@ts-ignore
	previousSibling: Node = null;
	//@ts-ignore
	firstChild: Node = null;
	//@ts-ignore
	lastChild: Node = null;
	isParentNode: boolean = false;
	//@ts-ignore
	localName: string = null;
	constructor() {
		super();
	}

	get parentNode() {
		return this._parentNode;
	}

	get previousElementSibling(): Node {
		let currentNode = this.previousSibling;
		while (currentNode) {
			if (currentNode.nodeType === NodeTypeEnum.elementNode) return currentNode;
			currentNode = currentNode.previousSibling;
		}
		//@ts-ignore
		return null;
	}

	get nextElementSibling(): Node {
		let currentNode = this.nextSibling;
		while (currentNode) {
			if (currentNode.nodeType === NodeTypeEnum.elementNode) return currentNode;
			currentNode = currentNode.nextSibling;
		}
		//@ts-ignore
		return null;
	}

	remove() {
		if (this.parentNode) this.parentNode.removeChild(this as never);
	}

	get childNodes() {
		const childNodes = new NodeList();
		let currentNode = this.firstChild;
		while (currentNode) {
			childNodes.push(currentNode);
			currentNode = currentNode.nextSibling;
		}
		return childNodes;
	}

	/**
	 * Clones a node.
	 *
	 * @param [deep=false] "true" to clone deep.
	 * @returns Cloned node.
	 */
	cloneNode(deep: boolean) {
		let clonedNode: Node;
		if (this.isParentNode) {
			if (this.nodeType === NodeTypeEnum.documentNode)
				//@ts-ignore
				clonedNode = new Document();
			else if (this.nodeType === NodeTypeEnum.documentFragmentNode)
				//@ts-ignore
				clonedNode = new DocumentFragment();
			else {
				clonedNode = this.ownerDocument.createElement(this.localName);
				const sourceAttrs = (this as unknown as Element).attributes;
				for (const { ns, name, value } of sourceAttrs) {
					(clonedNode as Element).setAttributeNS(ns, name, value);
				}
			}

			if (deep) {
				let currentNode = this.firstChild;
				while (currentNode) {
					clonedNode.appendChild(currentNode.cloneNode(deep));
					currentNode = currentNode.nextSibling;
				}
			}
		} else if (this.nodeType === NodeTypeEnum.textNode)
			//@ts-ignore
			clonedNode = new Text(this._nodeValue);
		else if (this.nodeType === NodeTypeEnum.commentNode)
			//@ts-ignore
			clonedNode = new Comment(this._nodeValue);
		//@ts-ignore
		return clonedNode;
	}

	hasChildNodes() {
		return !!this.firstChild;
	}

	/**
	 * Returns "true" if this node contains the other node.
	 *
	 * @param otherNode Node to test with.
	 * @returns "true" if this node contains the other node.
	 */
	public contains(otherNode: Node): boolean {
		for (const childNode of this.childNodes) {
			if (childNode === otherNode || childNode.contains(otherNode)) {
				return true;
			}
		}
		return false;
	}

	insertBefore(newNode: Node, referenceNode: Node): Node {
		//@ts-ignore
		if (referenceNode && referenceNode.parentNode !== this) throw new Error(`[UNDOM-NG] Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`);

		if (newNode === referenceNode) return newNode;

		if (newNode.nodeType === NodeTypeEnum.documentFragmentNode) {
			const { firstChild, lastChild } = newNode;

			if (firstChild && lastChild) {
				let currentNode = firstChild;
				while (currentNode) {
					const nextSibling = currentNode.nextSibling;
					//@ts-ignore
					currentNode.parentNode = this;
					currentNode = nextSibling;
				}

				if (referenceNode) {
					firstChild.previousSibling = referenceNode.previousSibling;
					lastChild.nextSibling = referenceNode;
					referenceNode.previousSibling = lastChild;
				} else {
					firstChild.previousSibling = this.lastChild;
					//@ts-ignore
					lastChild.nextSibling = null;
				}

				if (firstChild.previousSibling) firstChild.previousSibling.nextSibling = firstChild;
				else this.firstChild = firstChild;

				if (lastChild.nextSibling) lastChild.nextSibling.previousSibling = lastChild;
				else this.lastChild = lastChild;
				//@ts-ignore
				newNode.firstChild = null;
				//@ts-ignore
				newNode.lastChild = null;
			}
		} else {
			newNode.remove();
			//@ts-ignore
			newNode.parentNode = this;

			if (referenceNode) {
				newNode.previousSibling = referenceNode.previousSibling;
				newNode.nextSibling = referenceNode;
				referenceNode.previousSibling = newNode;
			} else {
				newNode.previousSibling = this.lastChild;
				this.lastChild = newNode;
			}

			if (newNode.previousSibling) newNode.previousSibling.nextSibling = newNode;
			else this.firstChild = newNode;
		}

		return newNode;
	}

	replaceChild(newChild: Node, oldChild: Node) {
		//@ts-ignore
		if (oldChild.parentNode !== this) throw new Error(`[UNDOM-NG] Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.`);

		const referenceNode = oldChild.nextSibling;
		oldChild.remove();
		//@ts-ignore
		//@ts-ignore
		this.insertBefore(newChild, referenceNode);
		return oldChild;
	}

	removeChild(node: any) {
		if (this.firstChild === node) this.firstChild = node.nextSibling;
		if (this.lastChild === node) this.lastChild = node.previousSibling;
		if (node.previousSibling) node.previousSibling.nextSibling = node.nextSibling;
		if (node.nextSibling) node.nextSibling.previousSibling = node.previousSibling;
		//@ts-ignore
		node.parentNode = null;
		//@ts-ignore
		node.previousSibling = null;
		//@ts-ignore
		node.nextSibling = null;
		return node;
	}

	appendChild(node: Node) {
		//@ts-ignore
		return this.insertBefore(node);
	}

	/**
	 * Converts the node to a string.
	 *
	 * @param listener Listener.
	 */
	public toString(): string {
		return `[object ${this.constructor.name}]`;
	}

	replaceWith(...nodes: Node[]) {
		if (!this.parentNode) return;

		const ref = this.nextSibling;
		const parent = this.parentNode;
		for (const i of nodes) {
			i.remove();
			parent.insertBefore(i, ref);
		}
	}
}
