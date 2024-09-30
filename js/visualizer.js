// visualizer.js

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resetButton = document.getElementById("resetButton");
const exportButton = document.getElementById("exportButton");
const simulateButton = document.getElementById("simulateButton");
const parameterGUI = document.getElementById("parameterGUI");

// Parameter Inputs
const fittsAInput = document.getElementById("fittsA");
const fittsBInput = document.getElementById("fittsB");
const minStepsInput = document.getElementById("minSteps");
const controlPointVarianceInput = document.getElementById(
	"controlPointVariance"
);
const noiseAmplitudeInput = document.getElementById("noiseAmplitude");
const jitterAmplitudeInput = document.getElementById("jitterAmplitude");
const pauseProbabilityInput = document.getElementById("pauseProbability");
const overshootProbabilityInput = document.getElementById(
	"overshootProbability"
);
const speedVariabilityInput = document.getElementById("speedVariability");

// Classification Elements
const classificationGUI = document.getElementById("classificationGUI");
const humanButton = document.getElementById("humanButton");
const algorithmButton = document.getElementById("algorithmButton");
const completeButton = document.getElementById("completeButton");
const accuracyDisplay = document.getElementById("accuracyDisplay");

let canvasRect = canvas.getBoundingClientRect();
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let startCircle = { x: 0, y: 0, radius: 15, color: "gray", opacity: 0.8 };
let endCircle = { x: 0, y: 0, radius: 15, color: "green", opacity: 0.8 };

let isDrawing = false;
let path = [];
let reachedEnd = false;
let minDist = 10; // Minimum distance between points in the path
let minCircleDist = 100; // Minimum distance between start and end circles

let totalClassifications = 0;
let correctClassifications = 0;
let currentPathIsHuman = false;

function randomPosition(radius) {
	let position;
	do {
		position = {
			x: radius + Math.random() * (canvas.width - 2 * radius),
			y: radius + Math.random() * (canvas.height - 2 * radius),
		};
	} while (isInsideGUI(position, radius));
	return position;
}

function isInsideGUI(point, radius) {
	// Get bounding rectangles of GUI elements
	const guiElements = [parameterGUI, classificationGUI];

	// Get all buttons on the page
	const buttons = document.querySelectorAll("button");
	buttons.forEach((button) => {
		guiElements.push(button);
	});

	// Adjust for canvas position (if canvas is not at (0,0))
	const canvasRect = canvas.getBoundingClientRect();

	// Adjust point coordinates relative to the viewport
	const adjustedPoint = {
		x: point.x + canvasRect.left,
		y: point.y + canvasRect.top,
	};

	// Check against all GUI elements and buttons
	for (let elem of guiElements) {
		const rect = elem.getBoundingClientRect();
		if (
			adjustedPoint.x + radius >= rect.left &&
			adjustedPoint.x - radius <= rect.right &&
			adjustedPoint.y + radius >= rect.top &&
			adjustedPoint.y - radius <= rect.bottom
		) {
			return true;
		}
	}

	return false;
}

function drawCircle(circle) {
	ctx.globalAlpha = circle.opacity;
	ctx.fillStyle = circle.color;
	ctx.beginPath();
	ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;
}

function drawPath() {
	if (path.length < 2) return;
	ctx.strokeStyle = reachedEnd ? "red" : "black";
	ctx.lineWidth = 2;
	ctx.beginPath();

	let startedDrawing = false;
	for (let i = 1; i < path.length; i++) {
		const point = path[i];
		const prevPoint = path[i - 1];

		if (
			!isInsideCircle(point, startCircle) &&
			!isInsideCircle(point, endCircle)
		) {
			if (!startedDrawing) {
				ctx.moveTo(prevPoint.x, prevPoint.y);
				startedDrawing = true;
			}
			ctx.lineTo(point.x, point.y);
		} else {
			startedDrawing = false;
		}
	}

	ctx.stroke();
}

function isInsideCircle(point, circle) {
	const dx = point.x - circle.x;
	const dy = point.y - circle.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance <= circle.radius;
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function calculateDistance(p1, p2) {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

function init(isResize = false) {
	if (!isResize) {
		isDrawing = false;
		path = [];
		reachedEnd = false;
		resetButton.style.display = "none";
		exportButton.style.display = "none";
		simulateButton.style.display = "block";
		parameterGUI.style.display = "block";
		classificationGUI.style.display = "none";
		startCircle.opacity = 0.8;
		endCircle.opacity = 0.8;

		// Set random positions for circles with minCircleDist between them
		do {
            Object.assign(startCircle, randomPosition(startCircle.radius));
            Object.assign(endCircle, randomPosition(endCircle.radius));
        } while (
            calculateDistance(startCircle, endCircle) < minCircleDist ||
            isInsideGUI(startCircle, startCircle.radius) ||
            isInsideGUI(endCircle, endCircle.radius)
        );
	}

	clearCanvas();
	drawCircle(startCircle);
	drawCircle(endCircle);
}

canvas.addEventListener("mousemove", (e) => {
	if (reachedEnd) return;

	currentPathIsHuman = true;

	const mousePos = { x: e.clientX, y: e.clientY };

	if (!isDrawing) {
		const dx = mousePos.x - startCircle.x;
		const dy = mousePos.y - startCircle.y;
		if (Math.sqrt(dx * dx + dy * dy) <= startCircle.radius) {
			isDrawing = true;
			path.push(mousePos);
		}
	} else {
		// Only add point if it's far enough from the last point
		const lastPoint = path[path.length - 1];
		if (!lastPoint || calculateDistance(mousePos, lastPoint) >= minDist) {
			path.push(mousePos);
		}

		clearCanvas();
		drawCircle(startCircle);
		drawCircle(endCircle);
		drawPath();

		const dx = mousePos.x - endCircle.x;
		const dy = mousePos.y - endCircle.y;
		if (Math.sqrt(dx * dx + dy * dy) <= endCircle.radius) {
			reachedEnd = true;
			startCircle.opacity = 0.5;
			endCircle.opacity = 0.5;
			clearCanvas();
			drawCircle(startCircle);
			drawCircle(endCircle);
			drawPath();
			resetButton.style.display = "block";
			exportButton.style.display = "block";
			simulateButton.style.display = "none"; // Hide simulate button
			parameterGUI.style.display = "none"; // Hide parameter GUI
			classificationGUI.style.display = "block"; // Show classification GUI
		}
	}
});

resetButton.addEventListener("click", () => {
	init(false);
	classificationGUI.style.display = "none";
	accuracyDisplay.innerText = "";
});

exportButton.addEventListener("click", () => {
	// Prepare the data
	const normalizedPath = path
		.filter((point) => {
			return (
				!isInsideCircle(point, startCircle) &&
				!isInsideCircle(point, endCircle)
			);
		})
		.map((point) => ({
			x: point.x / canvas.width,
			y: point.y / canvas.height,
		}));

	const data = {
		start: {
			x: startCircle.x / canvas.width,
			y: startCircle.y / canvas.height,
		},
		end: {
			x: endCircle.x / canvas.width,
			y: endCircle.y / canvas.height,
		},
		path: normalizedPath,
	};

	const jsonData = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonData], { type: "application/json" });

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "mouse_path_data.json";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
});

// Event listener for the simulate button
simulateButton.addEventListener("click", () => {
	// Collect parameters from the GUI
	const params = {
		FITTS_A: fittsAInput.value,
		FITTS_B: fittsBInput.value,
		MIN_STEPS: minStepsInput.value,
		CONTROL_POINT_VARIANCE: controlPointVarianceInput.value,
		NOISE_AMPLITUDE: noiseAmplitudeInput.value,
		JITTER_AMPLITUDE: jitterAmplitudeInput.value,
		PAUSE_PROBABILITY: pauseProbabilityInput.value,
		OVERSHOOT_PROBABILITY: overshootProbabilityInput.value,
		SPEED_VARIABILITY: speedVariabilityInput.value,
	};

	// Generate the human-like path
	const pathPoints = generateHumanLikePath(
		{ x: startCircle.x, y: startCircle.y },
		{ x: endCircle.x, y: endCircle.y },
		startCircle.radius,
		endCircle.radius,
		params
	);

	// Simulate the movement (currentPathIsHuman = false)
	simulateMovement(pathPoints, false);
});

// Function to simulate movement along the generated path
function simulateMovement(pathPoints, isHuman = false) {
	currentPathIsHuman = isHuman;
	let index = 0;
	const totalPoints = pathPoints.length;

	// Initialize path array
	path = [];

	// Calculate total animation time and delays
	const totalAnimationTime = 200; // Total time in milliseconds

	// Extract speed factors and invert them to get relative durations
	const speedFactors = pathPoints.map((point) => point.speedFactor || 1);
	const invertedSpeeds = speedFactors.map((s) => 1 / s);

	// Calculate the sum of inverted speeds
	const totalInvertedSpeed = invertedSpeeds.reduce(
		(acc, val) => acc + val,
		0
	);

	// Calculate the actual delay per frame based on the inverted speed
	const delays = invertedSpeeds.map(
		(s) => (s / totalInvertedSpeed) * totalAnimationTime
	);

	function animate() {
		if (index >= totalPoints) {
			reachedEnd = true;
			startCircle.opacity = 0.5;
			endCircle.opacity = 0.5;
			clearCanvas();
			drawCircle(startCircle);
			drawCircle(endCircle);
			drawPath();
			resetButton.style.display = "block";
			exportButton.style.display = "block";
			simulateButton.style.display = "none"; // Hide simulate button
			parameterGUI.style.display = "none"; // Hide parameter GUI
			classificationGUI.style.display = "block"; // Show classification GUI
			return;
		}

		const currentPoint = pathPoints[index];

		// Only add point if it's far enough from the last point
		const lastPoint = path[path.length - 1];
		if (
			!lastPoint ||
			calculateDistance(currentPoint, lastPoint) >= minDist
		) {
			// Exclude points inside the circles
			if (
				!isInsideCircle(currentPoint, startCircle) &&
				!isInsideCircle(currentPoint, endCircle)
			) {
				path.push(currentPoint);
			}
		}

		clearCanvas();
		drawCircle(startCircle);
		drawCircle(endCircle);
		drawPath();

		const delay = delays[index] || 0;
		index++;

		setTimeout(() => {
			requestAnimationFrame(animate);
		}, delay);
	}

	animate();
}

// Classification Button Event Listeners
humanButton.addEventListener("click", () => {
	totalClassifications++;
	if (currentPathIsHuman) correctClassifications++;
	classificationGUI.style.display = "none";
});

algorithmButton.addEventListener("click", () => {
	totalClassifications++;
	if (!currentPathIsHuman) correctClassifications++;
	classificationGUI.style.display = "none";
});

completeButton.addEventListener("click", () => {
	const accuracy = (
		(correctClassifications / totalClassifications) *
		100
	).toFixed(2);
	accuracyDisplay.innerText = `Accuracy: ${accuracy}%`;
});

// Initialize the canvas on page load
window.addEventListener("load", () => init(false));

// Handle window resize
window.addEventListener("resize", () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvasRect = canvas.getBoundingClientRect();
	init(true);
});
