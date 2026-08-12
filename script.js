const CONFIG = {
    user: 'joyce-haoyu',
    repo: 'downloadjoyce09.com'
};

const CATEGORY_CONFIG = {
    software: {
        title: '软件下载',
        folder: 'software',
        empty: '软件目录暂无内容。把保存 CF R2/R3 直链的 .txt 文件放进 software 文件夹后，这里会自动显示。'
    },
    gallery: {
        title: '图库',
        folder: 'gallery',
        empty: '图库目录暂无内容。把图片或相册文件夹放进 gallery 文件夹后，这里会自动显示缩略图。'
    }
};

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg'];
const LINK_EXTENSIONS = ['.txt', '.url', '.link', '.html'];
let currentCategory = null;
let currentPath = '';

function githubApiUrl(path) {
    return `https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${encodeURIComponentPath(path)}`;
}

function encodeURIComponentPath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
}

function getExtension(fileName) {
    const index = fileName.lastIndexOf('.');
    return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

function getDisplayName(fileName) {
    return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || fileName;
}

function isImage(fileName) {
    return IMAGE_EXTENSIONS.includes(getExtension(fileName));
}

function isLinkFile(fileName) {
    return LINK_EXTENSIONS.includes(getExtension(fileName));
}

function showListView(title) {
    document.getElementById('home-view').classList.remove('active');
    document.getElementById('list-view').classList.add('active');
    document.getElementById('category-title').innerText = title;
}

async function openCategory(categoryName) {
    const category = CATEGORY_CONFIG[categoryName];
    if (!category) return;

    currentCategory = categoryName;
    currentPath = category.folder;
    showListView(category.title);
    await loadDirectory(currentPath);
}

async function openDirectory(path, title) {
    currentPath = path;
    showListView(title);
    await loadDirectory(path);
}

function goBack() {
    if (currentCategory && currentPath !== CATEGORY_CONFIG[currentCategory].folder) {
        openCategory(currentCategory);
        return;
    }

    document.getElementById('list-view').classList.remove('active');
    document.getElementById('home-view').classList.add('active');
    currentCategory = null;
    currentPath = '';
}

function setContainerMessage(message, className = '') {
    const container = document.getElementById('content-grid');
    container.innerHTML = `<div class="grid-message ${className}">${message}</div>`;
}

async function fetchDirectory(path) {
    const response = await fetch(githubApiUrl(path));
    if (!response.ok) {
        throw new Error(`GitHub 目录读取失败：${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
}

async function readDirectLink(file) {
    const response = await fetch(file.download_url);
    if (!response.ok) {
        throw new Error(`链接文件读取失败：${response.status}`);
    }

    const text = await response.text();
    const firstValidLine = text
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line && !line.startsWith('#'));

    return firstValidLine || file.download_url;
}

async function findFirstImageUrl(path) {
    try {
        const files = await fetchDirectory(path);
        const image = files.find((item) => item.type === 'file' && isImage(item.name));
        return image?.download_url || '';
    } catch (error) {
        return '';
    }
}

async function loadDirectory(path) {
    const container = document.getElementById('content-grid');
    const category = CATEGORY_CONFIG[currentCategory];
    setContainerMessage('正在同步 GitHub 云端目录...');

    try {
        const items = await fetchDirectory(path);
        const visibleItems = items
            .filter((item) => !item.name.startsWith('.'))
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name, 'zh-CN');
            });

        container.innerHTML = '';

        if (visibleItems.length === 0) {
            setContainerMessage(category.empty);
            return;
        }

        if (currentCategory === 'software') {
            await renderSoftwareItems(visibleItems, path, container);
        } else if (currentCategory === 'gallery') {
            await renderGalleryItems(visibleItems, path, container);
        }

        if (!container.children.length) {
            setContainerMessage(category.empty);
        }
    } catch (error) {
        console.error(error);
        setContainerMessage('读取失败，请确认 GitHub 仓库为公开仓库、目录存在，并且网络可以访问 GitHub API。', 'error');
    }
}

async function renderSoftwareItems(items, path, container) {
    for (const item of items) {
        if (item.type === 'dir') {
            container.appendChild(createFolderCard(item, '📁', '打开软件目录'));
            continue;
        }

        const targetUrl = isLinkFile(item.name) ? await readDirectLink(item) : item.download_url;
        container.appendChild(createLinkCard({
            href: targetUrl,
            icon: '📦',
            title: getDisplayName(item.name),
            action: '点击直接下载 ⬇️'
        }));
    }
}

async function renderGalleryItems(items, path, container) {
    for (const item of items) {
        if (item.type === 'dir') {
            const coverUrl = await findFirstImageUrl(item.path);
            container.appendChild(createFolderCard(item, coverUrl ? '' : '🖼️', '打开图片目录', coverUrl));
            continue;
        }

        if (!isImage(item.name)) continue;
        container.appendChild(createLinkCard({
            href: item.download_url,
            imageUrl: item.download_url,
            title: getDisplayName(item.name),
            action: '查看原图 ↗'
        }));
    }
}

function createFolderCard(item, icon, action, imageUrl = '') {
    const button = document.createElement('button');
    button.className = 'file-item folder-item';
    button.type = 'button';
    button.onclick = () => openDirectory(item.path, getDisplayName(item.name));
    button.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${getDisplayName(item.name)} 缩略图" loading="lazy">` : `<div class="item-icon">${icon}</div>`}
        <div class="item-title">${getDisplayName(item.name)}</div>
        <div class="item-action">${action}</div>
    `;
    return button;
}

function createLinkCard({ href, icon = '', imageUrl = '', title, action }) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'file-item';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${title} 缩略图" loading="lazy">` : `<div class="item-icon">${icon}</div>`}
        <div class="item-title">${title}</div>
        <div class="item-action">${action}</div>
    `;
    return link;
}
