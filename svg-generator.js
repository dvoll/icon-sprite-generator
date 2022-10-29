// @ts-check
var SVGSpriter = require('svg-sprite');
var fs = require('fs/promises');
const path = require('path');

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

/**
 * @param {string} item
 * @param {string} iconDirPath
 */
async function readFileContent(item, iconDirPath) {
    let fileContent = await fs.readFile(iconDirPath + item, {
        encoding: 'utf-8',
    });
    const rectStart = fileContent.search('<rect');
    const rectEnd = fileContent.search('/>');
    const s1 = fileContent.slice(0, rectStart);
    const s2 = fileContent.slice(rectEnd + 2);
    fileContent = s1 + s2;
    return fileContent;
}

/**
 *
 * @param {SVGSpriter.SVGSpriter} spriter
 * @param {string} iconDirPath
 */
async function readFilesAndAddToSpriter(spriter, iconDirPath) {
    let items = [];
    try {
        items = await fs.readdir(iconDirPath);
    } catch (e) {
        console.error('Error reading dir', e);
    }
    return Promise.all(
        items.map(async (item) => {
            const fileExt = path.extname(item);
            if (fileExt === '.svg') {
                try {
                    const fileContent = await readFileContent(
                        item,
                        iconDirPath
                    );
                    spriter.add(iconDirPath + item, item, fileContent);
                } catch (e) {
                    console.error(
                        `Error while reading contents of ${item}.`,
                        e
                    );
                }
            }
        })
    );
}

async function main() {
    const spriter = new SVGSpriter(config);
    await readFilesAndAddToSpriter(spriter, pathToIcons);

    spriter.compile((error, result) => {
        if (error) {
            console.error(error);
            return;
        }
        /* Write `result` files to disk (or do whatever with them ...) */
        for (var mode in result) {
            for (var resource in result[mode]) {
                // mkdirp.sync(path.dirname(result[mode][resource].path));
                try {
                    fs.writeFile(
                        result[mode][resource].path,
                        result[mode][resource].contents
                    );
                    console.info(`Successfully written svg sprite to ${dest}.`);
                } catch (e) {
                    console.error('Error writing svg sprite.');
                }
                try {
                    fs.writeFile(
                        dest + 'svg-sprite.html',
                        result[mode][resource].contents
                    );
                    console.info(
                        `Successfully written svg sprite html file to ${dest}.`
                    );
                } catch (e) {
                    console.error('Error writing svg sprite html file.');
                }
            }
        }
    });
}

main();
