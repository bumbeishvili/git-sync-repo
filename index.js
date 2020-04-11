const fileUrl = 'https://github.com/kurtsika/git-sync-test-other/blob/master/test.json';


// Can be calculated
const cleanedUrl = fileUrl.replace('https://', '');
const split = cleanedUrl.split('/');

const spl_userName = split[1];
const spl_repoName = split[2];
const spl_blob = split[3];
const spl_branch = split[4];
const file_path = split.slice(5).join('/')
const fileNameWithExtension = split[split.length - 1];

const repoName = spl_repoName;
const repoLink = `https://github.com/${spl_userName}/${spl_repoName}.git`;
let gitFolder = 'repos';
const fullRepoFolder = `repos/${spl_repoName}`
const fileLocalUrl = `repos/${spl_repoName}/${file_path}`;
const localFileName = file_path;

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
  return JSON.stringify(obj,null,' ');
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

  await new Promise(function (resolve, reject) {
    fs.writeFile(fileLocalUrl, contentResolve, 'utf8', function (err) {
      if (err) reject(err);
      else resolve(contentResolve);
    });
  });


  git.add(localFileName);
  git.commit('update');
  git.push();


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

