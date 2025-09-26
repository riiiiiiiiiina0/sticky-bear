// liquidGlass.js - Liquid glass effect implementation for sticky notes

/**
 * Creates a displacement map SVG for the liquid glass effect
 * @param {Object} options - Displacement options
 * @param {number} options.height - Element height
 * @param {number} options.width - Element width
 * @param {number} options.radius - Border radius
 * @param {number} options.depth - Glass depth effect
 * @returns {string} Data URL for the displacement map
 */
export const getDisplacementMap = ({ height, width, radius, depth }) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .mix { mix-blend-mode: screen; }
    </style>
    <defs>
        <linearGradient 
          id="Y" 
          x1="0" 
          x2="0" 
          y1="${Math.ceil((radius / height) * 15)}%" 
          y2="${Math.floor(100 - (radius / height) * 15)}%">
            <stop offset="0%" stop-color="#0F0" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient 
          id="X" 
          x1="${Math.ceil((radius / width) * 15)}%" 
          x2="${Math.floor(100 - (radius / width) * 15)}%"
          y1="0" 
          y2="0">
            <stop offset="0%" stop-color="#F00" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>

    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#Y)"
          class="mix"
      />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#X)"
          class="mix"
      />
      <rect
          x="${depth}"
          y="${depth}"
          height="${height - 2 * depth}"
          width="${width - 2 * depth}"
          fill="#808080"
          rx="${radius}"
          ry="${radius}"
          filter="blur(${depth}px)"
      />
    </g>
</svg>`);

/**
 * Creates a displacement filter SVG for the liquid glass effect
 * @param {Object} options - Displacement options
 * @param {number} options.height - Element height
 * @param {number} options.width - Element width
 * @param {number} options.radius - Border radius
 * @param {number} options.depth - Glass depth effect
 * @param {number} [options.strength=100] - Displacement strength
 * @param {number} [options.chromaticAberration=0] - Chromatic aberration amount
 * @returns {string} Data URL for the displacement filter
 */
export const getDisplacementFilter = ({
  height,
  width,
  radius,
  depth,
  strength = 100,
  chromaticAberration = 0,
}) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="displace" color-interpolation-filters="sRGB">
            <feImage x="0" y="0" height="${height}" width="${width}" href="${getDisplacementMap(
    {
      height,
      width,
      radius,
      depth,
    },
  )}" result="displacementMap" />
            <feDisplacementMap
                transform-origin="center"
                in="SourceGraphic"
                in2="displacementMap"
                scale="${strength + chromaticAberration * 2}"
                xChannelSelector="R"
                yChannelSelector="G"
            />
            <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="displacedR"
                    />
            <feDisplacementMap
                in="SourceGraphic"
                in2="displacementMap"
                scale="${strength + chromaticAberration}"
                xChannelSelector="R"
                yChannelSelector="G"
            />
            <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="displacedG"
                    />
            <feDisplacementMap
                    in="SourceGraphic"
                    in2="displacementMap"
                    scale="${strength}"
                    xChannelSelector="R"
                    yChannelSelector="G"
                />
                <feColorMatrix
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="displacedB"
                        />
              <feBlend in="displacedR" in2="displacedG" mode="screen"/>
              <feBlend in2="displacedB" mode="screen"/>
        </filter>
    </defs>
</svg>`) +
  '#displace';

/**
 * Generates liquid glass CSS properties for a given element size and color
 * @param {Object} options - Glass options
 * @param {number} options.width - Element width in pixels
 * @param {number} options.height - Element height in pixels
 * @param {number} [options.radius=10] - Border radius
 * @param {number} [options.depth=10] - Glass depth effect
 * @param {number} [options.blur=2] - Blur amount
 * @param {number} [options.strength=100] - Displacement strength
 * @param {number} [options.chromaticAberration=0] - Chromatic aberration
 * @param {string} [options.baseColor="rgba(255, 255, 255, 0.4)"] - Base glass color
 * @returns {Object} CSS properties object
 */
export const getLiquidGlassStyles = ({
  width,
  height,
  radius = 10,
  depth = 10,
  blur = 2,
  strength = 100,
  chromaticAberration = 0,
  baseColor = 'rgba(255, 255, 255, 0.4)',
}) => {
  const filterUrl = getDisplacementFilter({
    height,
    width,
    radius,
    depth,
    strength,
    chromaticAberration,
  });

  return {
    background: baseColor,
    backdropFilter: `blur(${
      blur / 2
    }px) url('${filterUrl}') blur(${blur}px) brightness(1.1) saturate(1.5)`,
    boxShadow: 'inset 0 0 4px 0px rgba(255, 255, 255, 0.3)',
  };
};

/**
 * Applies liquid glass effect to a note element
 * @param {HTMLElement} noteElement - The note element to apply effect to
 * @param {string} [colorVariant="yellow"] - Color variant for the glass
 */
export const applyLiquidGlassEffect = (
  noteElement,
  colorVariant = 'yellow',
) => {
  if (!noteElement) return;

  // Get element dimensions
  const computedStyle = window.getComputedStyle(noteElement);
  const width = parseInt(computedStyle.width) || 200;
  const height = parseInt(computedStyle.height) || 200;

  // Check if dark mode is preferred
  const isDarkMode =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Color variants for liquid glass effect
  const glassColors = isDarkMode
    ? {
        yellow: 'rgba(255, 235, 59, 0.7)',
        green: 'rgba(34, 68, 34, 0.7)',
        blue: 'rgba(40, 60, 80, 0.7)',
        red: 'rgba(80, 40, 40, 0.7)',
        gray: 'rgba(60, 60, 60, 0.7)',
      }
    : {
        yellow: 'rgba(255, 255, 204, 0.6)',
        green: 'rgba(144, 238, 144, 0.6)',
        blue: 'rgba(204, 229, 255, 0.6)',
        red: 'rgba(255, 204, 204, 0.6)',
        gray: 'rgba(230, 230, 230, 0.6)',
      };

  const baseColor = glassColors[colorVariant] || glassColors.yellow;

  // Generate liquid glass styles
  const glassStyles = getLiquidGlassStyles({
    width,
    height,
    radius: 10,
    depth: 8,
    blur: 3,
    strength: 80,
    chromaticAberration: 1,
    baseColor,
  });

  // Apply styles to the note element
  Object.assign(noteElement.style, glassStyles);
};

/**
 * Updates liquid glass effect when note is resized
 * @param {HTMLElement} noteElement - The note element
 * @param {string} [colorVariant="yellow"] - Color variant for the glass
 */
export const updateLiquidGlassOnResize = (
  noteElement,
  colorVariant = 'yellow',
) => {
  // Re-apply the effect with new dimensions
  applyLiquidGlassEffect(noteElement, colorVariant);
};
