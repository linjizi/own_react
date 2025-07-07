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

function createDom(fiber) {
	const { dom, props } = fiber;
	const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type);
	assignProps(dom, props)

	return dom;
}

function render(element, container) {
	nextUnitOfWork = {
		dom: container,
		props: {
			children: [element],
		},
	}
}

let nextUnitOfWork = null

function workLoop(deadline) {
	let shouldYield = false
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
		/*
			返回当前空闲期间剩余的估计毫秒数
			若时间大于1ms，继续执行下一个工作单元
			时间小于1ms，退出
		*/
		shouldYield = deadline.timeRemaining() < 1
	}
	// 下一次空闲时间执行
	requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
	if (!fiber.dom) {
		fiber.dom = createDom(fiber)
	}

	if (fiber.parent) {
		fiber.parent.dom.appendChild(fiber.dom)
	}

	const elements = fiber.props.children
	let index = 0
	let prevSibling = null

	while (index < elements.length) {
		const element = elements[index]

		const newFiber = {
			type: element.type,
			props: element.props,
			parent: fiber,
			dom: null,
		}
		if (index === 0) {
			fiber.child = newFiber
		} else {
			prevSibling.sibling = newFiber
		}

		prevSibling = newFiber
		index++
	}
	if (fiber.child) {
		return fiber.child
	}
	let nextFiber = fiber
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling
		}
		nextFiber = nextFiber.parent

	}
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