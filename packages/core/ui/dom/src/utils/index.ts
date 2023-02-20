export const toLower = (str: string) => String(str).toLowerCase();

// eslint-disable-next-line max-params
export const findWhere = (arr: any[], fn: (val: any) => any, returnIndex: boolean, byValue: any) => {
	let i = arr.length;
	while (i) {
		i -= 1;
		const val = arr[i];
		if (byValue) {
			if (val === fn) return returnIndex ? i : val;
		} else if (fn(val)) return returnIndex ? i : val;
	}
};

// eslint-disable-next-line max-params
export const splice = (arr: any[], item: any, add: any, byValue: any) => {
	const i = arr ? findWhere(arr, item, true, byValue) : -1;
	if (i > -1) {
		if (add) arr.splice(i, 0, add);
		else arr.splice(i, 1);
	}
	return i;
};

export const createAttributeFilter = (ns, name) => (o) => o.ns === ns && toLower(o.name) === toLower(name);

const addToArrayProp = (node, key, item, ref) => {
	if (!node[key]) node[key] = [];

	let currentArr = node[key];

	let refIndex = currentArr.indexOf(ref);
	if (refIndex < 0) refIndex = node[key].length;

	//if (currentArr instanceof any) {
	//	currentArr.splice(refIndex, 0, item);
	//} else {
	currentArr = currentArr.slice();
	currentArr.splice(refIndex, 0, item);
	node[key] = currentArr;
	//}
};

const removeFromArrayProp = (node, key, item) => {
	if (!node[key]) return;

	let currentArr = node[key];
	const itemIndex = currentArr.indexOf(item);
	if (itemIndex < 0) return;

	//if (currentArr instanceof any) {
	//	currentArr.splice(itemIndex, 1);
	//} else {
	currentArr = currentArr.slice();
	currentArr.splice(itemIndex, 1);
	node[key] = currentArr;
	//}
};

export const DOMUtils = {
	addToArrayProp,
	removeFromArrayProp,
};
