let localSettings;
try {
    localSettings = require('./config.local.js')
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        localSettings = {}
    } else {
        throw err
    }
}

module.exports = {
    config: {
        ...localSettings,
    }
}
