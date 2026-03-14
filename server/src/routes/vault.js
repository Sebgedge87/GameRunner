const express = require('express');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

makeHiddenToggle(router, 'vault_files');

module.exports = router;
