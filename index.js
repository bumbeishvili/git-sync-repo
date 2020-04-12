
const fileUrl = 'https://github.com/bumbeishvili/git-sync-test-repo/blob/master/test.json';
const ps = process.env.password_or_secret||`<your_github_password_or_secret_if_2fa>`

const http = require('http');
const hostname = process.env.hostname || '127.0.0.1';
const port = process.env.PORT || 3000;

let started = false;
const server = http.createServer(function (req, res) {
  if (!started) {
    started = true;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    update(fileUrl, ps, stringData => {
      const obj = JSON.parse(stringData);
      obj['automatic-records'].unshift(new Date())

      // It can be promise
      return JSON.stringify(obj, null, ' ');
    })
    setTimeout(() => {
      started = false;
    }, 5000)
    res.end('success');
  } else {
    res.end('already in progress');
  }

});

server.listen(port, hostname, function () {
  console.log('Server running at http://' + hostname + ':' + port + '/');
});


async function update(fileUrl, ps, callback) {
  // Requiring modules
  const simpleGit = require('simple-git/promise');
  const fs = require("fs"); // Or `import fs from "fs";` with ESM

  // Splitting and assigning names
  const cleanedUrl = fileUrl.replace('https://', '');
  const split = cleanedUrl.split('/');
  const spl_userName = split[1];
  const spl_repoName = split[2];
  const spl_blob = split[3];
  const spl_branch = split[4];
  const file_path = split.slice(5).join('/')
  const fileNameWithExtension = split[split.length - 1];
  const repoName = spl_repoName;
  const repoLink = `https://${spl_userName}:${ps}@github.com/${spl_userName}/${spl_repoName}`;
  let gitFolder = 'repos';
  const fullRepoFolder = `repos/${spl_repoName}`
  const fileLocalUrl = `repos/${spl_repoName}/${file_path}`;
  const localFileName = file_path;

  // Check if repo exists and update paths
  if (fs.existsSync(fullRepoFolder)) {
    gitFolder = fullRepoFolder;
  }

  // Initialize git
  let git = simpleGit(gitFolder);

  let repoExists = false;

  if (fs.existsSync(fullRepoFolder)) {
    repoExists = true;
  }

  // If repo is not cloned already, clone it
  if (!repoExists) {
    await clone(repoLink)
  }

  // Reinitialize git in full repository folder
  git = simpleGit(fullRepoFolder);

  // Hard reset repository
  await resetHard(repoLink)

  // Read file as string
  let fileContent = fs.readFileSync(fileLocalUrl, 'utf8');

  // Get updated file content
  const contentResolve = await Promise.resolve(callback(fileContent));

  // Write updated content into file
  await new Promise(function (resolve, reject) {
    fs.writeFile(fileLocalUrl, contentResolve, 'utf8', function (err) {
      if (err) reject(err);
      else resolve(contentResolve);
    });
  });

  // Stage changes
  git.add('*');

  // Commit changes
  git.commit('update');

  console.log('pushing')

  // Push changes
  await git.push();
  console.log('pushed')

  // Cloning repository
  function clone(repoLink) {
    console.log('cloning')
    const result = git.clone(repoLink);
    return result;
  }

  // Resetting repository
  function resetHard(repoLink) {
    console.log('resetting')
    const result = git.reset('hard');
    return result;
  }

}
