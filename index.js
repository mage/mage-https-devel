const proxy = require('http-proxy')
const fs = require('fs')
const url = require('url')

function getRemoteTarget(bind) {
  if (bind.port) {
    return `http://localhost:${bind.port}`
  }

  const {
    port
  } = url.parse(bind)

  return `http://localhost:${port}`
}

exports.setup = function (mage) {
  mage.on('readyToStart', () => {
    const logger = mage.logger.context('https')
    const port = 8443
    let ssl

    const {
      httpsProxy: isHttpsProxyEnabled,
      bind
    } = mage.core.config.get('server.clientHost')

    if (!isHttpsProxyEnabled) {
      return
    }

    const target = getRemoteTarget(bind)

    try {
      ssl = {
        key: fs.readFileSync(path.join(__dirname, './certs/localhost.key')),
        cert: fs.readFileSync(path.join(__dirname, './certs/localhost.cer'))
      }
    } catch (error) {
      logger.emergency('Failed to load certificate files', error)
      mage.quit(-1)
    }

    logger.debug('Starting HTTPS proxy')

    proxy
      .createServer({ target, ssl, ws: true, proxyTimeout: 60 * 1000 })
      .on('error', (error) => logger.error('Proxy error', error))
      .listen(port, () => logger.notice('HTTPS proxy server started', {
        port,
        target
      }))
  })
}
