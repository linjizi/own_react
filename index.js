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

function assignProps(dom, props) {
	const propsEntries = Object.entries(props);
	for (const [key, value] of propsEntries) {
		dom[key] = value;
	}
}

function createDom(fiber) {
	const { props } = fiber;
	const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);
	assignProps(dom, props);

	return dom;
}

function render(element, container) {
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
		alternate: currentRoot,
	};
	deletions = []
	nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null

const isEvent = key => key.startsWith("on")
const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
	//Remove old or changed event listeners
	Object.keys(prevProps)
		.filter(isEvent)
		.filter(
			key =>
				isGone(prevProps, nextProps)(key) ||
				isNew(prevProps, nextProps)(key)
		)
		.forEach(name => {
			const eventType = name
				.toLowerCase()
				.substring(2)
			dom.removeEventListener(
				eventType,
				prevProps[name]
			)
		})

	// Set new or changed properties
	Object.keys(nextProps)
		.filter(isProperty)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			dom[name] = nextProps[name]
		})

	// Add event listeners
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			const eventType = name
				.toLowerCase()
				.substring(2)
			dom.addEventListener(
				eventType,
				nextProps[name]
			)
		})
}

function commitRoot() {
	deletions.forEach(commitWork)
	commitWork(wipRoot.child);
	currentRoot = wipRoot;
	wipRoot = null;
}

function commitWork(fiber) {

	if (!fiber) {
		return;
	}
	const domParent = fiber.parent.dom;
	if (
		fiber.effectTag === "PLACEMENT" &&
		fiber.dom != null
	) {
		domParent.appendChild(fiber.dom)
	} else if (
		fiber.effectTag === "UPDATE" &&
		fiber.dom != null
	) {
		updateDom(
			fiber.dom,
			fiber.alternate.props,
			fiber.props
		)
	} else if (fiber.effectTag === "DELETION") {
		domParent.removeChild(fiber.dom)
	}
	commitWork(fiber.child);
	commitWork(fiber.sibling);
}

function workLoop(deadline) {
	let shouldYield = false;
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		/*
			返回当前空闲期间剩余的估计毫秒数
			若时间大于1ms，继续执行下一个工作单元
			时间小于1ms，退出
		*/
		shouldYield = deadline.timeRemaining() < 1;
	}

	if (!nextUnitOfWork && wipRoot) {
		commitRoot();
	}

	// 下一次空闲时间执行
	requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let oldFiber = wipFiber.alternate?.child ?? null;
	let prevSibling = null;

	while (index < elements.length || oldFiber !== null) {
		const element = elements[index];
		let newFiber = null;

		const sameType = oldFiber && element && element.type == oldFiber.type;

		if (sameType) {
			newFiber = {
				type: oldFiber.type,
				props: element.props,
				dom: oldFiber.dom,
				parent: wipFiber,
				alternate: oldFiber,
				effectTag: "UPDATE",
			}
		}
		if (element && !sameType) {
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				alternate: null,
				effectTag: "PLACEMENT",
			}
		}
		if (oldFiber && !sameType) {
			oldFiber.effectTag = "DELETION"
			deletions.push(oldFiber)
		}

		if (oldFiber) {
			oldFiber = oldFiber.sibling
		}
		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
		index++;
	}
}

function performUnitOfWork(fiber) {
	if (!fiber.dom) {
		fiber.dom = createDom(fiber);
	}

	const elements = fiber.props.children;

	reconcileChildren(fiber, elements);

	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
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
