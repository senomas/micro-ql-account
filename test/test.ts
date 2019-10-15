const fs = require('fs');

const data = JSON.parse(fs.readFileSync("../src/data/001.001.movie.jsox").toString())
  .reduce((acc, v) => {
    acc.items.push(v)
    if (acc.items.length > 100) {
      acc.rest.push(acc.items)
      acc.items = []
    }
    return acc
  }, { items: [], rest: [] })
const group = data.rest
group.push(data.items)

for (let i = 0, il = group.length; i < il; i++) {
  fs.writeFileSync(`001.${("000" + (i + 1)).substr(-3)}.movie.json`, JSON.stringify(group[i], undefined, 2))
}
