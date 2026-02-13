const User = require('../modules/users/user.model');
const File = require('../modules/files/file.model');
const Folder = require('../modules/folders/folder.model');
const Share = require('../modules/shares/share.model');

// User associations
User.hasMany(File, { foreignKey: 'owner_id', as: 'files' });
User.hasMany(Folder, { foreignKey: 'owner_id', as: 'folders' });
User.hasMany(Share, { foreignKey: 'shared_by_id', as: 'sharesCreated' });
User.hasMany(Share, { foreignKey: 'shared_with_id', as: 'sharesReceived' });

// File associations
File.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
File.belongsTo(Folder, { foreignKey: 'folder_id', as: 'folder' });

// Folder associations
Folder.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Folder.hasMany(File, { foreignKey: 'folder_id', as: 'files' });

// Share associations
Share.belongsTo(User, { foreignKey: 'shared_by_id', as: 'sharedBy' });
Share.belongsTo(User, { foreignKey: 'shared_with_id', as: 'sharedWith' });

module.exports = { User, File, Folder, Share };
