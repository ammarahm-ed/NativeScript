import Element from '../element/Element';
import NodeTypeEnum from '../node/NodeTypeEnum';

export class HTMLElement<EventsMap = {}> extends Element<EventsMap> {
	constructor(nodeType: NodeTypeEnum, type: string) {
		super(nodeType, type);
	}
}
