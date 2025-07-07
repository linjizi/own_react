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
			children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))),
		},
	};
}

const ReactDidact = {
  createElement,
}

// when babel transpiles the JSX it will use the function we define.
/** @jsx ReactDidact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

// 上述jsx通过babel转译后
// const element = ReactDidact.createElement("div", { id: "foo" }, ReactDidact.createElement("a", null, "bar"), ReactDidact.createElement("b"));

const container = document.getElementById("root");
ReactDOM.render(element, container);
