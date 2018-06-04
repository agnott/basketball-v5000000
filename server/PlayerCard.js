const fs = require('fs');
const Random = require('./Random');
const SVG = require('./lib/svg/svg');

const CONFIG = {
  RARITY: {
    LABELS: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    WEIGHTS: [300, 200, 100, 50, 20]
  },
  NAMES: {
    FIRST: fs.readFileSync('./data/first-names.txt').toString().split('\n'),
    LAST: fs.readFileSync('./data/last-names.txt').toString().split('\n')
  },
  ATTRIBUTES: ['speed', 'rebound', 'block', 'steal', 'three', 'mid', 'short', 'dunk', 'pass', 'clutch'],
};

class SetArray {
  constructor(base = []) {
    this.array = [...base];
    this.set = new Set(this.array);
  }

  has(k) {
    return this.set.has(k);
  }

  add(k) {
    if (!this.set.has(k)) this.array.push(k);
    return this.set.add(k);
  }

  delete(k) {
    if (this.has(k)) this.array.splice(this.array.indexOf(k), 1);
    return this.set.delete(k);
  }

  values() {
    return this.array;
  }
}

const getEdges = (config) => ({
  left: config.svg.width / 2 - config.head.width / 2,
  right: config.svg.width/ 2 + config.head.width / 2,
  top: config.svg.height / 2 - config.head.height / 2,
  bottom: config.svg.height / 2 + config.head.height / 2,
});

const getMidpoints = (config) => ({
  x: config.svg.width / 2,
  y: config.svg.height / 2,
});

const generateHeadShape = (config, themes) => {
  const group = SVG.Group();

  const edges = getEdges(config);
  const midpoints = getMidpoints(config);;

  // Head top
  group.add(
    SVG.Path()
      .move(edges.left, midpoints.y)
      .line(edges.left, midpoints.y - config.head.height / 5)
      .quadratic(edges.left, edges.top, midpoints.x, edges.top)
      .quadratic(edges.right, edges.top, edges.right, midpoints.y - config.head.height / 5)
      .line(edges.right, midpoints.y)
      .theme(themes.outlined)
      .fill(config.colors.skin)
  );

  // Head bottom
  group.add(
    SVG.Path()
      .move(edges.left, midpoints.y)
      .line(edges.left, midpoints.y + config.head.height / 15)
      .quadratic(edges.left, edges.bottom, midpoints.x, edges.bottom)
      .quadratic(edges.right, edges.bottom, edges.right, midpoints.y + config.head.height / 15)
      .line(edges.right, midpoints.y)
      .theme(themes.outlined)
      .fill(config.colors.skin)
  );

  // Mouth
  group.add(
    SVG.Path()
      .move(midpoints.x - config.mouth.width / 2, midpoints.y + config.head.height / 4)
      .quadratic(
        midpoints.x,
        midpoints.y + config.head.height / 4 + config.mouth.curvature,
        midpoints.x + config.mouth.width / 2,
        midpoints.y + config.head.height / 4
      )
      .theme(themes.outlined)
  );

  return group;
}

const generateHairBase = (config, themes) => {
  const group = SVG.Group();

  const edges = getEdges(config);
  const midpoints = getMidpoints(config);

  group.add(
    SVG.Path()
      .move(edges.left, midpoints.y)
      .line(edges.left, midpoints.y - config.hair.curvature * config.head.height / 4)
      .quadratic(
        edges.left - config.hair.puffiness,
        edges.top - config.hair.height,
        midpoints.x,
        edges.top - config.hair.height
      )
      .quadratic(
        edges.right + config.hair.puffiness,
        edges.top - config.hair.height,
        edges.right,
        midpoints.y - config.hair.curvature * config.head.height / 4
      )
      .line(edges.right, midpoints.y)
      .theme(themes.outlined)
      .fill(config.colors.hair)
  );

  return group;
};

const generateBeard = (config, themes) => {
  if (!config.beard.present && !config.moustache.present) return null;

  const group = SVG.Group();
  const { beard, moustache } = config;

  const edges = getEdges(config);
  const midpoints = getMidpoints(config);

  const bottom = SVG.Path()
    .move(edges.left, midpoints.y)
    .line(edges.left, midpoints.y + beard.squareness)
    .quadratic(
      edges.left - beard.thickness.bottom,
      edges.bottom + beard.thickness.bottom,
      midpoints.x,
      edges.bottom + beard.thickness.bottom,
    )
    .quadratic(
      edges.right + beard.thickness.bottom,
      edges.bottom + beard.thickness.bottom,
      edges.right,
      midpoints.y + beard.squareness
    )
    .line(edges.right, midpoints.y)
    .quadratic(
      edges.right - beard.thickness.top,
      edges.bottom - beard.thickness.top,
      midpoints.x,
      edges.bottom - beard.thickness.top,
    )
    .quadratic(
      edges.left + beard.thickness.top,
      edges.bottom - beard.thickness.top,
      edges.left,
      midpoints.y,
    )
    .theme(themes.outlined)
    .fill(config.colors.hair);

  const top = SVG.Path()
    .move(midpoints.x, midpoints.y + config.head.height / 4 - (moustache.distance + moustache.thickness))
    .theme(themes.outlined)
    .fill(config.colors.hair);

  if (moustache.handlebars) {
    top.quadratic(
        midpoints.x - config.mouth.width / 2 - (moustache.distance + moustache.thickness),
        midpoints.y + config.head.height / 4 - (moustache.distance + moustache.thickness),
        midpoints.x - config.mouth.width / 2 - (moustache.distance + moustache.thickness),
        midpoints.y + config.head.height / 4,
      )
      .line(
        midpoints.x - config.mouth.width / 2 - (moustache.distance + moustache.thickness),
        edges.bottom - beard.thickness.top,
      )
      .line(
        midpoints.x - config.mouth.width / 2 - moustache.distance,
        edges.bottom - beard.thickness.top + 1,
      )
      .line(
        midpoints.x - config.mouth.width / 2 - moustache.distance,
        midpoints.y + config.head.height / 4,
      )
      .quadratic(
        midpoints.x - config.mouth.width / 2 - moustache.distance,
        midpoints.y + config.head.height / 4 - moustache.distance,
        midpoints.x,
        midpoints.y + config.head.height / 4 - moustache.distance,
      )
      .quadratic(
        midpoints.x + config.mouth.width / 2 + moustache.distance,
        midpoints.y + config.head.height / 4 - moustache.distance,
        midpoints.x + config.mouth.width / 2 + moustache.distance,
        midpoints.y + config.head.height / 4,
      )
      .line(
        midpoints.x + config.mouth.width / 2 + moustache.distance,
        edges.bottom - beard.thickness.top + 1,
      )
      .line(
        midpoints.x + config.mouth.width / 2 + (moustache.distance + moustache.thickness),
        edges.bottom - beard.thickness.top,
      )
      .line(
        midpoints.x + config.mouth.width / 2 + (moustache.distance + moustache.thickness),
        midpoints.y + config.head.height / 4,
      )
      .quadratic(
        midpoints.x + config.mouth.width / 2 + (moustache.distance + moustache.thickness),
        midpoints.y + config.head.height / 4 - (moustache.distance + moustache.thickness),
        midpoints.x,
        midpoints.y + config.head.height / 4 - (moustache.distance + moustache.thickness),
      );
  } else {

  }

  const mask = SVG.Mask().add(top.copy().fill('white'));
  const bottomCopy = bottom.copy().attr('stroke-width', 50);

  group.add(mask);
  bottomCopy.fill(config.colors.hair).stroke(config.colors.hair).mask(mask);

  if (config.moustache.present) group.add(top);
  if (config.beard.present) group.add(bottom);
  if (config.moustache.present && config.beard.present) group.add(bottomCopy);

  return group;
};

class PlayerCard {
  constructor(config = {}) {
    this.rarity = (CONFIG.RARITY.LABELS.includes(config.rarity)) ?
      config.rarity : Random.choiceWeighted(CONFIG.RARITY.LABELS, CONFIG.RARITY.WEIGHTS);
    this.name = {
      first: Random.choice(CONFIG.NAMES.FIRST),
      last: Random.choice(CONFIG.NAMES.LAST),
    };

    this.attributes = this.generateAttributes();
    this.position = this.generatePositions();
    this.svg = this.generateSvg();
  }

  generateAttributes() {
    const availableAttributes = new SetArray(CONFIG.ATTRIBUTES);
    const attributes = {};
    availableAttributes.values().forEach((k) => {
      attributes[k] = 1;
    });

    let attribute;
    const base = 15;
    const variance = Math.floor(Random.triangular(-3, 3, 0));
    const availablePoints = base + variance + CONFIG.RARITY.LABELS.indexOf(this.rarity) * 6;

    for (let i = 0; i < availablePoints; i++) {
      attribute = Random.choiceWeighted(availableAttributes.values(), availableAttributes.values().map(v => attributes[v] ** 0.5));
      if (++attributes[attribute] >= 10) availableAttributes.delete(attribute);
    }

    return attributes;
  }

  generatePositions() {
    const attrs = this.attributes;
    const scaledSpeed = attrs['speed'] - 2.9;
    const positionRankings = [{
      position: 'PG',
      ranking: 5 * attrs['pass']
        + 4 * attrs['steal']
        + 3 * attrs['three']
        + 2 * attrs['mid']
        + attrs['short']
        + 4 * scaledSpeed,
    }, {
      position: 'SG',
      ranking: 5.75 * attrs['three']
        + 4 * attrs['mid']
        + 3 * attrs['steal']
        + 2 * attrs['pass']
        + attrs['short']
        + 2 * scaledSpeed,
    }, {
      position: 'SF',
      ranking: 6 * attrs['mid']
        + 4 * attrs['short']
        + 3 * attrs['dunk']
        + 2 * attrs['three']
        + attrs['pass']
        + 1 * scaledSpeed,
    }, {
      position: 'PF',
      ranking: 5.75 * attrs['short']
        + 4 * attrs['dunk']
        + 3 * attrs['rebound']
        + 2 * attrs['block']
        + attrs['mid']
        - 2 * scaledSpeed,
    }, {
      position: 'C',
      ranking: 5 * attrs['rebound']
        + 4 * attrs['block']
        + 3 * attrs['dunk']
        + 2 * attrs['short']
        + attrs['mid']
        - 4 * scaledSpeed,
    }].sort((a, b) => b.ranking - a.ranking);

    return {
      primary: positionRankings[0].position,
      secondary: positionRankings[1].position,
    };
  }

  generateSvg() {
    const hairHeight = Random.float(2, 12.5);
    const hairCurvature = Random.float(1, 2);
    const hairPuffiness = Random.float(0, hairCurvature * hairHeight / 4);

    const beardSquareness = Random.triangular(0, 20, 5);

    const config = {
      svg: {
        width: 100,
        height: 100,
      },
      colors: {
        skin: SVG.hsl(35, 60, Random.int(25, 75)),
        hair: SVG.hsl(37, 100, Random.int(10, 80)),
      },
      head: {
        width: Random.int(40, 45),
        height: Random.int(50, 55),
      },
      hair: {
        height: hairHeight,
        puffiness: hairPuffiness,
        curvature: hairCurvature,
      },
      mouth: {
        width: Random.int(7, 10),
        curvature: Random.float(-2.5, 2.5),
      },
      beard: {
        present: Random.random() > 0.5,
        squareness : beardSquareness,
        thickness: {
          top: Random.float(1, 10),
          bottom: (20 - beardSquareness) / 20 * Random.triangular(2, 20, 3),
        }
      },
      moustache: {
        present: Random.random() > 0.5,
        thickness: Random.float(4, 6),
        distance: Random.float(3.5, 6),
        handlebars: Random.random() > 0,
      }
    };

    console.log(config);

    const svg = new SVG(config.svg.width, config.svg.height);

    this.image = config;

    const themes = {
      outlined: SVG.Theme({
        fill: 'transparent',
        stroke: 'black',
        'stroke-width': 15,
        'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke',
      })
    };

    const groups = {
      head: SVG.Group(),
    };

    // groups.head.add(
    //   SVG.Path()
    //     .move(30, 50)
    //     .line(30, 35)
    //     .quadratic(30, 20, 50, 20)
    //     .quadratic(70, 20, 70, 35)
    //     .line(70, 50)
    //     .theme(themes.outlined)
    //     .fill(config.colors.skin)
    // );
    // groups.head.add(
    //   SVG.Path()
    //     .move(30, 50)
    //     .quadratic(30, 70, 50, 70)
    //     .quadratic(70, 70, 70, 50)
    //     .theme(themes.outlined)
    //     .fill(config.colors.skin)
    // );
    // groups.head.add(
    //   SVG.Path()
    //     .move(46, 59)
    //     .quadratic(50, 60, 54, 59)
    //     .theme(themes.outlined)
    // );
    // groups.head.add(
    //   SVG.Path()
    //     .move(47, 45)
    //     .line(47, 50)
    //     .quadratic(47, 51, 48, 51)
    //     .line(52, 51)
    //     .quadratic(53, 51, 53, 50)
    //     .theme(themes.outlined)
    // );

    groups.head.add(generateHairBase(config, themes));
    groups.head.add(generateHeadShape(config, themes));
    groups.head.add(generateBeard(config, themes));

    svg.add(groups.head);

    return svg.render();
  }
}

module.exports = PlayerCard;
