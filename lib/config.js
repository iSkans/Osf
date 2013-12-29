/**
 * Requirements
 */
var _ = require('underscore'),
    path = require('path'),
    $class = {};

$class.data = null;

/**
 * Osf Configuration.
 * @param rootPath Root directory
 * @param publicPath Public directory
 * @returns {*} Configuration
 */
$class.init = function (rootPath, publicPath) {
    rootPath = path.normalize(rootPath);
    publicPath = path.normalize(publicPath);
    $class.data = _.extend({
            rootPath: rootPath,
            publicPath: publicPath
        },
        require(rootPath + '/../package.json'),
        require(rootPath + '/config/default.json'),
        require(rootPath + '/config/' + process.env.NODE_ENV + '.json') || {}
    );
    return $class.data;
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.config = $class;
    }
    exports.config = $class;
}