const File = require('./file.model');
const FileVersion = require('./fileVersion.model');
const storageService = require('../../services/storage.service');
const ApiError = require('../../utils/ApiError');
const quotaService = require('../../services/quota.service');

/**
 * Upload a file (creates new or new version)
 */
const uploadFile = async (fileData, ownerId, { folderId = null, isEncrypted = false } = {}) => {
    const fileSize = fileData.size;

    // Check quota
    const user = await quotaService.getUser(ownerId);
    if (!user.hasAvailableStorage(fileSize)) {
        // Delete uploaded file
        await storageService.delete(fileData.filename);
        throw ApiError.badRequest('Storage quota exceeded');
    }

    const fileInfo = await storageService.save(fileData);

    // Check if file with same name exists in folder
    const existingFile = await File.findOne({
        where: {
            originalName: fileInfo.originalName,
            folderId,
            ownerId,
        },
    });

    let file;
    if (existingFile) {
        // Create new version
        const newVersion = existingFile.currentVersion + 1;

        // Save old version
        await FileVersion.create({
            fileId: existingFile.id,
            versionNumber: existingFile.currentVersion,
            filename: existingFile.filename,
            size: existingFile.size,
            path: existingFile.path,
            uploadedAt: existingFile.updated_at,
        });

        // Update file with new version
        existingFile.filename = fileInfo.filename;
        existingFile.size = fileInfo.size;
        existingFile.path = fileInfo.path;
        existingFile.mimeType = fileInfo.mimeType;
        existingFile.currentVersion = newVersion;
        existingFile.isEncrypted = isEncrypted;
        await existingFile.save();

        file = existingFile;
    } else {
        // Create new file
        file = await File.create({
            originalName: fileInfo.originalName,
            filename: fileInfo.filename,
            mimeType: fileInfo.mimeType,
            size: fileInfo.size,
            path: fileInfo.path,
            folderId,
            ownerId,
            isEncrypted,
        });
    }

    // Update quota
    await quotaService.updateUsage(ownerId, fileSize);

    return file;
};

/**
 * List files for a user
 */
const listFiles = async (ownerId, { folderId = null, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;

    const where = { ownerId };
    if (folderId !== undefined) {
        where.folderId = folderId;
    }

    const { count, rows: files } = await File.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'originalName', 'filename', 'mimeType', 'size', 'currentVersion', 'created_at', 'updated_at'],
    });

    return {
        files,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get single file by ID
 */
const getFile = async (fileId, ownerId) => {
    const file = await File.findOne({
        where: { id: fileId, ownerId },
    });

    if (!file) {
        throw ApiError.notFound('File not found');
    }

    return file;
};

/**
 * Get file for download
 */
const getFileForDownload = async (fileId, ownerId) => {
    const file = await getFile(fileId, ownerId);

    const exists = await storageService.exists(file.filename);
    if (!exists) {
        throw ApiError.notFound('File not found on storage');
    }

    return {
        buffer: await storageService.getBuffer(file.filename),
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
    };
};

/**
 * Delete a file
 */
const deleteFile = async (fileId, ownerId) => {
    const file = await getFile(fileId, ownerId);

    // Soft delete
    await file.destroy();

    // Update quota (subtract file size)
    await quotaService.updateUsage(ownerId, -file.size);

    return { message: 'File moved to trash' };
};

/**
 * Get file version history
 */
const getVersions = async (fileId, ownerId) => {
    const file = await getFile(fileId, ownerId);

    const versions = await FileVersion.findAll({
        where: { fileId: file.id },
        order: [['version_number', 'DESC']],
        attributes: ['id', 'versionNumber', 'size', 'uploadedAt'],
    });

    // Add current version
    const allVersions = [
        {
            id: file.id,
            versionNumber: file.currentVersion,
            size: file.size,
            uploadedAt: file.updated_at,
            isCurrent: true,
        },
        ...versions.map(v => ({ ...v.toJSON(), isCurrent: false })),
    ];

    return allVersions;
};

/**
 * Restore a specific version
 */
const restoreVersion = async (fileId, versionId, ownerId) => {
    const file = await getFile(fileId, ownerId);

    const version = await FileVersion.findOne({
        where: { id: versionId, fileId },
    });

    if (!version) {
        throw ApiError.notFound('Version not found');
    }

    // Check if version file still exists
    const exists = await storageService.exists(version.filename);
    if (!exists) {
        throw ApiError.notFound('Version file not found on storage');
    }

    // Save current as a version
    await FileVersion.create({
        fileId: file.id,
        versionNumber: file.currentVersion,
        filename: file.filename,
        size: file.size,
        path: file.path,
        uploadedAt: file.updated_at,
    });

    // Calculate size difference for quota
    const sizeDiff = version.size - file.size;

    // Restore the old version as current
    file.filename = version.filename;
    file.size = version.size;
    file.path = version.path;
    file.currentVersion = file.currentVersion + 1;
    await file.save();

    // Update quota
    await quotaService.updateUsage(ownerId, sizeDiff);

    return file;
};

/**
 * Move file to a different folder
 */
const moveFile = async (fileId, ownerId, { folderId }) => {
    const file = await getFile(fileId, ownerId);

    file.folderId = folderId || null;
    await file.save();

    return file;
};

module.exports = {
    uploadFile,
    listFiles,
    getFile,
    getFileForDownload,
    deleteFile,
    getVersions,
    restoreVersion,
    moveFile,
};
