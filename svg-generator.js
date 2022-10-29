// @ts-check
var SVGSpriter = require('svg-sprite');
var fs = require('fs');

const pathToIcons = './icons/';
const dest = './dist/';
const name = 'svg-sprite';

/** @type {SVGSpriter.CustomConfigurationTransform} */
const svgTransform = /** @type {any} */ ({
    svgo: {
        plugins: [
            {
                name: 'removeAttrs',
                params: { attrs: '(fill|stroke)' },
            },
        ],
    },
});

/** @type {SVGSpriter.Config} */
var config = {
    dest: dest, // Main output directory
    log: 'verbose', // Logging verbosity (default: no logging)
    shape: {
        // SVG shape related options
        id: {
            // SVG shape ID related options
            separator: '--', // Separator for directory name traversal
            // generator: (_, file) => {
            //     return file.stem;
            // }, // SVG shape ID generator callback
            pseudo: '~', // File name separator for shape states (e.g. ':hover')
        },
        dimension: {
            // Dimension related options
            maxWidth: 2000, // Max. shape width
            maxHeight: 2000, // Max. shape height
            precision: 2, // Floating point precision
            attributes: false, // Width and height attributes on embedded shapes
        },
        spacing: {
            // Spacing related options
            padding: 0, // Padding around all shapes
            box: 'content', // Padding strategy (similar to CSS `box-sizing`)
        },
        transform: [svgTransform], // List of transformations / optimizations
    },
    svg: {
        // General options for created SVG files
        xmlDeclaration: false, // Add XML declaration to SVG sprite
        doctypeDeclaration: false, // Add DOCTYPE declaration to SVG sprite
        namespaceIDs: true, // Add namespace token to all IDs in SVG shapes
        namespaceClassnames: true, // Add namespace token to all CSS class names in SVG shapes
        dimensionAttributes: true, // Width and height attributes on the sprite
        rootAttributes: {
            style: 'display: none;',
        },
    },
    variables: {}, // Custom Mustache templating variables and functions
    mode: {
        symbol: {
            dest: './',
            sprite: name + '.svg',
            // inline: true
        },
        shapes: false,
        // stack: true // Create a «stack» sprite
    },
};

var spriter = new SVGSpriter(config); //new SVGSpriter(config);

// const dir = "./src/assets/svg/";
fs.readdir(pathToIcons, (err, items) => {
    if (err) {
        console.log(err);
        return;
    }
    items.forEach((item) => {
        let fileContent = fs.readFileSync(pathToIcons + item, {
            encoding: 'utf-8',
        });
        const rectStart = fileContent.search('<rect');
        const rectEnd = fileContent.search('/>');
        const s1 = fileContent.slice(0, rectStart);
        const s2 = fileContent.slice(rectEnd + 2);
        fileContent = s1 + s2;
        spriter.add(pathToIcons + item, item, fileContent);
    });
    spriter.compile((error, result) => {
        if (error) {
            console.error(error);
            return;
        }
        /* Write `result` files to disk (or do whatever with them ...) */
        for (var mode in result) {
            for (var resource in result[mode]) {
                // mkdirp.sync(path.dirname(result[mode][resource].path));
                fs.writeFileSync(
                    result[mode][resource].path,
                    result[mode][resource].contents
                );
                fs.writeFileSync(
                    dest + 'svg-sprite.html',
                    result[mode][resource].contents
                );
            }
        }
    });
});
// Add SVG source files — the manual way ...
// spriter.add(
//   "./src/assets/svg/cloud1.svg",
//   null,
//   fs.readFileSync("./src/assets/svg/cloud1.svg", { encoding: "utf-8" })
// );
// var path2 = "./src/assets/svg/cloud2.svg";
// spriter.add(path2, null, fs.readFileSync(path2, { encoding: "utf-8" }));
/* ... */

// Compile the sprite
