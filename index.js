const { promisify } = require("util");
const pandoc = promisify(require('pdc'));
const xml = require("xml2js");
const parseXml = promisify(xml.parseString)
const fs = require("fs");
const Octokat = require('octokat');

const gPodderReleaseTitleRegEx = /^gPodder ([23].*?)\s.* release/i

function isGpodderRelease(node) {
    const title = node.title[0]._
    return gPodderReleaseTitleRegEx.test(title)
}


// const categories = node.category.filter(o => o.$.scheme === 'http://www.blogger.com/atom/ns#').map(o => o.$.term)

// if (categories.length === 2) {
//     if (categories.indexOf('release') === 0 && categories.indexOf('client') === 1) {
//         console.log(title)
//     }
// }

const dir = Object.getOwnPropertyNames

async function main(args) {
    const octo = new Octokat({ token: require('token.json') });
    const repo = octo.repos("adamvoss", "gpodder")

    const contents = fs.readFileSync("blog-07-30-2017.xml", 'utf8');
    const result = await parseXml(contents)


    async function deleteAllReleases() {
        const releases = await repo.releases.fetchAll()
        for (let release of releases) {
            await repo.releases(release.id).remove()
            console.log(`removed ${release.id}`)
        }
    }

    await deleteAllReleases()

    for (let entry of result.feed.entry.filter(isGpodderRelease)) {
        //console.log(Object.getOwnPropertyNames(entry.content[0]));
        const title = entry.title[0]._
        const version = gPodderReleaseTitleRegEx.exec(title)[1]

        const date = new Date(entry.published[0]).toISOString();
        const shortDate = date.substring(0, date.indexOf('T'));

        const text = "_Released " + shortDate + "_\n\n" + updateLinks(await pandoc(entry.content[0]._, entry.content[0].$.type, "markdown_github"))
        //console.log();
        //break;

        const result = await repo.releases.create({
            tag_name: `gpodder-${version}`,
            name: title,
            body: text
        })
        //console.log(version);
        //console.log(title);
        //console.log(text);
        console.log(result)
    }

    return "done!";
}

function updateLinks(text) {
    return replaceSourceLinks(replaceChangeLogLinks(text))
}

function replaceSourceLinks(text) {
    return text.replace(/http:\/\/download.berlios.de\/gpodder\/gpodder-(\d+\.\d+(?:\.\d+)?).tar.gz/, "https://github.com/gpodder/gpodder/archive/gpodder-$1.tar.gz")
        .replace(/http:\/\/gpodder.org\/src\/gpodder-(\d+\.\d+(?:\.\d+)?).tar.gz/, "https://github.com/gpodder/gpodder/archive/gpodder-$1.tar.gz")
}

function replaceChangeLogLinks(text) {
    return text.replace(/http:\/\/gpodder.org\/changelog\/(\d+\.\d+(?:\.\d+)?)\/?/g, "https://github.com/gpodder/gpodder/commits/gpodder-$1")
        .replace(/gpodder.org\/changelog\/(\d+\.\d+(?:\.\d+)?)\/?/, "on the commit log")
}

if (require.main === module) {
    main(process.argv)
        .then(s => console.log(s))
        .catch(error => {
            console.error(error);
            process.exit(2);
        });
}