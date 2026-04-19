// 配置你的 GitHub 信息
const USER = 'Joyce-haoyu'; 
const REPO = 'downloadjoyce09.com';

async function fetchGitHubFiles(path) {
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('获取文件失败:', error);
        return [];
    }
}

async function renderSite() {
    const softwareList = document.getElementById('software-list');
    const galleryList = document.getElementById('gallery-list');

    // 1. 处理软件
    const softwareFiles = await fetchGitHubFiles('software');
    softwareList.innerHTML = '';
    if (Array.isArray(softwareFiles)) {
        softwareFiles.forEach(file => {
            if (file.type === 'file') {
                softwareList.innerHTML += `
                    <a href="${file.download_url}" class="card">
                        <div class="icon">📦</div>
                        <div style="font-weight:600">${file.name}</div>
                        <div class="btn">立即下载</div>
                    </a>
                `;
            }
        });
    }

    // 2. 处理图库
    const galleryFiles = await fetchGitHubFiles('gallery');
    galleryList.innerHTML = '';
    if (Array.isArray(galleryFiles)) {
        galleryFiles.forEach(file => {
            if (file.type === 'file') {
                const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.mov');
                const mediaHtml = isVideo 
                    ? `<video src="${file.download_url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
                    : `<img src="${file.download_url}" alt="${file.name}">`;
                
                galleryList.innerHTML += `
                    <div class="card">
                        ${mediaHtml}
                        <div style="font-size:12px; color:#86868b">${file.name}</div>
                    </div>
                `;
            }
        });
    }
}

window.onload = renderSite;
