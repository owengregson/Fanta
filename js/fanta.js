// fanta.js

function generateHumanLikePath(
	startCenter,
	endCenter,
	startRadius,
	endRadius,
	params
) {
	// Extract parameters
	const FITTS_A = parseFloat(params.FITTS_A);
	const FITTS_B = parseFloat(params.FITTS_B);
	const MIN_STEPS = parseInt(params.MIN_STEPS);
	const CONTROL_POINT_VARIANCE = parseFloat(params.CONTROL_POINT_VARIANCE);
	const NOISE_AMPLITUDE = parseFloat(params.NOISE_AMPLITUDE);
	const JITTER_AMPLITUDE = parseFloat(params.JITTER_AMPLITUDE);
	const PAUSE_PROBABILITY = parseFloat(params.PAUSE_PROBABILITY);
	const OVERSHOOT_PROBABILITY = parseFloat(params.OVERSHOOT_PROBABILITY);
	const SPEED_VARIABILITY = parseFloat(params.SPEED_VARIABILITY);

	// Calculate the distance (D) between start and end centers
	var dx = endCenter.x - startCenter.x;
	var dy = endCenter.y - startCenter.y;
	var D = Math.sqrt(dx * dx + dy * dy);

	// Calculate angle from start to end
	var angle = Math.atan2(dy, dx);

	// Adjust start and end points to be on the edge of the circles
	var start = {
		x: startCenter.x + startRadius * Math.cos(angle),
		y: startCenter.y + startRadius * Math.sin(angle),
	};
	var end = {
		x: endCenter.x - endRadius * Math.cos(angle),
		y: endCenter.y - endRadius * Math.sin(angle),
	};

	// Use the target width (W) as the diameter of the end circle
	var W = endRadius * 2; // Diameter

	// Calculate the Index of Difficulty (ID) using Fitts's Law
	var ID = Math.log2(D / W + 1);

	// Constants a and b (adjustable)
	var a = FITTS_A;
	var b = FITTS_B;

	// Calculate the Movement Time (MT)
	var MT = a + b * ID;

	// Determine the number of steps based on MT and speed variability
	var baseSteps = Math.max(Math.round(MT * 100), MIN_STEPS);
	var steps =
		baseSteps +
		Math.round((Math.random() - 0.5) * SPEED_VARIABILITY * baseSteps);

	// Generate control points for the Bezier curve with curvature
	function getRandomControlPoint(p1, p2) {
		var t = Math.random();
		var variance = D * CONTROL_POINT_VARIANCE;
		var directionBias = (Math.random() - 0.5) * variance;

		// Introduce natural curvature
		var normalAngle = angle + Math.PI / 2; // Perpendicular to the movement direction
		return {
			x: p1.x + t * (p2.x - p1.x) + directionBias * Math.cos(normalAngle),
			y: p1.y + t * (p2.y - p1.y) + directionBias * Math.sin(normalAngle),
		};
	}

	var cp1 = getRandomControlPoint(start, end);
	var cp2 = getRandomControlPoint(start, end);

	// Generate points along the Bezier curve
	var points = [];

	for (var i = 0; i <= steps; i++) {
		var t = i / steps;
		var x = cubicBezier(t, start.x, cp1.x, cp2.x, end.x);
		var y = cubicBezier(t, start.y, cp1.y, cp2.y, end.y);

		// Apply bell-shaped speed profile
		var speedFactor = bellShapedSpeedProfile(t);

		// Add jitter (micro-movements)
		var jitterX = (Math.random() - 0.5) * JITTER_AMPLITUDE;
		var jitterY = (Math.random() - 0.5) * JITTER_AMPLITUDE;

		// Add noise to the points
		var noiseX = (Math.random() - 0.5) * NOISE_AMPLITUDE;
		var noiseY = (Math.random() - 0.5) * NOISE_AMPLITUDE;

		points.push({
			x: x + noiseX + jitterX,
			y: y + noiseY + jitterY,
			speedFactor: speedFactor,
		});
	}

	// Introduce pauses or hesitations
	points = applyPauses(points, PAUSE_PROBABILITY);

	// Introduce overshooting and corrections
	if (Math.random() < OVERSHOOT_PROBABILITY) {
		points = applyOvershoot(points, end);
	}

	return points;
}

function cubicBezier(t, p0, p1, p2, p3) {
	var u = 1 - t;
	return (
		u * u * u * p0 +
		3 * u * u * t * p1 +
		3 * u * t * t * p2 +
		t * t * t * p3
	);
}

// Bell-shaped speed profile function
function bellShapedSpeedProfile(t) {
	return Math.sin(Math.PI * t);
}

// Apply pauses/hestitations to the movement
function applyPauses(points, pauseProbability) {
	return points
		.map((point, index) => {
			if (
				Math.random() < pauseProbability &&
				index > 0 &&
				index < points.length - 1
			) {
				// Duplicate the point to create a pause effect
				return [point, point];
			}
			return point;
		})
		.flat();
}

// Apply overshoot and correction near the target
function applyOvershoot(points, endPoint) {
	// Overshoot the last few points
	var overshootDistance = 10; // Adjust as needed
	var lastPoint = points[points.length - 1];
	var angle = Math.atan2(endPoint.y - lastPoint.y, endPoint.x - lastPoint.x);
	var overshootPoint = {
		x: endPoint.x + overshootDistance * Math.cos(angle),
		y: endPoint.y + overshootDistance * Math.sin(angle),
	};

	points.push(overshootPoint);

	// Add correction back to the end point
	points.push({
		x: endPoint.x,
		y: endPoint.y,
	});

	return points;
}

function bellShapedSpeedProfile(t) {
	// Ensure the speed factor is always positive and not zero
	return Math.sin(Math.PI * t) + 0.01; // Add a small value to avoid division by zero
}