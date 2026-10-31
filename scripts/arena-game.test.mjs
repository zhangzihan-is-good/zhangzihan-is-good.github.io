import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../dist/hobbies-arena.js', import.meta.url), 'utf8').catch(error => { if (error.code !== 'ENOENT') throw error; return fs.readFile(new URL('../hobbies-arena.js', import.meta.url), 'utf8'); });
const {segmentDistanceSquared, intersectsCone, dashDestination, simulationSteps} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// Projectile collision checks the entire path, not just its final position.
assert.equal(segmentDistanceSquared(10, 10, 0, 0, 20, 0), 100);
assert.equal(segmentDistanceSquared(50, 0, 0, 0, 100, 0), 0);
assert.equal(segmentDistanceSquared(5, 5, 0, 0, 0, 0), 50);
assert.equal(segmentDistanceSquared(30, 0, 0, 0, 20, 0), 100);

const cone = {x: 0, y: 0, angle: 0, spread: Math.PI / 6, radius: 100};
assert.ok(intersectsCone({x: 40, y: 0, radius: 5}, cone));
assert.ok(!intersectsCone({x: -20, y: 0, radius: 5}, cone));
assert.ok(!intersectsCone({x: 120, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: 104, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: 50, y: 31, radius: 5}, cone)); // Clips a radial edge.
assert.ok(!intersectsCone({x: 50, y: 41, radius: 5}, cone));
assert.ok(intersectsCone({x: 0, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: -40, y: 0, radius: 5}, {...cone, angle: Math.PI})); // Angle wrapping.

const player = {x: 450, y: 260, radius: 12};
const destination = dashDestination(player, {x: 3, y: 4});
assert.ok(Math.abs(Math.hypot(destination.x - player.x, destination.y - player.y) - 135) < 1e-9);
assert.deepEqual(dashDestination({x: 60, y: 60, radius: 12}, {x: -1, y: -1}), {x: 52, y: 52});
assert.deepEqual(dashDestination(player, {x: 0, y: 0}), {x: 450, y: 260});

// A 45-second active round stays 45 seconds at 10, 20, 30, 60 and 120 fps.
for (const fps of [10, 20, 30, 60, 120]) {
  let elapsed = 0;
  for (let frame = 0; frame < 45 * fps; frame++) {
    const steps = simulationSteps(1 / fps);
    assert.ok(steps.every(dt => dt <= 1 / 120 + 1e-12));
    elapsed += steps.reduce((sum, dt) => sum + dt, 0);
  }
  assert.ok(Math.abs(elapsed - 45) < 1e-9, `Round duration drifted at ${fps} fps`);
}
assert.equal(simulationSteps(.8), null); // A foreground stall requests pause, not punishment.
assert.equal(simulationSteps(NaN), null);
assert.deepEqual(simulationSteps(0), []);
assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(source));
console.log('Arena: swept collision, sector collision, bounded dash, low-fps timing and no-save checks passed.');
