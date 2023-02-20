import Node from '../node/Node';
import IDocumentFragment from './IDocumentFragment';
import ParentNode from '../parent-node/ParentNode';

/**
 * DocumentFragment.
 */
export default class DocumentFragment extends ParentNode implements IDocumentFragment {
	public nodeType = Node.DOCUMENT_FRAGMENT_NODE;
	public nodeName: string = '#document-fragment';
}
