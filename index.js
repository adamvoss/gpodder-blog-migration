const { promisify } = require("util");
const pandoc = promisify(require('pdc'));
const xml = require("xml2js");
const parseXml = promisify(xml.parseString)
const fs = require("fs");


function isGpodderRelease(node) {
    const title = node.title[0]._
    return /^gPodder [[23].* release/i.test(title)
}


// const categories = node.category.filter(o => o.$.scheme === 'http://www.blogger.com/atom/ns#').map(o => o.$.term)

// if (categories.length === 2) {
//     if (categories.indexOf('release') === 0 && categories.indexOf('client') === 1) {
//         console.log(title)
//     }
// }

const dir = Object.getOwnPropertyNames

async function main(args) {
    const contents = fs.readFileSync("blog-07-30-2017.xml", 'utf8');
    const result = await parseXml(contents)

    for (let entry of result.feed.entry.filter(isGpodderRelease)) {
        //console.log(Object.getOwnPropertyNames(entry.content[0]));
        const result = await pandoc(entry.content[0]._, entry.content[0].$.type, "markdown_github")
        
        console.log(entry.title[0]._)
        console.log(result);
        console.log();
    }

    return "done!";
}

if (require.main === module) {
    main(process.argv)
        .then(s => console.log(s))
        .catch(error => {
            console.error(error);
            process.exit(2);
        });
}