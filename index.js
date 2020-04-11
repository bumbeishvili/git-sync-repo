const fileUrl = 'https://github.com/bumbeishvili/git-sync-test-repo/blob/master/test.json';


// Can be calculated
const repoName = 'git-sync-test-repo';
const repoLink = 'https://github.com/bumbeishvili/git-sync-test-repo.git';
let gitFolder = 'repos';
const fullRepoFolder = 'repos/git-sync-test-repo'
const fileLocalUrl = 'repos/git-sync-test-repo/test.json'

// Require
const simpleGit = require('simple-git/promise');
const fs = require("fs"); // Or `import fs from "fs";` with ESM


if (fs.existsSync(fullRepoFolder)) {
  gitFolder = fullRepoFolder;
}



const git = simpleGit(gitFolder);
update(fileUrl, stringData => {
  const obj = JSON.parse(stringData);
  obj['automatic-records'].unshift(new Date())

  // It can be promise
  return JSON.stringify(obj);
})

async function update(fileUrl, callback) {
  let repo = {
    exists: false,
    latest: false
  }

  if (fs.existsSync(fullRepoFolder)) {
    repo = Object.assign(repo, { exists: true });
  } else {
    repo.exists = true;
  }

  // If repo is not cloned already, clone it
  if (!repo.exists) {
    repo = await clone(repoLink)
  }

  // If repo is not latest, reset hard
  if (repo.exists && !repo.latest) {
    repo = await resetHard(repoLink)
  }

  // Read file as string
  let fileContent = fs.readFileSync(fileLocalUrl, 'utf8');

  const contentResolve = await Promise.resolve(callback(fileContent));

  console.log(contentResolve)


  // Cloning repository
  function clone(repoLink) {
    const result = git.clone(repoLink);
    const r = Object.assign(repo, {
      exists: true,
      latest: true,
    })
    return new Promise(rs => {
      result.then(d => {
        rs(Object.assign({}, r, { result: d }));
      })
    })
  }

  // Resetting repository
  function resetHard(repoLink) {
    console.log('resetting hard')
    const result = git.reset('hard');
    const r = Object.assign(repo, {
      exists: true,
      latest: true,
    })
    return new Promise(rs => {
      result.then(d => {
        rs(Object.assign({}, r, { result: d }));
      })
    })
  }

}

