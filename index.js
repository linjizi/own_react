function createTextElement(text) {
	return {
		type: "TEXT_ELEMENT",
		props: {
			nodeValue: text,
			children: [],
		},
	};
}

function createElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children: children.map((child) =>
				typeof child === "object" ? child : createTextElement(child)
			),
		},
	};
}

function assignProps(dom, props) {
	const propsEntries = Object.entries(props);
	for (const [key, value] of propsEntries) {
		dom[key] = value;
	}
}

function render(element, container) {
	const { children, ...props } = element.props;
	const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type);
	for (const child of children) {
		render(child, dom);
	}
	assignProps(dom, props)

	container.appendChild(dom);
}

const ReactDidact = {
	createElement,
	render,
};

// when babel transpiles the JSX it will use the function we define.
/** @jsx ReactDidact.createElement */
const element = (
	<div id="foo">
		<a>bar</a>
		<b />
	</div>
);

// 上述jsx通过babel转译后
// const element = ReactDidact.createElement("div", { id: "foo" }, ReactDidact.createElement("a", null, "bar"), ReactDidact.createElement("b"));

const container = document.getElementById("root");
ReactDidact.render(element, container);
