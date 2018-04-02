#!/usr/bin/env node

const fs = require('fs')
const cp = require('child_process')
const path = require('path')

const async = require('async')
const mkdirp = require('mkdirp')
const pem = require('pem')

const CERTS_FOLDER = path.join(process.cwd(), 'certs')
const INSTALL_CMDS = {
  darwin: {
    exec: 'security',
    args: 'add-trusted-cert -d -r trustRoot certs/localhost.cer'.split(' ')
  },
  win32: {
    exec: 'certutil',
    args: '-addstore -user Root certs\\localhost.cer'.split(' ')
  },
  linux: {
    // not supported
  }
}

function exec(...args) {
  return cp.execFile(...args)
}

function install(cert, callback) {
  const {
    platform
  } = process
  const installCmd = INSTALL_CMDS[platform]

  if (!installCmd) {
    return callback(new Error('Platform not supported: ' + platform))
  }

  if (!installCmd.exec && !installCmd.args) {
    console.warn('Certificate created but cannot install locally for this platform, skipping')
    return callback()
  }

  exec(installCmd.exec, installCmd.args, function (error, stdout, stderr) {
    console.log(stdout)
    console.error(stderr)
    assert(error)

    callback()
  })
}

function assert(error) {
  if (error) {
    throw error
  }
}

function write(filename, data) {
  return function (callback) {
    const filepath = path.join(CERTS_FOLDER, filename)
    fs.writeFile(filepath, data, callback)
  }
}

pem.createCertificate({
  keyBitsize: 4096,
  country: 'JP',
  state: 'Tokyo',
  locality: 'Chuo-ku',
  organization: 'MAGE',
  organizationUnit: 'HTTPS',
  commonName: 'localhost',
  altNames: [
    'localhost'
  ],
  days: 1,
  selfSigned: true
}, (error, res) => {
  assert(error)
  const { serviceKey: key, certificate: cert } = res

  mkdirp(CERTS_FOLDER, function (error) {
    assert(error)

    async.parallel([
      write('localhost.key', key),
      write('localhost.cer', cert)
    ], function (error) {
      assert(error)
      install('localhost.cer', (error) => assert(error))
    })
  })
})

