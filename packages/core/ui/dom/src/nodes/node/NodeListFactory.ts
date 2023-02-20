import Node from './Node';
import INodeList from './INodeList';

/**
 *
 */
export default class NodeListFactory {
	/**
	 * Creates a NodeList.
	 *
	 * @param nodes Nodes.
	 * @returns NodeList.
	 */
	public static create(nodes?: Node[]): INodeList<Node> {
		nodes = nodes ? nodes.slice() : [];
		Object.defineProperty(nodes, 'item', {
			value: this.getItem.bind(null, nodes),
		});
		return <INodeList<Node>>nodes;
	}

	/**
	 * Returns node by index.
	 *
	 * @param nodes
	 * @param index Index.
	 */
	private static getItem(nodes: Node[], index: number): Node {
		return nodes[index] || null;
	}
}
