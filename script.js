const CONFIG = {
    user: 'joyce-haoyu',
    repo: 'Downloadjoyce09.com'
};

async function enterFolder(folderName) {
    const homeView = document.getElementById('home-view');
    const folderView = document.getElementById('folder-view');
    const titleText = document.getElementById('folder-title-text');
    
    titleText.innerText = folderName === 'software' ? '软件资源' : '图库预览';
    
    homeView.classList.remove('active');
    folderView.classList.add('active');
    
    await loadGitHubFiles(folderName);
}

function exitFolder() {
    document.getElementById('folder-view').classList.remove('active');
    document.getElementById('home-view').classList.add('active');
}

// 核心升级：读取文件内部的链接
async function loadGitHubFiles(path) {
    const container = document.getElementById('file-list');
    container.innerHTML = '<p>正在同步 Joyce 的最新资源...</p>';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${path}`);
        const data = await res.json();
        container.innerHTML = '';
        
        for (const item of data) {
            if (item.type === 'file') {
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(item.name);
                const isVideo = /\.(mp4|mov)$/i.test(item.name);
                const isSoftware = path === 'software';

                let finalDownloadUrl = item.download_url;
                let displayName = item.name.split('.')[0]; // 去掉后缀名，让UI更干净

                // 如果是软件文件夹，去读取文件里的真实链接
                if (isSoftware) {
                    const contentRes = await fetch(item.download_url);
                    const realLink = await contentRes.text();
                    finalDownloadUrl = realLink.trim(); // 去掉可能的空格或换行
                }

                let preview = `<div style="font-size:40px; margin-bottom:10px;">📦</div>`;
                if (isImage) preview = `<img src="${item.download_url}">`;
                if (isVideo) preview = `<video src="${item.download_url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;

                const card = document.createElement('a');
                card.className = 'file-item';
                card.href = finalDownloadUrl; // 这里现在是真实的安装包链接了
                card.target = "_blank"; // 在新窗口打开，防止刷新当前页
                
                card.innerHTML = `
                    ${preview}
                    <div style="font-size:14px; font-weight:500; color:#fff;">${displayName}</div>
                    ${isSoftware ? '<div style="font-size:12px; color:#86868b; margin-top:5px;">点击跳转下载</div>' : ''}
                `;
                container.appendChild(card);
            }
        }
    } catch (err) {
        container.innerHTML = '<p>连接失败，请检查网络或 GitHub 仓库设置。</p>';
    }
}
