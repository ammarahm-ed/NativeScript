import { Application, CustomLayoutView, Utils } from '@nativescript/core';

// const bench = (fn: Function, times = 10) => {
// 	console.time(`bench: ${fn.name}`);
// 	for (let i = 0; i < times; i++) {
// 		fn();
// 	}
// 	console.timeEnd(`bench: ${fn.name}`);
// };

// const makRootView = () => {
// 	console.time('start');
// 	const nativeView = new View();
// 	nativeView.createNativeView();
// 	nativeView.setAttribute('backgroundColor', 'blue');
// 	// bench(function createFlexboxLayout() {
// 	// 	const layout = new FlexboxLayout();
// 	// 	layout._context = Utils.android.getApplicationContext();
// 	// 	layout.createNativeView();
// 	// 	layout.backgroundColor = 'red';
// 	// }, 100);

// 	const androidView = {
// 		nativeView: nativeView.nativeView,
// 		nativeViewProtected: nativeView.nativeView,
// 		cssClasses: {
// 			add: () => {},
// 		},
// 		_setupAsRootView: () => {},
// 		callLoaded: () => {},
// 	};
// 	return androidView;
// };

class CustomView extends CustomLayoutView {
	createNativeView() {
		return new android.view.View(Utils.android.getApplicationContext());
	}
}

Application.run({
	//@ts-ignore
	create: () => {
		const view = new CustomView();
		view.backgroundColor = 'red';
		return view;
	},
});
