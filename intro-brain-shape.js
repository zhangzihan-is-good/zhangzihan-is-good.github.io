// Lateral human brain, facing left. Original curves for a decorative animation.
const parts = [
  {
    kind: 'stem',
    center: [30, 78],
    depth: 14,
    outline: [[8, 52], [26, 62], [53, 62], [58, 81], [46, 100], [43, 120],
      [47, 130], [22, 135], [16, 115], [14, 96], [-1, 77]],
    folds: [[[6, 74], [19, 81], [28, 92], [30, 112], [35, 127]]],
  },
  {
    kind: 'cerebellum',
    center: [122, 73],
    depth: 34,
    outline: [[53, 41], [75, 25], [114, 22], [149, 32], [176, 48], [183, 67],
      [180, 83], [170, 97], [151, 107], [129, 115], [105, 113], [84, 106],
      [68, 94], [60, 78], [55, 62]],
    folds: [
      [[63, 58], [84, 46], [110, 44], [139, 45], [165, 56]],
      [[62, 69], [87, 57], [109, 56], [142, 58], [174, 68]],
      [[66, 81], [92, 69], [116, 68], [148, 71], [175, 78]],
      [[72, 91], [100, 81], [124, 80], [150, 83], [168, 88]],
      [[85, 100], [107, 92], [135, 91], [157, 94]],
      [[101, 108], [121, 102], [142, 101]],
    ],
  },
  {
    kind: 'cortex',
    center: [2, -21],
    depth: 67,
    outline: [[-207, 3], [-212, -15], [-201, -38], [-194, -61], [-174, -74],
      [-162, -96], [-137, -101], [-113, -118], [-88, -119], [-66, -131],
      [-40, -128], [-20, -136], [9, -129], [32, -133], [62, -123],
      [86, -120], [108, -106], [134, -102], [150, -86], [175, -75],
      [185, -57], [203, -43], [212, -21], [209, -1], [213, 14],
      [201, 31], [177, 38], [159, 48], [132, 51], [108, 54],
      [86, 56], [65, 69], [40, 73], [19, 84], [-7, 87], [-24, 82],
      [-52, 85], [-75, 78], [-90, 68], [-103, 58], [-125, 60],
      [-146, 52], [-172, 44], [-186, 32], [-201, 23]],
    folds: [
      // Central and lateral sulci establish the four-lobe silhouette.
      [[22, -124], [10, -103], [23, -86], [13, -66], [8, -47], [-10, -30], [-6, -10]],
      [[-107, 46], [-86, 24], [-61, 16], [-38, 2], [-14, 3], [17, -13], [39, -15], [65, -37], [98, -43]],
      [[-18, -125], [-27, -106], [-14, -88], [-22, -72], [-15, -58], [-33, -41], [-35, -22]],
      [[51, -117], [42, -101], [53, -83], [42, -66], [32, -51], [35, -37]],
      // Frontal gyri.
      [[-169, -69], [-149, -66], [-125, -80], [-108, -75], [-86, -91], [-58, -88], [-44, -103], [-47, -117]],
      [[-193, -40], [-168, -42], [-152, -51], [-133, -43], [-113, -51], [-101, -46], [-78, -62], [-49, -58], [-43, -73]],
      [[-199, -13], [-183, -25], [-161, -21], [-151, -10], [-131, -16], [-112, -10], [-97, -23], [-70, -20], [-58, -34]],
      [[-192, 18], [-169, 12], [-155, 25], [-132, 21], [-120, 32], [-101, 21], [-86, 7], [-67, 1]],
      [[-178, 33], [-159, 40], [-143, 37], [-133, 46], [-114, 43]],
      [[-139, -91], [-118, -92], [-102, -105], [-78, -103], [-69, -115]],
      // Parietal and occipital gyri.
      [[70, -111], [78, -91], [69, -73], [77, -60], [98, -59], [110, -72], [126, -70], [139, -85]],
      [[99, -100], [102, -84], [122, -84], [134, -94]],
      [[151, -75], [145, -59], [124, -55], [112, -43], [119, -29], [138, -30], [147, -15]],
      [[169, -63], [164, -46], [178, -39], [169, -22], [186, -12], [202, -15]],
      [[194, -35], [189, -27], [202, -22]],
      [[70, -27], [92, -28], [106, -13], [127, -11], [137, 3], [157, 1], [166, 13], [193, 12]],
      [[127, 19], [145, 22], [158, 31], [176, 25], [188, 29]],
      // Temporal gyri.
      [[-83, 45], [-68, 33], [-50, 35], [-30, 21], [-7, 24], [13, 11], [37, 10], [52, 0], [71, 0], [89, -11]],
      [[-72, 61], [-52, 57], [-34, 47], [-12, 49], [7, 37], [31, 37], [53, 22], [74, 22], [89, 12], [108, 15]],
      [[-48, 74], [-30, 65], [-9, 68], [10, 61], [29, 58], [49, 51], [70, 45], [92, 43], [111, 32]],
    ],
  },
];

function spline(vertices, closed) {
  const count = vertices.length;
  const samples = [];
  const at = index => vertices[closed ? (index + count) % count : Math.max(0, Math.min(index, count - 1))];
  for (let index = 0; index < count - (closed ? 0 : 1); index++) {
    const [a, b, c, d] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
    for (let step = 0; step < 5; step++) {
      const t = step / 5;
      samples.push(b.map((value, axis) => value + 0.5 * (
        (c[axis] - a[axis]) * t + (2 * a[axis] - 5 * value + 4 * c[axis] - d[axis]) * t * t
        + (3 * value - a[axis] - 3 * c[axis] + d[axis]) * t * t * t
      )));
    }
  }
  if (!closed) samples.push(vertices[count - 1]);
  return samples;
}

function contains(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside;
}

const clamp = value => Math.min(1, Math.max(0, value));

function samplePart(part) {
  const outline = spline(part.outline, true);
  const [cx, cy] = part.center;
  const bounds = [
    Math.min(...outline.map(([x]) => x)), Math.min(...outline.map(([, y]) => y)),
    Math.max(...outline.map(([x]) => x)), Math.max(...outline.map(([, y]) => y)),
  ];
  const scaleX = (bounds[2] - bounds[0]) / 2;
  const scaleY = (bounds[3] - bounds[1]) / 2;
  const surface = (x, y, rim = false, fold = false) => {
    const u = (x - cx) / scaleX;
    const v = (y - cy) / scaleY;
    const dome = Math.sqrt(Math.max(0, 1 - u * u * .87 - v * v * .89));
    const ripple = Math.sin(x * .085 + Math.sin(y * .11) * 1.8) * Math.cos(y * .085 + x * .032);
    const z = rim ? -part.depth * .34 : -part.depth * .38 + dome * part.depth * 1.31 + 5 * ripple;
    const shade = clamp(.37 + dome * .35 - .18 * v - .13 * u + .11 * ripple + (fold ? .08 : 0));
    return { x, y, z, shade };
  };
  return {
    kind: part.kind, bounds, mask: outline, surface,
    outline: outline.map(([x, y]) => surface(x, y, true)),
    center: surface(cx, cy),
    folds: part.folds.map(curve => spline(curve, false).map(([x, y]) => surface(x, y, false, true))),
  };
}

const shapes = parts.map(samplePart);

export function createBrainShape(count, random = Math.random) {
  const [stem, cerebellum, cortex] = shapes;
  const pick = items => items[Math.floor(random() * items.length)];
  const points = Array.from({ length: count }, (_, index) => {
    const roll = random();
    const part = roll < .035 ? stem : roll < .20 ? cerebellum : cortex;
    if (index % 7 === 0) {
      const edge = pick(part.outline);
      return { x: edge.x + (random() - .5) * 2.7, y: edge.y + (random() - .5) * 2.7,
        z: edge.z + random() * 19, shade: clamp(edge.shade + .19) };
    }
    if (index % 7 < 3) {
      const fold = pick(pick(part.folds));
      return { x: fold.x + (random() - .5) * 5, y: fold.y + (random() - .5) * 5,
        z: fold.z + random() * 4, shade: fold.shade };
    }
    const [left, top, right, bottom] = part.bounds;
    for (let attempt = 0; attempt < 36; attempt++) {
      const x = left + random() * (right - left);
      const y = top + random() * (bottom - top);
      if (!contains(part.mask, x, y)) continue;
      if (part !== cortex && contains(cortex.mask, x, y)) continue;
      const point = part.surface(x, y);
      if (index % 17 === 0) return { ...point, z: -point.z * .82, shade: point.shade * .46 };
      return point;
    }
    return pick(part.outline);
  });
  return {
    points,
    surfaces: shapes.map(({ kind, outline, center, folds }) => ({ kind, outline, center, folds })),
  };
}
