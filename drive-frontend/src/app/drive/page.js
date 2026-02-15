'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import {
    Shield, Search, FolderPlus, Upload, LayoutGrid, List,
    HardDrive, Share2, Trash2, LogOut, ChevronRight, Home,
    File as FileIcon, Folder, MoreVertical, Download,
    Link2, Trash, RotateCcw, X, Loader, Plus,
    FileText, Image, FileSpreadsheet, FileArchive, Film, Music,
    Menu, Clock
} from 'lucide-react';
import s from './drive.module.css';

const getFileIcon = (mimeType) => {
    if (!mimeType) return FileIcon;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return FileArchive;
    return FileIcon;
};

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(parseInt(bytes)) / Math.log(1024));
    return `${(parseInt(bytes) / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
};

export default function DrivePage() {
    const { user, loading: authLoading, logout, refreshUser } = useAuth();
    const router = useRouter();
    const toast = useToast();

    const [view, setView] = useState('my-drive');
    const [viewMode, setViewMode] = useState('grid');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [quota, setQuota] = useState(null);
    const [trashItems, setTrashItems] = useState([]);
    const [sharedItems, setSharedItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [sharePermission, setSharePermission] = useState('view');
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) api.getQuota().then(d => setQuota(d.data?.storage)).catch(() => { });
    }, [user]);

    const loadContent = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (view === 'trash') {
                const data = await api.listTrash();
                setTrashItems(data.data?.items || []);
            } else if (view === 'shared') {
                const data = await api.listSharedWithMe();
                setSharedItems(data.data?.shares || []);
            } else {
                if (currentFolder) {
                    const data = await api.getFolderContents(currentFolder);
                    setFolders(data.data?.folders || []);
                    setFiles(data.data?.files || []);
                } else {
                    const [fData, fiData] = await Promise.all([api.listFolders(), api.listFiles()]);
                    setFolders(fData.data?.folders || []);
                    setFiles(fiData.data?.files || []);
                }
            }
        } catch { toast.error('Failed to load files'); }
        finally { setLoading(false); }
    }, [user, view, currentFolder, toast]);

    useEffect(() => { loadContent(); }, [loadContent]);

    const openFolder = (folder) => {
        setCurrentFolder(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        setContextMenu(null);
    };

    const navigateBreadcrumb = (index) => {
        if (index === -1) { setCurrentFolder(null); setBreadcrumbs([]); }
        else { setCurrentFolder(breadcrumbs[index].id); setBreadcrumbs(prev => prev.slice(0, index + 1)); }
    };

    const handleFileUpload = async (e) => {
        const fileList = e.target.files;
        if (!fileList?.length) return;
        setUploading(true);
        try {
            await api.uploadFiles(fileList, currentFolder);
            toast.success(`${fileList.length} file(s) uploaded`);
            loadContent(); refreshUser();
            api.getQuota().then(d => setQuota(d.data?.storage)).catch(() => { });
        } catch (err) { toast.error(err.message || 'Upload failed'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const handleDrop = async (e) => {
        e.preventDefault(); setDragOver(false);
        const droppedFiles = e.dataTransfer.files;
        if (!droppedFiles?.length) return;
        setUploading(true);
        try {
            await api.uploadFiles(droppedFiles, currentFolder);
            toast.success(`${droppedFiles.length} file(s) uploaded`);
            loadContent(); refreshUser();
            api.getQuota().then(d => setQuota(d.data?.storage)).catch(() => { });
        } catch (err) { toast.error(err.message || 'Upload failed'); }
        finally { setUploading(false); }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await api.createFolder(newFolderName.trim(), currentFolder);
            toast.success('Folder created');
            setShowNewFolder(false); setNewFolderName(''); loadContent();
        } catch (err) { toast.error(err.message || 'Failed to create folder'); }
    };

    const handleDownload = async (file) => {
        try {
            const blob = await api.downloadFile(file.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = file.originalName || file.name;
            a.click(); URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch (err) { toast.error(err.message || 'Download failed'); }
        setContextMenu(null);
    };

    const handleDelete = async (item, type) => {
        try {
            type === 'folder' ? await api.deleteFolder(item.id) : await api.deleteFile(item.id);
            toast.success('Moved to trash'); loadContent(); refreshUser();
        } catch (err) { toast.error(err.message || 'Delete failed'); }
        setContextMenu(null);
    };

    const handleRestore = async (item) => {
        try { await api.restoreFromTrash(item.id); toast.success('Restored'); loadContent(); }
        catch (err) { toast.error(err.message || 'Restore failed'); }
    };

    const handlePermanentDelete = async (item) => {
        try { await api.permanentDelete(item.id); toast.success('Permanently deleted'); loadContent(); }
        catch (err) { toast.error(err.message || 'Delete failed'); }
    };

    const handleEmptyTrash = async () => {
        try { await api.emptyTrash(); toast.success('Trash emptied'); loadContent(); }
        catch (err) { toast.error(err.message || 'Failed to empty trash'); }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        try { const data = await api.search(searchQuery); setSearchResults(data.data?.results || []); }
        catch { toast.error('Search failed'); }
    };

    const clearSearch = () => { setSearchQuery(''); setSearchResults(null); };

    const handleShare = async () => {
        if (!shareEmail.trim() || !shareTarget) return;
        try {
            await api.shareWithUser(shareTarget.type, shareTarget.id, shareEmail, sharePermission);
            toast.success(`Shared with ${shareEmail}`);
            setShowShareModal(false); setShareEmail(''); setShareTarget(null);
        } catch (err) { toast.error(err.message || 'Share failed'); }
    };

    const handleLogout = () => { logout(); router.push('/login'); };

    if (authLoading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <Loader size={24} className="spinner" style={{ color: 'var(--accent)' }} />
            </div>
        );
    }

    const quotaPercent = quota ? Math.round((parseInt(quota.used) / parseInt(quota.quota)) * 100) : 0;

    return (
        <div className={s.driveLayout} onClick={() => setContextMenu(null)}>
            {/* Sidebar */}
            <aside className={`${s.sidebar} ${mobileSidebar ? s.sidebarOpen : ''}`}>
                <div className={s.sidebarHead}>
                    <div className={s.sidebarLogo}>
                        <div className={s.logoMark}><Shield size={16} /></div>
                        <span className={s.logoText}>Vault</span>
                    </div>
                </div>

                <button className={`${s.newBtn} btn btn-primary`} onClick={() => document.getElementById('fileInput').click()}>
                    <Plus size={15} /> New Upload
                </button>
                <input id="fileInput" type="file" multiple hidden onChange={handleFileUpload} />

                <nav className={s.nav}>
                    <div className={s.navSectionLabel}>WORKSPACE</div>
                    <button className={`${s.navItem} ${view === 'my-drive' ? s.navItemActive : ''}`}
                        onClick={() => { setView('my-drive'); setCurrentFolder(null); setBreadcrumbs([]); clearSearch(); setMobileSidebar(false); }}>
                        <HardDrive size={16} /> My Drive
                    </button>
                    <button className={`${s.navItem} ${view === 'shared' ? s.navItemActive : ''}`}
                        onClick={() => { setView('shared'); clearSearch(); setMobileSidebar(false); }}>
                        <Share2 size={16} /> Shared with me
                    </button>
                    <button className={`${s.navItem} ${view === 'trash' ? s.navItemActive : ''}`}
                        onClick={() => { setView('trash'); clearSearch(); setMobileSidebar(false); }}>
                        <Trash2 size={16} /> Trash
                    </button>
                </nav>

                <div className={s.sidebarFooter}>
                    {quota && (
                        <div className={s.quotaBox}>
                            <div className={s.quotaHeader}>
                                <span className={s.quotaLabel}>Storage</span>
                                <span className={s.quotaValue}>{formatSize(quota.used)} <span className={s.quotaDim}>/ {formatSize(quota.quota)}</span></span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{
                                    width: `${Math.min(quotaPercent, 100)}%`,
                                    background: quotaPercent > 90 ? 'var(--danger)' : quotaPercent > 70 ? 'var(--warning)' : undefined
                                }} />
                            </div>
                        </div>
                    )}
                    <div className={s.navDivider} />
                    <button className={`${s.navItem} ${s.logoutItem}`} onClick={handleLogout}>
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </aside>

            {mobileSidebar && <div className={s.sidebarOverlay} onClick={() => setMobileSidebar(false)} />}

            {/* Main */}
            <main className={s.main}>
                {/* Header bar */}
                <header className={s.topbar}>
                    <button className={`${s.mobMenu} btn-icon btn-ghost`} onClick={() => setMobileSidebar(true)}>
                        <Menu size={18} />
                    </button>

                    <form className={s.searchForm} onSubmit={handleSearch}>
                        <Search size={15} className={s.searchIcon} />
                        <input
                            type="text" className={s.searchInput} placeholder="Search files & folders..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" className={`${s.searchClear} btn-icon btn-ghost`} onClick={clearSearch}><X size={14} /></button>
                        )}
                    </form>

                    <div className={s.topbarRight}>
                        <div className={s.viewBtns}>
                            <button className={`btn btn-icon btn-ghost ${viewMode === 'grid' ? s.vbActive : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
                            <button className={`btn btn-icon btn-ghost ${viewMode === 'list' ? s.vbActive : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
                        </div>
                        <div className={s.avatar} title={user.name}>{user.name?.charAt(0).toUpperCase()}</div>
                    </div>
                </header>

                {/* Content */}
                <div className={`${s.content} ${dragOver ? s.dragOver : ''}`}
                    onDrop={view === 'my-drive' ? handleDrop : undefined}
                    onDragOver={view === 'my-drive' ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
                    onDragLeave={view === 'my-drive' ? () => setDragOver(false) : undefined}
                >
                    {uploading && (
                        <div className={s.uploadIndicator}>
                            <Loader size={14} className="spinner" /> Uploading files...
                        </div>
                    )}

                    {/* Search results */}
                    {searchResults !== null ? (
                        <section>
                            <div className={s.sectionBar}>
                                <h2 className={s.sectionHeading}>Results for &quot;{searchQuery}&quot;</h2>
                                <button className="btn btn-ghost btn-sm" onClick={clearSearch}>Clear</button>
                            </div>
                            {searchResults.length === 0 ? (
                                <div className="empty-state"><Search size={40} /><h3>No results</h3><p>Try a different search term</p></div>
                            ) : (
                                <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                                    {searchResults.map(item => (
                                        <ItemCard key={item.id} item={{ ...item, originalName: item.name }} type={item.type} viewMode={viewMode}
                                            onClick={() => item.type === 'folder' ? openFolder(item) : null}
                                            onContext={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ item, type: item.type, x: e.clientX, y: e.clientY }); }}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : view === 'trash' ? (
                        <section>
                            <div className={s.sectionBar}>
                                <h2 className={s.sectionHeading}>Trash</h2>
                                {trashItems.length > 0 && <button className="btn btn-danger btn-sm" onClick={handleEmptyTrash}>Empty Trash</button>}
                            </div>
                            {trashItems.length === 0 ? (
                                <div className="empty-state"><Trash2 size={40} /><h3>Trash is empty</h3><p>Deleted items will appear here</p></div>
                            ) : (
                                <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                                    {trashItems.map(item => (
                                        <TrashCard key={item.id} item={item} onRestore={() => handleRestore(item)} onDelete={() => handlePermanentDelete(item)} />
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : view === 'shared' ? (
                        <section>
                            <div className={s.sectionBar}><h2 className={s.sectionHeading}>Shared with me</h2></div>
                            {sharedItems.length === 0 ? (
                                <div className="empty-state"><Share2 size={40} /><h3>Nothing shared yet</h3><p>Files shared with you will appear here</p></div>
                            ) : (
                                <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                                    {sharedItems.map(item => (
                                        <div key={item.id} className={s.sharedCard}>
                                            <Share2 size={18} className={s.scIcon} />
                                            <span className={s.scName}>{item.resource?.originalName || item.resource?.name || 'Shared item'}</span>
                                            <span className="badge badge-accent">{item.permission}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : (
                        /* My Drive */
                        <>
                            <div className={s.breadcrumbs}>
                                <button className={s.bcItem} onClick={() => navigateBreadcrumb(-1)}><Home size={14} /> My Drive</button>
                                {breadcrumbs.map((bc, i) => (
                                    <span key={bc.id} className={s.bcSeg}>
                                        <ChevronRight size={12} className={s.bcSep} />
                                        <button className={s.bcItem} onClick={() => navigateBreadcrumb(i)}>{bc.name}</button>
                                    </span>
                                ))}
                            </div>

                            <div className={s.actionsBar}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewFolder(true)}><FolderPlus size={14} /> New Folder</button>
                                <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('fileInput').click()}><Upload size={14} /> Upload</button>
                            </div>

                            {loading ? (
                                <div className={s.gridView}>
                                    {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-md)' }} />)}
                                </div>
                            ) : folders.length === 0 && files.length === 0 ? (
                                <div className="empty-state">
                                    <Upload size={40} /><h3>No files yet</h3><p>Upload files or create a folder to get started</p>
                                </div>
                            ) : (
                                <>
                                    {folders.length > 0 && (
                                        <section>
                                            <div className={s.sectionLabel}>Folders</div>
                                            <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                                                {folders.map(f => (
                                                    <ItemCard key={f.id} item={f} type="folder" viewMode={viewMode}
                                                        onClick={() => openFolder(f)}
                                                        onContext={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ item: f, type: 'folder', x: e.clientX, y: e.clientY }); }}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    {files.length > 0 && (
                                        <section style={{ marginTop: 20 }}>
                                            <div className={s.sectionLabel}>Files</div>
                                            <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                                                {files.map(f => (
                                                    <ItemCard key={f.id} item={f} type="file" viewMode={viewMode}
                                                        onContext={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ item: f, type: 'file', x: e.clientX, y: e.clientY }); }}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Context Menu */}
            {contextMenu && (
                <div className={`dropdown-menu ${s.ctxMenu}`} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 200 }}
                    onClick={(e) => e.stopPropagation()}>
                    {contextMenu.type === 'file' && (
                        <button className="dropdown-item" onClick={() => handleDownload(contextMenu.item)}><Download size={14} /> Download</button>
                    )}
                    <button className="dropdown-item" onClick={() => { setShareTarget({ id: contextMenu.item.id, type: contextMenu.type }); setShowShareModal(true); setContextMenu(null); }}>
                        <Share2 size={14} /> Share
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={() => handleDelete(contextMenu.item, contextMenu.type)}>
                        <Trash size={14} /> Move to Trash
                    </button>
                </div>
            )}

            {/* New Folder Modal */}
            {showNewFolder && (
                <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Folder</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowNewFolder(false)}><X size={16} /></button>
                        </div>
                        <div className="input-group">
                            <label>Folder name</label>
                            <input type="text" className="input" placeholder="Untitled folder" value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)} autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowNewFolder(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateFolder}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Share</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowShareModal(false)}><X size={16} /></button>
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input type="email" className="input" placeholder="user@example.com" value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)} autoFocus />
                        </div>
                        <div className="input-group" style={{ marginTop: 10 }}>
                            <label>Permission</label>
                            <select className="input" value={sharePermission} onChange={(e) => setSharePermission(e.target.value)}>
                                <option value="view">View</option><option value="edit">Edit</option><option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleShare}><Link2 size={14} /> Share</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Item Card (File/Folder) ---- */
function ItemCard({ item, type, viewMode, onClick, onContext }) {
    const Icon = type === 'folder' ? Folder : getFileIcon(item.mimeType);
    const name = item.originalName || item.name;

    if (viewMode === 'list') {
        return (
            <div className={`${s.listCard} ${onClick ? s.listCardClickable : ''}`} onClick={onClick} onContextMenu={onContext}
                role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
                <Icon size={17} className={`${s.lcIcon} ${type === 'folder' ? s.gcIconFolder : s.gcIconFile}`} />
                <span className={s.lcName}>{name}</span>
                <span className={s.lcMeta}>{type === 'file' ? formatSize(item.size) : ''}</span>
                <span className={s.lcMeta}>{formatDate(item.created_at || item.createdAt)}</span>
                <button className={`btn btn-icon btn-ghost ${s.lcMore}`} onClick={onContext}><MoreVertical size={14} /></button>
            </div>
        );
    }

    return (
        <div className={`${s.gridCard} ${onClick ? s.gridCardClickable : ''} ${type === 'folder' ? s.gridCardFolder : ''}`}
            onClick={onClick} onContextMenu={onContext}
            role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
            <div className={s.gcIconArea}>
                <Icon size={28} className={type === 'folder' ? s.gcIconFolder : s.gcIconFile} />
            </div>
            <div className={s.gcInfo}>
                <span className={s.gcName}>{name}</span>
                <span className={s.gcMeta}>{type === 'file' ? formatSize(item.size) : formatDate(item.created_at || item.createdAt)}</span>
            </div>
        </div>
    );
}

/* ---- Trash Card ---- */
function TrashCard({ item, onRestore, onDelete }) {
    const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);
    return (
        <div className={s.trashCard}>
            <Icon size={17} className={s.tcIcon} />
            <div className={s.tcInfo}>
                <span className={s.tcName}>{item.originalName || item.name}</span>
                <span className={s.tcMeta}><Clock size={10} /> {formatDate(item.deleted_at || item.deletedAt)}</span>
            </div>
            <button className="btn btn-icon btn-ghost" title="Restore" onClick={onRestore}><RotateCcw size={14} /></button>
            <button className="btn btn-icon btn-ghost" title="Delete forever" onClick={onDelete}>
                <Trash size={14} style={{ color: 'var(--danger)' }} />
            </button>
        </div>
    );
}
