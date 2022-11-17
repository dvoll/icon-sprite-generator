// @ts-check
const fsPromise = require('fs/promises');
const path = require('path');
const SVGSpriter = require('svg-sprite');
const open = require('open');

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
const config = {
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
    let fileContent = await fsPromise.readFile(iconDirPath + item, {
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
 * @param {string[]} items
 * @param {SVGSpriter.SVGSpriter} spriter
 * @param {string} iconDirPath
 */
async function readFileContentsAndAddToSpriter(items, spriter, iconDirPath) {
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
    let items = [];
    try {
        items = await fsPromise.readdir(pathToIcons);
    } catch (e) {
        console.error('Error reading dir', e);
    }

    const spriter = new SVGSpriter(config);
    await readFileContentsAndAddToSpriter(items, spriter, pathToIcons);

    spriter.compile(async (error, result) => {
        if (error) {
            console.error(error);
            return;
        }
        /* Write `result` files to disk (or do whatever with them ...) */
        for (const mode in result) {
            for (const resource in result[mode]) {
                // mkdirp.sync(path.dirname(result[mode][resource].path));

                try {
                    await fsPromise.writeFile(
                        result[mode][resource].path,
                        result[mode][resource].contents
                    );
                    console.info(`Successfully written svg sprite to ${dest}.`);
                    const stats = await fsPromise.stat(
                        result[mode][resource].path
                    );
                    const fileSizeInBytes = stats.size;
                    const fileSizeInMegabytes = fileSizeInBytes / 1024;
                    console.info(`File size is: ${fileSizeInMegabytes} kb.`);
                } catch (e) {
                    console.error('Error writing svg sprite.');
                }

                try {
                    await fsPromise.writeFile(
                        dest + 'svg-sprite.html',
                        result[mode][resource].contents
                    );
                    console.info(
                        `Successfully written svg sprite html file to ${dest}.`
                    );
                } catch (e) {
                    console.error('Error writing svg sprite html file.');
                }

                try {
                    const previewFileContents = generatePreviewFileContents(
                        items
                            .filter((i) => path.extname(i) === '.svg')
                            .map((i) => path.parse(i).name),
                        result[mode][resource].contents
                    );
                    await fsPromise.writeFile(
                        dest + 'preview.html',
                        previewFileContents
                    );
                    console.info(
                        `Successfully written preview file to ${dest}.`
                    );
                    open(dest + 'preview.html');
                } catch (e) {
                    console.error('Error writing preview file.');
                }
            }
        }
    });
}

main();

/**
 *
 * @param {string[]} items
 * @param {string} contents
 * @returns {string}
 */
function generatePreviewFileContents(items, contents) {
    const htmlStart =
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Icon Test</title></head><body><table><thead><tr><th>Name</th><th colspan="2">Icon</th><tr></thead><tbody>';
    const htmlEnd = '</tbody></table></body></html>';

    const svgPreviews = items.map(
        (item) => `
<tr>
    <td>
        ${item}
    </td>
    <td style="padding-left: 1rem;">
        <svg style="height: 32px; width: auto;" class="icon" viewBox="0 0 32 32">
            <use xlink:href="#${item}" />
        </svg>
    </td>
    <td style="padding-left: 1rem;">
        <svg style="height: 32px; width: auto; fill: red;" class="icon" viewBox="0 0 32 32">
            <use xlink:href="#${item}" />
        </svg>
    </td>
</tr>
    `,
        ''
    );

    return htmlStart + svgPreviews.join('') + contents + htmlEnd;
}
